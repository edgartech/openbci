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

export type ConfidenceLevel = 'any' | 'moderate-plus' | 'high-plus' | 'very-high';

export type DominantAudioMode = 'same-as-live' | 'pitch-higher' | 'pitch-lower' | 'separate';

export interface DominantAlertSettings {
  enabled: boolean;
  confidenceLevel: ConfidenceLevel;
  cooldownSeconds: number; // Prevent rapid re-triggering
  audioMode: DominantAudioMode; // How to differentiate from live alerts
  pitchShift: number; // Percentage: 100 = normal, 150 = 1.5x higher, 75 = 0.75x lower
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

const DEFAULT_DOMINANT_SETTINGS: DominantAlertSettings = {
  enabled: false,
  confidenceLevel: 'moderate-plus', // 2 stars+
  cooldownSeconds: 5.0,
  audioMode: 'pitch-higher', // Default: play same sound at higher pitch
  pitchShift: 150 // 50% higher pitch
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

  dominantAlertSettings = signal<DominantAlertSettings>({
    ...DEFAULT_DOMINANT_SETTINGS
  });

  currentTimer = signal<BandTimer | null>(null);
  lastAlertedBand = signal<string>('');
  lastDominantAlertedBand = signal<string>('');
  lastDominantAlertTime = signal<number>(0);

  constructor(
    private brainwaveService: BrainwaveService,
    private audioService: AudioService
  ) {
    this.loadThresholds();
    this.loadDominantSettings();
    this.startMonitoring();
    this.startDominantMonitoring();
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
    console.log(`Live alert triggered for ${band} band`);
    this.lastAlertedBand.set(band);
    this.audioService.playForBand(band);
  }

  private triggerDominantAlert(band: BrainwaveBand): void {
    console.log(`Dominant alert triggered for ${band} band`);
    this.lastDominantAlertedBand.set(band);
    this.lastDominantAlertTime.set(Date.now());
    
    const settings = this.dominantAlertSettings();
    
    // Play audio based on configured mode
    switch (settings.audioMode) {
      case 'same-as-live':
        this.audioService.playForBand(band, true);
        break;
      case 'pitch-higher':
      case 'pitch-lower':
        this.audioService.playForBandWithPitch(band, settings.pitchShift / 100, true);
        break;
      case 'separate':
        // TODO: Implement separate audio settings (future enhancement)
        this.audioService.playForBand(band, true);
        break;
    }
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

  updateDominantSettings(settings: Partial<DominantAlertSettings>): void {
    this.dominantAlertSettings.set({
      ...this.dominantAlertSettings(),
      ...settings
    });
    this.saveDominantSettings();
  }

  setDominantEnabled(enabled: boolean): void {
    this.updateDominantSettings({ enabled });
  }

  setDominantConfidenceLevel(level: ConfidenceLevel): void {
    this.updateDominantSettings({ confidenceLevel: level });
  }

  setDominantCooldown(seconds: number): void {
    this.updateDominantSettings({ cooldownSeconds: Math.max(0, Math.min(60, seconds)) });
  }

  setDominantAudioMode(mode: DominantAudioMode): void {
    this.updateDominantSettings({ audioMode: mode });
  }

  setDominantPitchShift(percent: number): void {
    this.updateDominantSettings({ pitchShift: Math.max(50, Math.min(200, percent)) });
  }

  resetDominantSettings(): void {
    this.dominantAlertSettings.set({ ...DEFAULT_DOMINANT_SETTINGS });
    this.saveDominantSettings();
  }

  private startDominantMonitoring(): void {
    // Monitor primary state changes
    let previousPrimaryBand: BrainwaveBand | null = null;

    // Check primary state periodically (every second)
    setInterval(() => {
      const primaryState = this.brainwaveService.primaryState();
      const settings = this.dominantAlertSettings();

      if (!settings.enabled || !primaryState) {
        return;
      }

      const currentPrimaryBand = primaryState.primaryBand;
      const confidence = primaryState.confidence;

      // Check if confidence meets the required level
      if (!this.meetsConfidenceLevel(confidence, settings.confidenceLevel)) {
        return;
      }

      // Check cooldown period
      const timeSinceLastAlert = (Date.now() - this.lastDominantAlertTime()) / 1000;
      if (timeSinceLastAlert < settings.cooldownSeconds) {
        return;
      }

      // Trigger alert if band changed and meets all criteria
      if (currentPrimaryBand !== previousPrimaryBand && 
          currentPrimaryBand !== this.lastDominantAlertedBand()) {
        this.triggerDominantAlert(currentPrimaryBand);
      }

      previousPrimaryBand = currentPrimaryBand;
    }, 1000);
  }

  private meetsConfidenceLevel(
    actualConfidence: 'very-high' | 'high' | 'moderate' | 'low',
    requiredLevel: ConfidenceLevel
  ): boolean {
    const confidenceRank = {
      'very-high': 4,
      'high': 3,
      'moderate': 2,
      'low': 1
    };

    const requiredRank = {
      'very-high': 4,
      'high-plus': 3,
      'moderate-plus': 2,
      'any': 1
    };

    return confidenceRank[actualConfidence] >= requiredRank[requiredLevel];
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

  private saveDominantSettings(): void {
    try {
      localStorage.setItem('brainwave-dominant-alerts', JSON.stringify(this.dominantAlertSettings()));
    } catch (err) {
      console.error('Error saving dominant alert settings:', err);
    }
  }

  private loadDominantSettings(): void {
    try {
      const saved = localStorage.getItem('brainwave-dominant-alerts');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.dominantAlertSettings.set(parsed);
      }
    } catch (err) {
      console.error('Error loading dominant alert settings:', err);
    }
  }
}
