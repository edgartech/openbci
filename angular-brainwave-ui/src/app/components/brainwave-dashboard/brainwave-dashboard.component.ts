import { Component, computed, signal, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrainwaveService, BAND_INFO, BrainwaveBand } from '../../services/brainwave.service';
import { AlertService } from '../../services/alert.service';
import { SessionService } from '../../services/session.service';
import { WaveformDisplayComponent } from '../waveform-display/waveform-display.component';

@Component({
  selector: 'app-brainwave-dashboard',
  standalone: true,
  imports: [CommonModule, WaveformDisplayComponent],
  templateUrl: './brainwave-dashboard.component.html',
  styleUrls: ['./brainwave-dashboard.component.css']
})
export class BrainwaveDashboardComponent implements OnInit {
  @Output() settingsClick = new EventEmitter<void>();
  @Output() historyClick = new EventEmitter<void>();
  
  showSettings = signal(false);
  isRecording = computed(() => this.sessionService.isRecording());
  
  // Computed properties for reactive UI updates
  dominantBand = computed(() => {
    const data = this.brainwaveService.currentData();
    return data?.dominantBand || 'none';
  });

  dominantBandLabel = computed(() => 
    this.brainwaveService.getBandLabel(this.dominantBand())
  );

  dominantBandRange = computed(() => 
    this.brainwaveService.getBandRange(this.dominantBand())
  );

  dominantBandColor = computed(() => 
    this.brainwaveService.getBandColor(this.dominantBand())
  );

  dominantFrequency = computed(() => {
    const data = this.brainwaveService.currentData();
    return data?.dominantFrequency.toFixed(1) || '0.0';
  });

  timeInBand = computed(() => {
    const timer = this.alertService.currentTimer();
    return timer?.elapsedTime.toFixed(1) || '0.0';
  });

  threshold = computed(() => {
    const timer = this.alertService.currentTimer();
    return timer?.threshold.toFixed(1) || '0.0';
  });

  progress = computed(() => {
    const timer = this.alertService.currentTimer();
    return timer?.progress || 0;
  });

  thresholdMet = computed(() => {
    const timer = this.alertService.currentTimer();
    return timer?.thresholdMet || false;
  });

  bandPowers = computed(() => {
    const data = this.brainwaveService.currentData();
    if (!data) return [];

    return Object.keys(BAND_INFO).map(band => ({
      band: band as BrainwaveBand,
      label: BAND_INFO[band as BrainwaveBand].label,
      range: BAND_INFO[band as BrainwaveBand].range,
      color: BAND_INFO[band as BrainwaveBand].color,
      power: data.bandPowers[band as BrainwaveBand],
      percentage: Math.round(data.bandPowers[band as BrainwaveBand] * 100)
    }));
  });

  connectionStatus = computed(() => this.brainwaveService.connectionStatus());

  connectionStatusClass = computed(() => {
    const status = this.connectionStatus();
    switch (status) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500 animate-pulse';
      case 'disconnected': return 'bg-gray-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  });

  constructor(
    public brainwaveService: BrainwaveService,
    public alertService: AlertService,
    public sessionService: SessionService
  ) {}

  ngOnInit(): void {
    // Update session with brainwave data
    this.brainwaveService.data$.subscribe(data => {
      if (this.sessionService.isRecording()) {
        this.sessionService.updateSession(data);
      }
    });
  }

  toggleSettings(): void {
    this.settingsClick.emit();
  }

  toggleHistory(): void {
    this.historyClick.emit();
  }

  reconnect(): void {
    this.brainwaveService.connect();
  }
}
