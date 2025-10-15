import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AudioService, AudioConfig } from '../../services/audio.service';
import { AlertService } from '../../services/alert.service';
import { BrainwaveBand, BAND_INFO } from '../../services/brainwave.service';
import { DataManagementService } from '../../services/data-management.service';

@Component({
  selector: 'app-audio-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './audio-settings.component.html',
  styleUrls: ['./audio-settings.component.css']
})
export class AudioSettingsComponent {
  selectedBand = signal<BrainwaveBand | null>(null);
  importMessage = signal<string>('');
  importSuccess = signal<boolean>(false);
  
  bands: BrainwaveBand[] = ['delta', 'theta', 'alpha', 'beta', 'gamma'];
  
  oscillatorTypes: OscillatorType[] = ['sine', 'square', 'sawtooth', 'triangle'];

  constructor(
    public audioService: AudioService,
    public alertService: AlertService,
    public dataManagementService: DataManagementService
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

  // Data management methods
  exportData(): void {
    try {
      this.dataManagementService.downloadBackup();
      this.dataManagementService.updateLastBackupTimestamp();
      this.importMessage.set('Backup downloaded successfully!');
      this.importSuccess.set(true);
      setTimeout(() => this.importMessage.set(''), 3000);
    } catch (error) {
      this.importMessage.set('Error creating backup. Please try again.');
      this.importSuccess.set(false);
      setTimeout(() => this.importMessage.set(''), 3000);
    }
  }

  async importData(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.json')) {
      this.importMessage.set('Please select a JSON backup file');
      this.importSuccess.set(false);
      setTimeout(() => this.importMessage.set(''), 3000);
      input.value = '';
      return;
    }

    try {
      const text = await file.text();
      
      // Get backup info first
      const info = this.dataManagementService.getBackupInfo(text);
      
      if (!info.valid) {
        this.importMessage.set('Invalid backup file format');
        this.importSuccess.set(false);
        setTimeout(() => this.importMessage.set(''), 3000);
        input.value = '';
        return;
      }

      // Confirm before importing
      const confirmMessage = `Import backup from ${new Date(info.timestamp!).toLocaleString()}?\n\nThis will replace your current settings.`;
      if (!confirm(confirmMessage)) {
        input.value = '';
        return;
      }

      // Import the data
      const result = this.dataManagementService.importData(text);
      
      if (result.success) {
        this.importMessage.set(result.message);
        this.importSuccess.set(true);
        
        // Reload services to reflect imported data
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        this.importMessage.set(result.message);
        this.importSuccess.set(false);
        setTimeout(() => this.importMessage.set(''), 3000);
      }
    } catch (error) {
      this.importMessage.set('Error reading backup file');
      this.importSuccess.set(false);
      setTimeout(() => this.importMessage.set(''), 3000);
    }
    
    input.value = '';
  }

  getLastBackupDate(): string {
    const timestamp = this.dataManagementService.getLastBackupTimestamp();
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleString();
  }

  getStorageInfo(): string {
    const stats = this.dataManagementService.getStorageStats();
    return stats.formattedTotal;
  }
}
