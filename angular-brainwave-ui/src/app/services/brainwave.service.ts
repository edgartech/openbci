import { Injectable, signal } from '@angular/core';
import { Observable, Subject, timer } from 'rxjs';
import { environment } from '../../environments/environment';

export interface CriticalError {
  type: 'connection' | 'websocket';
  message: string;
  details?: string;
  timestamp: number;
}

export interface BandPowers {
  delta: number;
  theta: number;
  alpha: number;
  beta: number;
  gamma: number;
}

export interface BrainwaveData {
  timestamp: string;
  dominantBand: string;
  dominantFrequency: number;
  timeInBand: number;
  bandPowers: BandPowers;
  isAlert: boolean;
}

export interface BandDistribution {
  delta: number;
  theta: number;
  alpha: number;
  beta: number;
  gamma: number;
}

export interface PrimaryState {
  primaryBand: BrainwaveBand;
  percentage: number;
  duration: number;
  confidence: 'very-high' | 'high' | 'moderate' | 'low';
  distribution: BandDistribution;
}

export type BrainwaveBand = 'delta' | 'theta' | 'alpha' | 'beta' | 'gamma';

export const BAND_INFO: Record<BrainwaveBand, { label: string; range: string; color: string }> = {
  delta: { label: 'Delta', range: '1-4 Hz', color: '#6B46C1' },
  theta: { label: 'Theta', range: '4-8 Hz', color: '#3B82F6' },
  alpha: { label: 'Alpha', range: '8-12 Hz', color: '#10B981' },
  beta: { label: 'Beta', range: '13-30 Hz', color: '#F59E0B' },
  gamma: { label: 'Gamma', range: '30-45 Hz', color: '#EF4444' }
};

const PRIMARY_STATE_WINDOW_SIZE = 30; // seconds

@Injectable({
  providedIn: 'root'
})
export class BrainwaveService {
  private ws: WebSocket | null = null;
  private dataSubject = new Subject<BrainwaveData>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 3000;

  // Reactive signals for state management
  connectionStatus = signal<'connected' | 'disconnected' | 'connecting' | 'error'>('disconnected');
  currentData = signal<BrainwaveData | null>(null);
  primaryState = signal<PrimaryState | null>(null);
  criticalError = signal<CriticalError | null>(null);
  data$ = this.dataSubject.asObservable();

  // Primary state tracking
  private bandHistory: Array<{ band: BrainwaveBand; timestamp: number }> = [];

  constructor() {
    this.connect();
  }

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    this.connectionStatus.set('connecting');
    
    try {
      this.ws = new WebSocket(environment.websocketUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.connectionStatus.set('connected');
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const data: BrainwaveData = JSON.parse(event.data);
          this.currentData.set(data);
          this.dataSubject.next(data);
          this.updatePrimaryState(data.dominantBand as BrainwaveBand);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.connectionStatus.set('error');
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.connectionStatus.set('disconnected');
        this.attemptReconnect();
      };
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      this.connectionStatus.set('error');
      this.attemptReconnect();
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      timer(this.reconnectDelay).subscribe(() => {
        this.connect();
      });
    } else {
      console.error('Max reconnection attempts reached');
      this.criticalError.set({
        type: 'websocket',
        message: 'Unable to connect to the backend server after multiple attempts.',
        details: `Failed to connect to ${environment.websocketUrl}. Maximum retry attempts (${this.maxReconnectAttempts}) exceeded.`,
        timestamp: Date.now()
      });
    }
  }

  resetError(): void {
    this.criticalError.set(null);
    this.reconnectAttempts = 0;
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  getBandColor(band: string): string {
    return BAND_INFO[band as BrainwaveBand]?.color || '#ffffff';
  }

  getBandLabel(band: string): string {
    return BAND_INFO[band as BrainwaveBand]?.label || band;
  }

  getBandRange(band: string): string {
    return BAND_INFO[band as BrainwaveBand]?.range || '';
  }

  private updatePrimaryState(currentDominantBand: BrainwaveBand): void {
    const now = Date.now();
    
    // Add current sample to history
    this.bandHistory.push({ band: currentDominantBand, timestamp: now });
    
    // Remove samples older than the window
    const cutoffTime = now - (PRIMARY_STATE_WINDOW_SIZE * 1000);
    this.bandHistory = this.bandHistory.filter(sample => sample.timestamp >= cutoffTime);
    
    // If we don't have enough history yet, don't calculate primary state
    if (this.bandHistory.length < 10) {
      return;
    }
    
    // Count occurrences of each band
    const bandCounts: Record<BrainwaveBand, number> = {
      delta: 0,
      theta: 0,
      alpha: 0,
      beta: 0,
      gamma: 0
    };
    
    this.bandHistory.forEach(sample => {
      bandCounts[sample.band]++;
    });
    
    const totalSamples = this.bandHistory.length;
    
    // Calculate percentages and find dominant band
    const distribution: BandDistribution = {
      delta: bandCounts.delta / totalSamples,
      theta: bandCounts.theta / totalSamples,
      alpha: bandCounts.alpha / totalSamples,
      beta: bandCounts.beta / totalSamples,
      gamma: bandCounts.gamma / totalSamples
    };
    
    // Find band with highest percentage
    let primaryBand: BrainwaveBand = 'alpha';
    let maxPercentage = 0;
    
    (Object.keys(distribution) as BrainwaveBand[]).forEach(band => {
      if (distribution[band] > maxPercentage) {
        maxPercentage = distribution[band];
        primaryBand = band;
      }
    });
    
    // Calculate duration (time span of current window)
    const windowDuration = this.bandHistory.length > 0 
      ? (now - this.bandHistory[0].timestamp) / 1000
      : 0;
    
    // Determine confidence level based on percentage
    let confidence: 'very-high' | 'high' | 'moderate' | 'low';
    if (maxPercentage >= 0.80) {
      confidence = 'very-high';
    } else if (maxPercentage >= 0.65) {
      confidence = 'high';
    } else if (maxPercentage >= 0.50) {
      confidence = 'moderate';
    } else {
      confidence = 'low';
    }
    
    // Update primary state signal
    this.primaryState.set({
      primaryBand,
      percentage: maxPercentage,
      duration: windowDuration,
      confidence,
      distribution
    });
  }
}
