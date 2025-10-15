# OpenBCI Brainwave Monitor

A real-time brainwave visualization system with customizable audio alerts. This project consists of a .NET 9.0 C# backend that processes OpenBCI EEG data via UDP and broadcasts it via WebSocket, paired with a modern Angular 20 web application for visualization and alert configuration.

## 🧠 Features

### Backend (C# .NET 9.0)
- **UDP Data Reception**: Listens on ports 15000 (Average Band Power) and 15001 (Raw Time Series)
- **Real-time FFT Processing**: Computes band power for Delta, Theta, Alpha, Beta, and Gamma bands
- **WebSocket Broadcasting**: Streams processed data to connected web clients
- **Smart Alert Logic**: Triggers alerts only when dominant band **changes** (not continuously)
- **Band Tracking**: Monitors time spent in each brainwave band

### Frontend (Angular 20)
- **Two-Tier State Display**: 
  - Primary state (30s rolling average) for stable brain state representation
  - Live/current state for instant feedback
  - Confidence indicators showing state stability
- **Real-time Visualization**: Live display of dominant brainwave band with smooth color transitions
- **Band Power Meters**: Visual representation of all 5 brainwave bands with percentages
- **Customizable Audio Alerts**: Per-band audio configuration with multiple options:
  - Preset sounds (beep, chime, bell, tone, click)
  - Custom audio file upload
  - Tone generation with Web Audio API (frequency, wave type, duration)
  - Individual volume control per band
- **Duration Thresholds**: Configure minimum time (0-30 seconds) in a band before alert triggers
- **Progress Indicators**: Visual feedback showing time in band vs. threshold
- **Mobile-First Design**: Optimized for touch interfaces and iOS devices
- **Dark Theme**: High-contrast UI optimized for extended viewing
- **LocalStorage Persistence**: Settings saved across sessions

## 📊 Brainwave Bands

| Band | Frequency Range | Color | Typical State |
|------|----------------|-------|---------------|
| Delta (Δ) | 1-4 Hz | Purple | Deep sleep |
| Theta (θ) | 4-8 Hz | Blue | Meditation, drowsiness |
| Alpha (α) | 8-12 Hz | Green | Relaxed, calm |
| Beta (β) | 13-30 Hz | Orange | Alert, focused |
| Gamma (γ) | 30-45 Hz | Red | High cognitive activity |

## 🚀 Getting Started

### Prerequisites

**Backend:**
- .NET 9.0 SDK or later
- Windows, macOS, or Linux

**Frontend:**
- Node.js 18.x or later
- npm 9.x or later

### Installation

#### 1. Backend Setup (C# Application)

```bash
# Navigate to the backend directory
cd openbci/console-bandalert

# Restore dependencies
dotnet restore

# Build the project
dotnet build

# Run the application
dotnet run
```

The backend will:
- Start listening for UDP data on port 15000 (or 15001 for raw mode)
- Launch WebSocket server on port 8080
- Begin broadcasting data to connected clients

**Configuration:**
Edit `console-bandalert/Program.cs` to change settings:
```csharp
const bool USE_AVERAGE_BANDPOWER = true; // true = Port 15000, false = Port 15001
const int WEBSOCKET_PORT = 8080;
const double DOMINANCE_THRESHOLD = 0.45;
const int STABLE_FRAMES = 4;
```

#### 2. Frontend Setup (Angular Application)

```bash
# Navigate to the Angular project
cd openbci/angular-brainwave-ui

# Install dependencies
npm install

# Start development server
npm start
```

The application will be available at `http://localhost:4200`

**Production Build:**
```bash
npm run build
```
Output will be in `dist/angular-brainwave-ui/`

### Configuration

#### WebSocket URL
Edit `src/environments/environment.ts`:
```typescript
export const environment = {
  production: false,
  websocketUrl: 'ws://localhost:8080'
};
```

For production, edit `src/environments/environment.prod.ts`.

## 📱 Usage

### Dashboard View

1. **Connection Status**: Indicator in top-left shows WebSocket connection state
2. **Dominant Band Display**: Large centered card showing:
   - Current dominant brainwave band
   - Frequency range (e.g., "8-12 Hz")
   - Center frequency (e.g., "10.0 Hz")
   - Time in current band with progress bar
3. **Band Power Distribution**: Five horizontal meters showing power percentage for each band

### Settings View

Click the gear icon to access settings:

#### Audio Configuration (Per Band)

**Audio Source Types:**
1. **Preset**: Choose from built-in sounds
2. **Tone**: Generate tones with Web Audio API
   - Frequency: 100-2000 Hz
   - Wave type: Sine, Square, Sawtooth, Triangle
   - Duration: 50-2000ms
3. **Custom**: Upload your own audio file (MP3, WAV, OGG, max 5MB)
4. **Disabled**: No sound for this band

**Volume Control:**
- Per-band volume (0-100%)
- Master volume control
- Test button to preview sounds

#### Duration Thresholds

For each band, configure:
- **Minimum Duration**: 0-30 seconds (adjustable in 0.5s increments)
- **Enable/Disable**: Toggle alerts for specific bands

**Alert Logic:**
- Alert triggers only when you've been in a band for the configured duration
- Alert fires only when band **changes** from the previously alerted band
- Timer resets when band changes

**Examples:**
- Set Alpha threshold to 2.0s: Alert plays when you enter Alpha state and remain there for 2+ seconds
- Set threshold to 0s: Immediate alert when band becomes dominant
- Disable threshold: No alerts for that band

### Mobile Usage

The app is optimized for mobile devices:
- Portrait orientation recommended
- Touch-friendly interface (44x44px minimum touch targets)
- Works in Safari on iOS
- Can be added to home screen as PWA

**iOS Audio Note**: Due to iOS restrictions, audio playback requires a user gesture. The first time you test a sound in settings, you may need to tap the test button to enable audio.

## 🔊 Audio Setup

### Adding Preset Sounds

1. Navigate to `angular-brainwave-ui/src/assets/sounds/`
2. Add audio files with these names:
   - `beep.mp3`
   - `chime.mp3`
   - `bell.mp3`
   - `tone.mp3`
   - `click.mp3`
3. Restart the Angular dev server

See `src/assets/sounds/README.md` for detailed requirements.

### Recommended Sound Sources

- **Free Libraries**: freesound.org, zapsplat.com, soundbible.com
- **Generate Your Own**: Audacity, GarageBand, online tone generators
- **System Sounds**: Extract from your operating system

## 🏗️ Architecture

### Backend Flow

```
OpenBCI Data → UDP (Port 15000/15001) → C# Application
                                            ↓
                                    FFT Processing
                                            ↓
                                    Band Power Analysis
                                            ↓
                                    Dominance Detection
                                            ↓
                                WebSocket (Port 8080) → Web Clients
```

### Frontend Architecture

**Services:**
- `BrainwaveService`: WebSocket connection, data streaming, reconnection logic
- `AudioService`: Audio playback, file management, Web Audio API, localStorage persistence
- `AlertService`: Duration threshold tracking, timer logic, alert triggering

**Components:**
- `BrainwaveDashboardComponent`: Main visualization and real-time data display
- `AudioSettingsComponent`: Configuration UI for audio and thresholds
- `AppComponent`: Root component with view routing

**State Management:**
- Angular Signals for reactive state
- Computed values for derived state
- LocalStorage for persistence

## 🔧 Troubleshooting

### Backend Issues

**WebSocket won't start:**
- Check if port 8080 is already in use
- Try changing `WEBSOCKET_PORT` in `Program.cs`
- Ensure firewall allows the connection

**No UDP data received:**
- Verify OpenBCI GUI is sending data to the correct port
- Check that `USE_AVERAGE_BANDPOWER` matches your OpenBCI output mode
- Ensure UDP port isn't blocked by firewall

### Frontend Issues

**Can't connect to WebSocket:**
- Ensure C# backend is running
- Verify WebSocket URL in `environment.ts` matches backend
- Check browser console for connection errors

**Audio not playing:**
- On iOS: Tap any test button first to enable audio
- Check master volume and per-band volume settings
- Verify preset audio files exist in `assets/sounds/`
- Try using Tone mode instead of Preset

**Settings not persisting:**
- Check browser LocalStorage isn't disabled
- Clear browser cache and reload
- Try different browser

## 🎯 Advanced Configuration

### Custom Band Ranges

Edit `console-bandalert/Program.cs`:
```csharp
static readonly (string label, double lo, double hi)[] Bands = new[] {
    ("delta", 1.0, 4.0),
    ("theta", 4.0, 8.0),
    ("alpha", 8.0, 12.0),
    ("beta",  13.0, 30.0),
    ("gamma", 30.0, 45.0)
};
```

### Adjust Sensitivity

Change dominance threshold (higher = more strict):
```csharp
const double DOMINANCE_THRESHOLD = 0.45; // 0.0 to 1.0
```

Change stability requirement (higher = longer confirmation):
```csharp
const int STABLE_FRAMES = 4; // Number of consecutive frames
```

### Styling Customization

Band colors are defined in:
- **Tailwind Config**: `angular-brainwave-ui/tailwind.config.js`
- **Service**: `BrainwaveService.BAND_INFO`

## 📦 Project Structure

```
openbci/
├── console-bandalert/                 # C# .NET backend
│   ├── Program.cs                     # C# backend application
│   └── OpenBCI_BandAlert.csproj      # C# project file
└── angular-brainwave-ui/              # Angular frontend
    ├── src/
    │   ├── app/
    │   │   ├── components/
    │   │   │   ├── brainwave-dashboard/
    │   │   │   │   ├── brainwave-dashboard.component.ts
    │   │   │   │   ├── brainwave-dashboard.component.html
    │   │   │   │   └── brainwave-dashboard.component.css
    │   │   │   └── audio-settings/
    │   │   │       ├── audio-settings.component.ts
    │   │   │       ├── audio-settings.component.html
    │   │   │       └── audio-settings.component.css
    │   │   ├── services/
    │   │   │   ├── brainwave.service.ts
    │   │   │   ├── audio.service.ts
    │   │   │   └── alert.service.ts
    │   │   └── app.component.ts
    │   ├── assets/
    │   │   └── sounds/              # Preset audio files
    │   ├── environments/
    │   └── styles.css
    ├── angular.json
    ├── tailwind.config.js
    ├── tsconfig.json
    └── package.json
```

## 🛠️ Development

### Backend Development

**Watch mode:**
```bash
dotnet watch run
```

**Debug mode:**
- Use Visual Studio or VS Code with C# extension
- Set breakpoints in console-bandalert/Program.cs
- Launch with F5

### Frontend Development

**Hot reload:**
```bash
npm start
```

**Linting:**
```bash
ng lint
```

**Testing:**
```bash
ng test
```

## 🚢 Deployment

### Backend Deployment

**Publish self-contained application:**
```bash
dotnet publish -c Release -r win-x64 --self-contained
```

Replace `win-x64` with:
- `linux-x64` for Linux
- `osx-x64` for macOS

### Frontend Deployment

**Build for production:**
```bash
npm run build
```

Deploy the `dist/` folder to:
- Static hosting (Netlify, Vercel, GitHub Pages)
- Web server (nginx, Apache)
- Cloud storage (S3, Azure Blob)

**Update WebSocket URL** in `environment.prod.ts` to point to your production backend.

## 📄 License

This project is provided as-is for OpenBCI brainwave monitoring applications.

## 🤝 Contributing

Feel free to customize and extend this application for your specific needs:
- Add new visualization modes
- Implement data logging
- Create additional alert types
- Integrate with other biofeedback systems

## 📞 Support

For issues or questions:
1. Check the Troubleshooting section
2. Review browser console for errors
3. Verify backend console output
4. Ensure all dependencies are installed

## 🎓 References

- [OpenBCI Documentation](https://docs.openbci.com/)
- [Angular Documentation](https://angular.dev/)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [Brainwave Patterns](https://en.wikipedia.org/wiki/Electroencephalography)

---

**Built with ❤️ for neurofeedback and brainwave monitoring applications**
