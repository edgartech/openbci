import { Injectable, signal } from '@angular/core';
import { Observable, Subject, timer } from 'rxjs';
import { environment } from '../../environments/environment';

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

export type BrainwaveBand = 'delta' | 'theta' | 'alpha' | 'beta' | 'gamma';

export const BAND_INFO: Record<BrainwaveBand, { label: string; range: string; color: string }> = {
  delta: { label: 'Delta', range: '1-4 Hz', color: '#6B46C1' },
  theta: { label: 'Theta', range: '4-8 Hz', color: '#3B82F6' },
  alpha: { label: 'Alpha', range: '8-12 Hz', color: '#10B981' },
  beta: { label: 'Beta', range: '13-30 Hz', color: '#F59E0B' },
  gamma: { label: 'Gamma', range: '30-45 Hz', color: '#EF4444' }
};

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
  data$ = this.dataSubject.asObservable();

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
    }
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
}
