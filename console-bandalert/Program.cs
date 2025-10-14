using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Text.Json;
using MathNet.Numerics;
using MathNet.Numerics.IntegralTransforms;
using Fleck;

class Program
{
    // ------------ CONFIG ------------
    const bool USE_AVERAGE_BANDPOWER = true; // Path A: true. Path B (raw DSP): false.
    const int UDP_PORT_AVGBAND = 15000;
    const int UDP_PORT_RAW = 15001;
    const int WEBSOCKET_PORT = 8080;

    // Cyton+Daisy streams at 125 Hz
    const int SAMPLE_RATE = 125;

    // Threshold logic
    const double DOMINANCE_THRESHOLD = 0.45;
    const int STABLE_FRAMES = 4;

    // WebSocket connections
    static List<IWebSocketConnection> allSockets = new List<IWebSocketConnection>();

    // Alert tracking
    static string previousAlertedBand = "";
    static string currentDominantBand = "";
    static DateTime bandStartTime = DateTime.UtcNow;

    static readonly (string label, double lo, double hi)[] Bands = new[] {
        ("delta", 1.0, 4.0),
        ("theta", 4.0, 8.0),
        ("alpha", 8.0, 12.0),
        ("beta",  13.0, 30.0),
        ("gamma", 30.0, 45.0)
    };

    const int RAW_WINDOW_SECONDS = 2;
    static readonly int RAW_WINDOW_SAMPLES = NextPow2(SAMPLE_RATE * RAW_WINDOW_SECONDS);
    const double RAW_OVERLAP = 0.5;

    static void Main()
    {
        Console.WriteLine("OpenBCI Band Alert — C# with WebSocket Server");
        Console.WriteLine($"Mode: {(USE_AVERAGE_BANDPOWER ? "AverageBandPower (UDP 15000)" : "Raw TimeSeries (UDP 15001)")}");
        Console.WriteLine($"WebSocket Server: ws://localhost:{WEBSOCKET_PORT}");
        Console.WriteLine("Press Ctrl+C to exit.\n");

        // Start WebSocket server
        StartWebSocketServer();

        if (USE_AVERAGE_BANDPOWER)
            RunAverageBandPower();
        else
            RunRawTimeSeries();
    }

    static void StartWebSocketServer()
    {
        var server = new WebSocketServer($"ws://0.0.0.0:{WEBSOCKET_PORT}");
        server.Start(socket =>
        {
            socket.OnOpen = () =>
            {
                Console.WriteLine($"WebSocket client connected: {socket.ConnectionInfo.ClientIpAddress}");
                allSockets.Add(socket);
            };
            socket.OnClose = () =>
            {
                Console.WriteLine($"WebSocket client disconnected: {socket.ConnectionInfo.ClientIpAddress}");
                allSockets.Remove(socket);
            };
            socket.OnError = (ex) =>
            {
                Console.WriteLine($"WebSocket error: {ex.Message}");
            };
        });
        Console.WriteLine($"WebSocket server started on port {WEBSOCKET_PORT}");
    }

    static void BroadcastToClients(string json)
    {
        foreach (var socket in allSockets.ToList())
        {
            if (socket.IsAvailable)
            {
                socket.Send(json);
            }
        }
    }

    // -------- PATH A: GUI Average Band Power -----------
    static void RunAverageBandPower()
    {
        using var udp = new UdpClient(UDP_PORT_AVGBAND);
        var ep = new IPEndPoint(IPAddress.Any, UDP_PORT_AVGBAND);

        string localCurrentDominant = "";
        int stableCount = 0;

        while (true)
        {
            var bytes = udp.Receive(ref ep);
            var json = Encoding.UTF8.GetString(bytes);

            try
            {
                using var doc = JsonDocument.Parse(json);
                if (!doc.RootElement.TryGetProperty("type", out var tProp)) continue;
                var type = tProp.GetString();

                if (type == "averageBandPower")
                {
                    var arr = doc.RootElement.GetProperty("data").EnumerateArray().Select(x => x.GetDouble()).ToArray();
                    if (arr.Length < 5) continue;

                    var labels = Bands.Select(b => b.label).ToArray();
                    int idx = ArgMax(arr);
                    string dom = labels[idx];
                    double frac = arr[idx];

                    // Track band changes for time calculation
                    if (dom != currentDominantBand)
                    {
                        currentDominantBand = dom;
                        bandStartTime = DateTime.UtcNow;
                    }

                    if (dom == localCurrentDominant && frac >= DOMINANCE_THRESHOLD) stableCount++;
                    else
                    {
                        localCurrentDominant = dom;
                        stableCount = (frac >= DOMINANCE_THRESHOLD) ? 1 : 0;
                    }

                    // Calculate time in current band
                    double timeInBand = (DateTime.UtcNow - bandStartTime).TotalSeconds;

                    // Get dominant frequency with variation
                    // Note: In AvgBandPower mode, we don't receive FFT bins, only aggregated powers
                    // So we estimate frequency within the band range weighted by power
                    double bandWidth = Bands[idx].hi - Bands[idx].lo;
                    double dominantFrequency = Bands[idx].lo + (bandWidth * frac); // Weight by power fraction

                    bool isAlert = false;
                    if (stableCount >= STABLE_FRAMES)
                    {
                        isAlert = Alert(dom, frac);
                        stableCount = 0;
                    }

                    // Broadcast to WebSocket clients
                    var wsMessage = new
                    {
                        timestamp = DateTime.UtcNow.ToString("o"),
                        dominantBand = dom,
                        dominantFrequency = Math.Round(dominantFrequency, 1),
                        timeInBand = Math.Round(timeInBand, 2),
                        bandPowers = new
                        {
                            delta = arr[0],
                            theta = arr[1],
                            alpha = arr[2],
                            beta = arr[3],
                            gamma = arr[4]
                        },
                        isAlert = isAlert
                    };
                    BroadcastToClients(JsonSerializer.Serialize(wsMessage));

                    Console.WriteLine($"{Timestamp()}  Δ:{arr[0]:0.000} θ:{arr[1]:0.000} α:{arr[2]:0.000} β:{arr[3]:0.000} γ:{arr[4]:0.000}  => dominant={dom} ({frac:P0}) time={timeInBand:0.0}s");
                }
            }
            catch { }
        }
    }

    // -------- PATH B: RAW DSP -----------
    static void RunRawTimeSeries()
    {
        using var udp = new UdpClient(UDP_PORT_RAW);
        var ep = new IPEndPoint(IPAddress.Any, UDP_PORT_RAW);

        double[][] ring = null!;
        int ringPos = 0;
        int ringLen = RAW_WINDOW_SAMPLES;

        string localCurrentDominant = "";
        int stableCount = 0;

        while (true)
        {
            var bytes = udp.Receive(ref ep);
            var json = Encoding.UTF8.GetString(bytes);
            try
            {
                using var doc = JsonDocument.Parse(json);
                if (!doc.RootElement.TryGetProperty("type", out var tProp)) continue;
                if (tProp.GetString() != "timeSeriesRaw") continue;

                var data = doc.RootElement.GetProperty("data");
                var chArrays = data.EnumerateArray().Select(a => a.EnumerateArray().Select(x => (double)x.GetDouble()).ToArray()).ToArray();

                if (ring == null)
                {
                    int chCount = chArrays.Length;
                    ring = Enumerable.Range(0, chCount).Select(_ => new double[ringLen]).ToArray();
                }

                int samplesInChunk = chArrays[0].Length;
                for (int s = 0; s < samplesInChunk; s++)
                {
                    for (int ch = 0; ch < ring.Length; ch++)
                        ring[ch][ringPos] = chArrays[ch][s];

                    ringPos = (ringPos + 1) % ringLen;
                }

                if ((ringPos % (int)(ringLen * (1 - RAW_OVERLAP))) == 0)
                {
                    var bandFrac = ComputeBandFractionsFromRing(ring, SAMPLE_RATE);
                    int idx = ArgMax(bandFrac);
                    string dom = Bands[idx].label;
                    double frac = bandFrac[idx];

                    // Track band changes for time calculation
                    if (dom != currentDominantBand)
                    {
                        currentDominantBand = dom;
                        bandStartTime = DateTime.UtcNow;
                    }

                    if (dom == localCurrentDominant && frac >= DOMINANCE_THRESHOLD) stableCount++;
                    else
                    {
                        localCurrentDominant = dom;
                        stableCount = (frac >= DOMINANCE_THRESHOLD) ? 1 : 0;
                    }

                    // Calculate time in current band
                    double timeInBand = (DateTime.UtcNow - bandStartTime).TotalSeconds;

                    // Get dominant frequency with variation
                    // Note: In AvgBandPower mode, we don't receive FFT bins, only aggregated powers
                    // So we estimate frequency within the band range weighted by power
                    double bandWidth = Bands[idx].hi - Bands[idx].lo;
                    double dominantFrequency = Bands[idx].lo + (bandWidth * frac); // Weight by power fraction

                    bool isAlert = false;
                    if (stableCount >= STABLE_FRAMES)
                    {
                        isAlert = Alert(dom, frac);
                        stableCount = 0;
                    }

                    // Broadcast to WebSocket clients
                    var wsMessage = new
                    {
                        timestamp = DateTime.UtcNow.ToString("o"),
                        dominantBand = dom,
                        dominantFrequency = Math.Round(dominantFrequency, 1),
                        timeInBand = Math.Round(timeInBand, 2),
                        bandPowers = new
                        {
                            delta = bandFrac[0],
                            theta = bandFrac[1],
                            alpha = bandFrac[2],
                            beta = bandFrac[3],
                            gamma = bandFrac[4]
                        },
                        isAlert = isAlert
                    };
                    BroadcastToClients(JsonSerializer.Serialize(wsMessage));

                    Console.WriteLine($"{Timestamp()} RAW ⇒ Δ:{bandFrac[0]:0.000} θ:{bandFrac[1]:0.000} α:{bandFrac[2]:0.000} β:{bandFrac[3]:0.000} γ:{bandFrac[4]:0.000}  => dominant={dom} ({frac:P0}) time={timeInBand:0.0}s");
                }
            }
            catch { }
        }
    }

    static double[] ComputeBandFractionsFromRing(double[][] ring, int fs)
    {
        int N = RAW_WINDOW_SAMPLES;
        int hop = (int)(N * (1 - RAW_OVERLAP));
        int segments = (ring[0].Length - N) / hop + 1;
        if (segments < 1) segments = 1;

        double[][] seq = ring.Select(chbuf => (double[])chbuf.Clone()).ToArray();
        double[] psdAvg = null!;

        for (int seg = 0; seg < segments; seg++)
        {
            int start = seg * hop;
            double[] psd = null!;
            for (int ch = 0; ch < seq.Length; ch++)
            {
                var slice = new double[N];
                Array.Copy(seq[ch], start, slice, 0, Math.Min(N, seq[ch].Length - start));
                DetrendInPlace(slice);
                ApplyHannInPlace(slice);

                var fft = slice.Select(v => new Complex32((float)v, 0f)).ToArray();
                Fourier.Forward(fft, FourierOptions.NoScaling);

                int K = N / 2 + 1;
                var p = new double[K];
                for (int k = 0; k < K; k++)
                    p[k] = fft[k].Magnitude * fft[k].Magnitude;

                if (psd == null) psd = new double[K];
                for (int k = 0; k < K; k++) psd[k] += p[k];
            }

            for (int k = 0; k < psd.Length; k++) psd[k] /= seq.Length;

            if (psdAvg == null) psdAvg = new double[psd.Length];
            for (int k = 0; k < psd.Length; k++) psdAvg[k] += psd[k];
        }

        for (int k = 0; k < psdAvg.Length; k++) psdAvg[k] /= segments;

        double df = (double)fs / N;
        double[] bandPowers = new double[Bands.Length];
        for (int b = 0; b < Bands.Length; b++)
        {
            int kLo = (int)Math.Round(Bands[b].lo / df);
            int kHi = (int)Math.Round(Bands[b].hi / df);
            kLo = Math.Clamp(kLo, 1, psdAvg.Length - 1);
            kHi = Math.Clamp(kHi, 1, psdAvg.Length - 1);
            double sum = 0;
            for (int k = kLo; k <= kHi; k++) sum += psdAvg[k];
            bandPowers[b] = sum;
        }

        double total = bandPowers.Sum();
        if (total <= 0) total = 1;
        for (int i = 0; i < bandPowers.Length; i++) bandPowers[i] /= total;
        return bandPowers;
    }

    static void DetrendInPlace(double[] x)
    {
        double mean = x.Average();
        for (int i = 0; i < x.Length; i++) x[i] -= mean;
    }

    static void ApplyHannInPlace(double[] x)
    {
        int N = x.Length;
        if (N <= 1) return;
        for (int n = 0; n < N; n++)
        {
            double w = 0.5 * (1.0 - Math.Cos(2.0 * Math.PI * n / (N - 1)));
            x[n] *= w;
        }
    }

    static int ArgMax(double[] a) { int i=0; double v=a[0]; for (int k=1;k<a.Length;k++) if (a[k]>v){v=a[k]; i=k;} return i; }
    static string Timestamp() => DateTime.Now.ToString("HH:mm:ss.fff");

    static bool Alert(string band, double frac)
    {
        // Only alert if the band has CHANGED from the previous alerted band
        if (band != previousAlertedBand)
        {
            // Console.Beep(1000, 200);  // Disabled - UI handles audio alerts
            Console.WriteLine($"*** ALERT: Dominant band CHANGED to {band.ToUpper()} ({frac:P0}) ***\n");
            previousAlertedBand = band;
            return true;
        }
        return false;
    }

    static int NextPow2(int n) { int p=1; while(p<n) p<<=1; return p; }
}
