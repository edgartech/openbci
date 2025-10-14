import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AudioService, AudioConfig } from '../../services/audio.service';
import { AlertService } from '../../services/alert.service';
import { BrainwaveBand, BAND_INFO } from '../../services/brainwave.service';

@Component({
  selector: 'app-audio-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './audio-settings.component.html',
  styleUrls: ['./audio-settings.component.css']
})
export class AudioSettingsComponent {
  selectedBand = signal<BrainwaveBand | null>(null);
  
  bands: BrainwaveBand[] = ['delta', 'theta', 'alpha', 'beta', 'gamma'];
  
  oscillatorTypes: OscillatorType[] = ['sine', 'square', 'sawtooth', 'triangle'];

  constructor(
    public audioService: AudioService,
    public alertService: AlertService
  ) {}

  get presetSounds(): string[] {
    return this.audioService.getPresetSounds();
  }

  getBandInfo(band: BrainwaveBand) {
    return BAND_INFO[band];
  }

  getBandConfig(band: BrainwaveBand): AudioConfig {
    return this.audioService.audioSettings()[band];
  }

  getThreshold(band: BrainwaveBand) {
    return this.alertService.thresholds()[band];
  }

  toggleBandExpansion(band: BrainwaveBand): void {
    if (this.selectedBand() === band) {
      this.selectedBand.set(null);
    } else {
      this.selectedBand.set(band);
    }
  }

  isBandExpanded(band: BrainwaveBand): boolean {
    return this.selectedBand() === band;
  }

  updateSourceType(band: BrainwaveBand, type: string): void {
    this.audioService.updateBandSettings(band, { 
      sourceType: type as 'preset' | 'custom' | 'tone' | 'disabled' 
    });
  }

  updatePresetSound(band: BrainwaveBand, sound: string): void {
    this.audioService.updateBandSettings(band, { presetSound: sound });
  }

  updateToneFrequency(band: BrainwaveBand, frequency: number): void {
    this.audioService.updateBandSettings(band, { toneFrequency: frequency });
  }

  updateToneType(band: BrainwaveBand, type: string): void {
    this.audioService.updateBandSettings(band, { toneType: type as OscillatorType });
  }

  updateToneDuration(band: BrainwaveBand, duration: number): void {
    this.audioService.updateBandSettings(band, { toneDuration: duration });
  }

  updateVolume(band: BrainwaveBand, volume: number): void {
    this.audioService.updateBandSettings(band, { volume });
  }

  updateEnabled(band: BrainwaveBand, enabled: boolean): void {
    this.audioService.updateBandSettings(band, { enabled });
  }

  updateThresholdDuration(band: BrainwaveBand, duration: number): void {
    this.alertService.setThresholdDuration(band, duration);
  }

  updateThresholdEnabled(band: BrainwaveBand, enabled: boolean): void {
    this.alertService.setThresholdEnabled(band, enabled);
  }

  async onFileSelected(band: BrainwaveBand, event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (file) {
      // Validate file type
      if (!file.type.startsWith('audio/')) {
        alert('Please select an audio file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }

      try {
        await this.audioService.uploadCustomAudio(band, file);
      } catch (err) {
        alert('Error uploading audio file');
        console.error(err);
      }
    }
  }

  testSound(band: BrainwaveBand): void {
    this.audioService.testSound(band);
  }

  clearCustomAudio(band: BrainwaveBand): void {
    this.audioService.updateBandSettings(band, {
      sourceType: 'preset',
      customAudioUrl: undefined,
      customAudioName: undefined
    });
  }

  updateMasterVolume(volume: number): void {
    this.audioService.setMasterVolume(volume);
  }

  toggleGlobalEnabled(): void {
    this.audioService.setGlobalEnabled(!this.audioService.globalEnabled());
  }

  resetAllSettings(): void {
    if (confirm('Reset all audio settings to defaults?')) {
      this.audioService.resetToDefaults();
      this.alertService.resetThresholds();
    }
  }
}
