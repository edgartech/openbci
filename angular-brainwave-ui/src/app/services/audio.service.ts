import { Injectable, signal } from '@angular/core';
import { BrainwaveBand } from './brainwave.service';

export type AudioSourceType = 'preset' | 'custom' | 'tone' | 'disabled';

export interface AudioConfig {
  sourceType: AudioSourceType;
  presetSound?: string;
  customAudioUrl?: string;
  customAudioName?: string;
  toneFrequency?: number;
  toneType?: OscillatorType;
  toneDuration?: number;
  volume: number;
  enabled: boolean;
}

export interface BandAudioSettings {
  delta: AudioConfig;
  theta: AudioConfig;
  alpha: AudioConfig;
  beta: AudioConfig;
  gamma: AudioConfig;
}

const DEFAULT_AUDIO_CONFIG: AudioConfig = {
  sourceType: 'preset',
  presetSound: 'beep',
  volume: 70,
  enabled: true,
  toneFrequency: 440,
  toneType: 'sine',
  toneDuration: 200
};

const PRESET_SOUNDS = [
  'delta',
  'theta',
  'alpha',
  'beta',
  'gamma',
  'beep',
  'chime',
  'bell',
  'tone',
  'click'
];

@Injectable({
  providedIn: 'root'
})
export class AudioService {
  private audioContext: AudioContext | null = null;
  private preloadedAudio: Map<string, HTMLAudioElement> = new Map();
  
  audioSettings = signal<BandAudioSettings>({
    delta: { ...DEFAULT_AUDIO_CONFIG, presetSound: 'delta' },
    theta: { ...DEFAULT_AUDIO_CONFIG, presetSound: 'theta' },
    alpha: { ...DEFAULT_AUDIO_CONFIG, presetSound: 'alpha' },
    beta: { ...DEFAULT_AUDIO_CONFIG, presetSound: 'beta' },
    gamma: { ...DEFAULT_AUDIO_CONFIG, presetSound: 'gamma' }
  });

  masterVolume = signal<number>(100);
  globalEnabled = signal<boolean>(true);

  constructor() {
    this.loadSettings();
    this.initAudioContext();
    this.preloadPresetSounds();
  }

  private initAudioContext(): void {
    // Initialize on user gesture to comply with browser autoplay policies
    if (typeof window !== 'undefined' && !this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  private preloadPresetSounds(): void {
    PRESET_SOUNDS.forEach(sound => {
      const audio = new Audio(`assets/sounds/${sound}.mp3`);
      audio.preload = 'auto';
      this.preloadedAudio.set(sound, audio);
    });
  }

  playForBand(band: BrainwaveBand, bypassGlobalControl = false): void {
    if (!bypassGlobalControl && !this.globalEnabled()) {
      return;
    }

    const settings = this.audioSettings();
    const config = settings[band];

    if (!config.enabled) {
      return;
    }

    const effectiveVolume = (config.volume / 100) * (this.masterVolume() / 100);

    switch (config.sourceType) {
      case 'preset':
        this.playPreset(config.presetSound!, effectiveVolume);
        break;
      case 'custom':
        this.playCustom(config.customAudioUrl!, effectiveVolume);
        break;
      case 'tone':
        this.playTone(
          config.toneFrequency!,
          config.toneType!,
          config.toneDuration!,
          effectiveVolume
        );
        break;
      case 'disabled':
        break;
    }
  }

  playForBandWithPitch(band: BrainwaveBand, pitchMultiplier: number, bypassGlobalControl = false): void {
    if (!bypassGlobalControl && !this.globalEnabled()) {
      return;
    }

    const settings = this.audioSettings();
    const config = settings[band];

    if (!config.enabled) {
      return;
    }

    const effectiveVolume = (config.volume / 100) * (this.masterVolume() / 100);

    switch (config.sourceType) {
      case 'preset':
        this.playPresetWithPitch(config.presetSound!, effectiveVolume, pitchMultiplier);
        break;
      case 'custom':
        this.playCustomWithPitch(config.customAudioUrl!, effectiveVolume, pitchMultiplier);
        break;
      case 'tone':
        // For tones, adjust the frequency directly
        this.playTone(
          config.toneFrequency! * pitchMultiplier,
          config.toneType!,
          config.toneDuration!,
          effectiveVolume
        );
        break;
      case 'disabled':
        break;
    }
  }

  private playPreset(soundName: string, volume: number): void {
    const audio = this.preloadedAudio.get(soundName);
    if (audio) {
      const clone = audio.cloneNode() as HTMLAudioElement;
      clone.volume = volume;
      clone.play().catch(err => {
        console.error(`Error playing preset sound '${soundName}':`, err);
        console.warn(`Preset audio file might be missing: assets/sounds/${soundName}.mp3`);
      });
    } else {
      console.error(`Preset sound '${soundName}' not found. Add file: assets/sounds/${soundName}.mp3`);
    }
  }

  private playPresetWithPitch(soundName: string, volume: number, pitchMultiplier: number): void {
    const audio = this.preloadedAudio.get(soundName);
    if (audio) {
      const clone = audio.cloneNode() as HTMLAudioElement;
      clone.volume = volume;
      clone.playbackRate = pitchMultiplier; // Change pitch by adjusting playback speed
      clone.preservesPitch = false; // Ensure pitch changes with speed
      clone.play().catch(err => {
        console.error(`Error playing preset sound '${soundName}' with pitch:`, err);
        console.warn(`Preset audio file might be missing: assets/sounds/${soundName}.mp3`);
      });
    } else {
      console.error(`Preset sound '${soundName}' not found. Add file: assets/sounds/${soundName}.mp3`);
    }
  }

  private playCustom(url: string, volume: number): void {
    const audio = new Audio(url);
    audio.volume = volume;
    audio.play().catch(err => console.error('Error playing custom sound:', err));
  }

  private playCustomWithPitch(url: string, volume: number, pitchMultiplier: number): void {
    const audio = new Audio(url);
    audio.volume = volume;
    audio.playbackRate = pitchMultiplier;
    audio.preservesPitch = false;
    audio.play().catch(err => console.error('Error playing custom sound with pitch:', err));
  }

  private playTone(frequency: number, type: OscillatorType, duration: number, volume: number): void {
    if (!this.audioContext) {
      this.initAudioContext();
    }

    if (!this.audioContext) {
      console.error('AudioContext not available');
      return;
    }

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);

      gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration / 1000);

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.start();
      oscillator.stop(this.audioContext.currentTime + duration / 1000);
    } catch (err) {
      console.error('Error playing tone:', err);
    }
  }

  updateBandSettings(band: BrainwaveBand, config: Partial<AudioConfig>): void {
    const current = this.audioSettings();
    this.audioSettings.set({
      ...current,
      [band]: { ...current[band], ...config }
    });
    this.saveSettings();
  }

  uploadCustomAudio(band: BrainwaveBand, file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const url = e.target?.result as string;
        this.updateBandSettings(band, {
          sourceType: 'custom',
          customAudioUrl: url,
          customAudioName: file.name
        });
        resolve();
      };

      reader.onerror = () => {
        reject(new Error('Failed to read audio file'));
      };

      reader.readAsDataURL(file);
    });
  }

  testSound(band: BrainwaveBand): void {
    // Ensure audio context is resumed (required for iOS)
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    
    // Test bypasses global enable check (for testing purposes)
    const settings = this.audioSettings();
    const config = settings[band];

    if (config.sourceType === 'disabled') {
      console.log(`Cannot test ${band}: source type is disabled`);
      return;
    }

    const effectiveVolume = (config.volume / 100) * (this.masterVolume() / 100);

    switch (config.sourceType) {
      case 'preset':
        this.playPreset(config.presetSound!, effectiveVolume);
        break;
      case 'custom':
        this.playCustom(config.customAudioUrl!, effectiveVolume);
        break;
      case 'tone':
        this.playTone(
          config.toneFrequency!,
          config.toneType!,
          config.toneDuration!,
          effectiveVolume
        );
        break;
    }
  }

  setMasterVolume(volume: number): void {
    this.masterVolume.set(Math.max(0, Math.min(100, volume)));
    this.saveSettings();
  }

  setGlobalEnabled(enabled: boolean): void {
    this.globalEnabled.set(enabled);
    this.saveSettings();
  }

  getPresetSounds(): string[] {
    return PRESET_SOUNDS;
  }

  private saveSettings(): void {
    try {
      localStorage.setItem('brainwave-audio-settings', JSON.stringify(this.audioSettings()));
      localStorage.setItem('brainwave-master-volume', this.masterVolume().toString());
      localStorage.setItem('brainwave-global-enabled', this.globalEnabled().toString());
    } catch (err) {
      console.error('Error saving audio settings:', err);
    }
  }

  private loadSettings(): void {
    try {
      const saved = localStorage.getItem('brainwave-audio-settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.audioSettings.set(parsed);
      }

      const masterVol = localStorage.getItem('brainwave-master-volume');
      if (masterVol) {
        this.masterVolume.set(parseInt(masterVol, 10));
      }

      const globalEnabled = localStorage.getItem('brainwave-global-enabled');
      if (globalEnabled) {
        this.globalEnabled.set(globalEnabled === 'true');
      }
    } catch (err) {
      console.error('Error loading audio settings:', err);
    }
  }

  resetToDefaults(): void {
    this.audioSettings.set({
      delta: { ...DEFAULT_AUDIO_CONFIG, presetSound: 'delta' },
      theta: { ...DEFAULT_AUDIO_CONFIG, presetSound: 'theta' },
      alpha: { ...DEFAULT_AUDIO_CONFIG, presetSound: 'alpha' },
      beta: { ...DEFAULT_AUDIO_CONFIG, presetSound: 'beta' },
      gamma: { ...DEFAULT_AUDIO_CONFIG, presetSound: 'gamma' }
    });
    this.masterVolume.set(100);
    this.globalEnabled.set(true);
    this.saveSettings();
  }
}
