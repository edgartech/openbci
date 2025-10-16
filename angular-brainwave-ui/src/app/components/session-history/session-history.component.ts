import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SessionService, SessionData } from '../../services/session.service';
import { BrainwaveService, BAND_INFO, BrainwaveBand } from '../../services/brainwave.service';

@Component({
  selector: 'app-session-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './session-history.component.html',
  styleUrls: ['./session-history.component.css']
})
export class SessionHistoryComponent {
  selectedSession: SessionData | null = null;
  editingNotes = false;
  notesText = '';
  showDisclaimer = false;

  summary = computed(() => this.sessionService.getSummary());
  sessions = computed(() => this.sessionService.sessions());
  isRecording = computed(() => this.sessionService.isRecording());
  currentDuration = computed(() => this.sessionService.currentSessionDuration());

  constructor(
    public sessionService: SessionService,
    private brainwaveService: BrainwaveService
  ) {}

  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }

  formatTime(date: Date): string {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  getBandInfo(band: BrainwaveBand) {
    return BAND_INFO[band];
  }

  getBandColor(band: string): string {
    return this.brainwaveService.getBandColor(band);
  }

  startRecording(): void {
    this.sessionService.startSession();
  }

  stopRecording(): void {
    this.sessionService.endSession();
  }

  viewSession(session: SessionData): void {
    this.selectedSession = session;
    this.notesText = session.notes || '';
    this.editingNotes = false;
  }

  closeSessionDetails(): void {
    this.selectedSession = null;
    this.editingNotes = false;
  }

  toggleEditNotes(): void {
    this.editingNotes = !this.editingNotes;
    if (this.editingNotes) {
      this.notesText = this.selectedSession?.notes || '';
    }
  }

  saveNotes(): void {
    if (this.selectedSession) {
      this.sessionService.addNotesToSession(this.selectedSession.id, this.notesText);
      this.selectedSession.notes = this.notesText;
      this.editingNotes = false;
    }
  }

  deleteSession(session: SessionData, event: Event): void {
    event.stopPropagation();
    if (confirm('Delete this session?')) {
      this.sessionService.deleteSession(session.id);
      if (this.selectedSession?.id === session.id) {
        this.selectedSession = null;
      }
    }
  }

  clearAllSessions(): void {
    this.sessionService.clearAllSessions();
    this.selectedSession = null;
  }

  exportSessions(): void {
    const sessions = this.sessions();
    const dataStr = JSON.stringify(sessions, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `brainwave-sessions-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  getSortedBands(session: SessionData): Array<{ band: BrainwaveBand; stats: any }> {
    return Object.entries(session.bandStats)
      .map(([band, stats]) => ({ band: band as BrainwaveBand, stats }))
      .sort((a, b) => b.stats.percentage - a.stats.percentage);
  }
}
