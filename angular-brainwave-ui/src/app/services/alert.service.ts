import { Injectable, signal } from '@angular/core';
import { BrainwaveBand, BrainwaveService } from './brainwave.service';
import { AudioService } from './audio.service';

export interface BandThreshold {
  duration: number; // in seconds
  enabled: boolean;
}

export interface ThresholdSettings {
  delta: BandThreshold;
  theta: BandThreshold;
  alpha: BandThreshold;
  beta: BandThreshold;
  gamma: BandThreshold;
}

export interface BandTimer {
  band: BrainwaveBand;
  elapsedTime: number;
  threshold: number;
  progress: number; // 0-100
  thresholdMet: boolean;
}

const DEFAULT_THRESHOLDS: ThresholdSettings = {
  delta: { duration: 10.0, enabled: true },
  theta: { duration: 8.0, enabled: true },
  alpha: { duration: 7.0, enabled: true },
  beta: { duration: 5.0, enabled: true },
  gamma: { duration: 5.0, enabled: true }
};

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  thresholds = signal<ThresholdSettings>({
    delta: { ...DEFAULT_THRESHOLDS.delta },
    theta: { ...DEFAULT_THRESHOLDS.theta },
    alpha: { ...DEFAULT_THRESHOLDS.alpha },
    beta: { ...DEFAULT_THRESHOLDS.beta },
    gamma: { ...DEFAULT_THRESHOLDS.gamma }
  });

  currentTimer = signal<BandTimer | null>(null);
  lastAlertedBand = signal<string>('');

  constructor(
    private brainwaveService: BrainwaveService,
    private audioService: AudioService
  ) {
    this.loadThresholds();
    this.startMonitoring();
  }

  private startMonitoring(): void {
    this.brainwaveService.data$.subscribe((data: any) => {
      const currentBand = data.dominantBand as BrainwaveBand;
      
      // Use backend's timeInBand value (more accurate)
      const elapsedTime = data.timeInBand || 0;
      const threshold = this.thresholds()[currentBand];

      // Calculate progress
      const progress = threshold.duration > 0 
        ? Math.min((elapsedTime / threshold.duration) * 100, 100)
        : 100;

      const thresholdMet = elapsedTime >= threshold.duration;

      // Update current timer
      this.currentTimer.set({
        band: currentBand,
        elapsedTime,
        threshold: threshold.duration,
        progress,
        thresholdMet
      });

      // Trigger alert if threshold is met and band is different from last alerted
      // UI makes its own decision based on configured thresholds
      if (
        threshold.enabled &&
        thresholdMet &&
        currentBand !== this.lastAlertedBand()
      ) {
        this.triggerAlert(currentBand);
      }
    });
  }

  private triggerAlert(band: BrainwaveBand): void {
    console.log(`Alert triggered for ${band} band`);
    this.lastAlertedBand.set(band);
    this.audioService.playForBand(band);
  }

  updateThreshold(band: BrainwaveBand, threshold: Partial<BandThreshold>): void {
    const current = this.thresholds();
    this.thresholds.set({
      ...current,
      [band]: { ...current[band], ...threshold }
    });
    this.saveThresholds();
  }

  setThresholdDuration(band: BrainwaveBand, duration: number): void {
    this.updateThreshold(band, { duration: Math.max(0, Math.min(30, duration)) });
  }

  setThresholdEnabled(band: BrainwaveBand, enabled: boolean): void {
    this.updateThreshold(band, { enabled });
  }

  resetThresholds(): void {
    this.thresholds.set({
      delta: { ...DEFAULT_THRESHOLDS.delta },
      theta: { ...DEFAULT_THRESHOLDS.theta },
      alpha: { ...DEFAULT_THRESHOLDS.alpha },
      beta: { ...DEFAULT_THRESHOLDS.beta },
      gamma: { ...DEFAULT_THRESHOLDS.gamma }
    });
    this.saveThresholds();
  }

  private saveThresholds(): void {
    try {
      localStorage.setItem('brainwave-thresholds', JSON.stringify(this.thresholds()));
    } catch (err) {
      console.error('Error saving thresholds:', err);
    }
  }

  private loadThresholds(): void {
    try {
      const saved = localStorage.getItem('brainwave-thresholds');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.thresholds.set(parsed);
      }
    } catch (err) {
      console.error('Error loading thresholds:', err);
    }
  }
}
