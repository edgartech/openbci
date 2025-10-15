import { Injectable } from '@angular/core';

export interface BackupData {
  version: string;
  timestamp: string;
  audio: {
    settings: string | null;
    masterVolume: string | null;
    globalEnabled: string | null;
  };
  alerts: {
    thresholds: string | null;
  };
  sessions: {
    sessions: string | null;
  };
}

@Injectable({
  providedIn: 'root'
})
export class DataManagementService {
  private readonly BACKUP_VERSION = '1.0';
  private readonly BACKUP_PREFIX = 'brainwave-backup';

  constructor() {}

  /**
   * Export all app data to a JSON file
   */
  exportData(): string {
    const backup: BackupData = {
      version: this.BACKUP_VERSION,
      timestamp: new Date().toISOString(),
      audio: {
        settings: localStorage.getItem('brainwave-audio-settings'),
        masterVolume: localStorage.getItem('brainwave-master-volume'),
        globalEnabled: localStorage.getItem('brainwave-global-enabled')
      },
      alerts: {
        thresholds: localStorage.getItem('brainwave-thresholds')
      },
      sessions: {
        sessions: localStorage.getItem('brainwave-sessions')
      }
    };

    return JSON.stringify(backup, null, 2);
  }

  /**
   * Download backup as a JSON file
   */
  downloadBackup(): void {
    try {
      const data = this.exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      link.download = `${this.BACKUP_PREFIX}-${timestamp}.json`;
      link.href = url;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(url);
      
      console.log('Backup downloaded successfully');
    } catch (error) {
      console.error('Error downloading backup:', error);
      throw new Error('Failed to download backup file');
    }
  }

  /**
   * Import data from a backup file
   */
  importData(jsonString: string): { success: boolean; message: string; itemsRestored: number } {
    try {
      const backup: BackupData = JSON.parse(jsonString);
      
      // Validate backup structure
      if (!this.validateBackup(backup)) {
        return {
          success: false,
          message: 'Invalid backup file format',
          itemsRestored: 0
        };
      }

      let itemsRestored = 0;

      // Restore audio settings
      if (backup.audio.settings) {
        localStorage.setItem('brainwave-audio-settings', backup.audio.settings);
        itemsRestored++;
      }
      if (backup.audio.masterVolume) {
        localStorage.setItem('brainwave-master-volume', backup.audio.masterVolume);
        itemsRestored++;
      }
      if (backup.audio.globalEnabled) {
        localStorage.setItem('brainwave-global-enabled', backup.audio.globalEnabled);
        itemsRestored++;
      }

      // Restore alert thresholds
      if (backup.alerts.thresholds) {
        localStorage.setItem('brainwave-thresholds', backup.alerts.thresholds);
        itemsRestored++;
      }

      // Restore sessions
      if (backup.sessions.sessions) {
        localStorage.setItem('brainwave-sessions', backup.sessions.sessions);
        itemsRestored++;
      }

      console.log(`Backup restored: ${itemsRestored} items`);

      return {
        success: true,
        message: `Successfully restored ${itemsRestored} item(s) from ${backup.timestamp}`,
        itemsRestored
      };
    } catch (error) {
      console.error('Error importing backup:', error);
      return {
        success: false,
        message: 'Failed to parse backup file. Please ensure it is a valid JSON file.',
        itemsRestored: 0
      };
    }
  }

  /**
   * Validate backup file structure
   */
  private validateBackup(backup: any): backup is BackupData {
    return (
      backup &&
      typeof backup === 'object' &&
      'version' in backup &&
      'timestamp' in backup &&
      'audio' in backup &&
      'alerts' in backup &&
      'sessions' in backup
    );
  }

  /**
   * Get backup info without importing
   */
  getBackupInfo(jsonString: string): { 
    valid: boolean; 
    version?: string; 
    timestamp?: string;
    itemCount?: number;
  } {
    try {
      const backup: BackupData = JSON.parse(jsonString);
      
      if (!this.validateBackup(backup)) {
        return { valid: false };
      }

      let itemCount = 0;
      if (backup.audio.settings) itemCount++;
      if (backup.audio.masterVolume) itemCount++;
      if (backup.audio.globalEnabled) itemCount++;
      if (backup.alerts.thresholds) itemCount++;
      if (backup.sessions.sessions) itemCount++;

      return {
        valid: true,
        version: backup.version,
        timestamp: backup.timestamp,
        itemCount
      };
    } catch {
      return { valid: false };
    }
  }

  /**
   * Get last backup timestamp from localStorage metadata
   */
  getLastBackupTimestamp(): string | null {
    return localStorage.getItem('brainwave-last-backup');
  }

  /**
   * Update last backup timestamp
   */
  updateLastBackupTimestamp(): void {
    localStorage.setItem('brainwave-last-backup', new Date().toISOString());
  }

  /**
   * Clear all app data (with caution!)
   */
  clearAllData(): void {
    const keys = [
      'brainwave-audio-settings',
      'brainwave-master-volume',
      'brainwave-global-enabled',
      'brainwave-thresholds',
      'brainwave-sessions',
      'brainwave-last-backup'
    ];

    keys.forEach(key => localStorage.removeItem(key));
    console.log('All app data cleared');
  }

  /**
   * Get storage usage statistics
   */
  getStorageStats(): { 
    totalSize: number; 
    audioSize: number; 
    sessionsSize: number;
    formattedTotal: string;
  } {
    const getSize = (key: string): number => {
      const item = localStorage.getItem(key);
      return item ? new Blob([item]).size : 0;
    };

    const audioSize = 
      getSize('brainwave-audio-settings') +
      getSize('brainwave-master-volume') +
      getSize('brainwave-global-enabled');

    const sessionsSize = getSize('brainwave-sessions');
    const alertsSize = getSize('brainwave-thresholds');

    const totalSize = audioSize + sessionsSize + alertsSize;

    return {
      totalSize,
      audioSize,
      sessionsSize,
      formattedTotal: this.formatBytes(totalSize)
    };
  }

  /**
   * Format bytes to human-readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
}
