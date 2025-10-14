import { Injectable, signal } from '@angular/core';
import { BrainwaveData, BrainwaveBand } from './brainwave.service';

export interface BandStats {
  totalTime: number; // seconds
  percentage: number;
  averagePower: number;
}

export interface SessionData {
  id: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // seconds
  bandStats: Record<BrainwaveBand, BandStats>;
  dominantBand: BrainwaveBand;
  notes?: string;
}

export interface SessionSummary {
  totalSessions: number;
  totalTime: number;
  averageSessionLength: number;
  favoriteState: BrainwaveBand;
  thisWeekTime: number;
  lastSession?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private currentSession: {
    id: string;
    startTime: Date;
    bandTimes: Record<BrainwaveBand, number>;
    bandPowerSums: Record<BrainwaveBand, number>;
    dataPointCount: number;
    lastBand: BrainwaveBand | null;
    lastUpdateTime: number;
  } | null = null;

  private maxStoredSessions = 100; // Keep last 100 sessions
  
  isRecording = signal<boolean>(false);
  currentSessionDuration = signal<number>(0);
  sessions = signal<SessionData[]>([]);

  constructor() {
    this.loadSessions();
  }

  startSession(): void {
    if (this.currentSession) {
      this.endSession();
    }

    this.currentSession = {
      id: this.generateId(),
      startTime: new Date(),
      bandTimes: {
        delta: 0,
        theta: 0,
        alpha: 0,
        beta: 0,
        gamma: 0
      },
      bandPowerSums: {
        delta: 0,
        theta: 0,
        alpha: 0,
        beta: 0,
        gamma: 0
      },
      dataPointCount: 0,
      lastBand: null,
      lastUpdateTime: Date.now()
    };

    this.isRecording.set(true);
    this.startDurationTracking();
  }

  updateSession(data: BrainwaveData): void {
    if (!this.currentSession) return;

    const currentBand = data.dominantBand as BrainwaveBand;
    const now = Date.now();
    
    // Calculate time since last update
    const timeDelta = (now - this.currentSession.lastUpdateTime) / 1000;
    
    // Add time to current band
    if (this.currentSession.lastBand) {
      this.currentSession.bandTimes[this.currentSession.lastBand] += timeDelta;
    }

    // Accumulate band powers for averaging
    Object.keys(data.bandPowers).forEach(band => {
      const b = band as BrainwaveBand;
      this.currentSession!.bandPowerSums[b] += data.bandPowers[b];
    });

    this.currentSession.dataPointCount++;
    this.currentSession.lastBand = currentBand;
    this.currentSession.lastUpdateTime = now;
  }

  endSession(notes?: string): SessionData | null {
    if (!this.currentSession) return null;

    const endTime = new Date();
    const duration = (endTime.getTime() - this.currentSession.startTime.getTime()) / 1000;

    // Calculate total time across all bands
    const totalTime = Object.values(this.currentSession.bandTimes).reduce((sum, time) => sum + time, 0);

    // Calculate stats for each band
    const bandStats: Record<BrainwaveBand, BandStats> = {
      delta: this.calculateBandStats('delta', totalTime),
      theta: this.calculateBandStats('theta', totalTime),
      alpha: this.calculateBandStats('alpha', totalTime),
      beta: this.calculateBandStats('beta', totalTime),
      gamma: this.calculateBandStats('gamma', totalTime)
    };

    // Find dominant band (most time spent)
    const dominantBand = (Object.entries(this.currentSession.bandTimes)
      .reduce((max, [band, time]) => time > max.time ? { band: band as BrainwaveBand, time } : max, 
        { band: 'alpha' as BrainwaveBand, time: 0 })
      .band);

    const session: SessionData = {
      id: this.currentSession.id,
      startTime: this.currentSession.startTime,
      endTime,
      duration,
      bandStats,
      dominantBand,
      notes
    };

    // Save session
    this.saveSession(session);
    
    // Clear current session
    this.currentSession = null;
    this.isRecording.set(false);
    this.currentSessionDuration.set(0);

    return session;
  }

  private calculateBandStats(band: BrainwaveBand, totalTime: number): BandStats {
    if (!this.currentSession) {
      return { totalTime: 0, percentage: 0, averagePower: 0 };
    }

    const time = this.currentSession.bandTimes[band];
    const percentage = totalTime > 0 ? (time / totalTime) * 100 : 0;
    const averagePower = this.currentSession.dataPointCount > 0
      ? this.currentSession.bandPowerSums[band] / this.currentSession.dataPointCount
      : 0;

    return {
      totalTime: time,
      percentage: Math.round(percentage * 10) / 10,
      averagePower: Math.round(averagePower * 1000) / 1000
    };
  }

  private startDurationTracking(): void {
    if (!this.currentSession) return;

    const updateDuration = () => {
      if (!this.currentSession || !this.isRecording()) return;
      
      const now = Date.now();
      const duration = (now - this.currentSession.startTime.getTime()) / 1000;
      this.currentSessionDuration.set(Math.floor(duration));
      
      setTimeout(updateDuration, 1000);
    };

    updateDuration();
  }

  private saveSession(session: SessionData): void {
    const sessions = this.sessions();
    sessions.unshift(session); // Add to beginning
    
    // Keep only last N sessions
    if (sessions.length > this.maxStoredSessions) {
      sessions.splice(this.maxStoredSessions);
    }
    
    this.sessions.set(sessions);
    this.persistSessions();
  }

  deleteSession(id: string): void {
    const sessions = this.sessions().filter(s => s.id !== id);
    this.sessions.set(sessions);
    this.persistSessions();
  }

  addNotesToSession(id: string, notes: string): void {
    const sessions = this.sessions();
    const session = sessions.find(s => s.id === id);
    if (session) {
      session.notes = notes;
      this.sessions.set([...sessions]);
      this.persistSessions();
    }
  }

  getSummary(): SessionSummary {
    const sessions = this.sessions();
    const totalSessions = sessions.length;
    
    if (totalSessions === 0) {
      return {
        totalSessions: 0,
        totalTime: 0,
        averageSessionLength: 0,
        favoriteState: 'alpha',
        thisWeekTime: 0
      };
    }

    const totalTime = sessions.reduce((sum, s) => sum + s.duration, 0);
    const averageSessionLength = totalTime / totalSessions;

    // Calculate favorite state across all sessions
    const bandTotals: Record<BrainwaveBand, number> = {
      delta: 0, theta: 0, alpha: 0, beta: 0, gamma: 0
    };

    sessions.forEach(session => {
      Object.entries(session.bandStats).forEach(([band, stats]) => {
        bandTotals[band as BrainwaveBand] += stats.totalTime;
      });
    });

    const favoriteState = (Object.entries(bandTotals)
      .reduce((max, [band, time]) => time > max.time ? { band: band as BrainwaveBand, time } : max,
        { band: 'alpha' as BrainwaveBand, time: 0 })
      .band);

    // Calculate this week's time
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const thisWeekTime = sessions
      .filter(s => new Date(s.startTime) >= oneWeekAgo)
      .reduce((sum, s) => sum + s.duration, 0);

    const lastSession = sessions[0]?.startTime;

    return {
      totalSessions,
      totalTime,
      averageSessionLength,
      favoriteState,
      thisWeekTime,
      lastSession
    };
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private persistSessions(): void {
    try {
      localStorage.setItem('brainwave-sessions', JSON.stringify(this.sessions()));
    } catch (err) {
      console.error('Error saving sessions:', err);
    }
  }

  private loadSessions(): void {
    try {
      const saved = localStorage.getItem('brainwave-sessions');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Convert date strings back to Date objects
        const sessions = parsed.map((s: any) => ({
          ...s,
          startTime: new Date(s.startTime),
          endTime: s.endTime ? new Date(s.endTime) : undefined
        }));
        this.sessions.set(sessions);
      }
    } catch (err) {
      console.error('Error loading sessions:', err);
    }
  }

  clearAllSessions(): void {
    if (confirm('Delete all session history? This cannot be undone.')) {
      this.sessions.set([]);
      this.persistSessions();
    }
  }
}
