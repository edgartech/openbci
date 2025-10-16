import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrainwaveDashboardComponent } from './components/brainwave-dashboard/brainwave-dashboard.component';
import { AudioSettingsComponent } from './components/audio-settings/audio-settings.component';
import { SessionHistoryComponent } from './components/session-history/session-history.component';
import { DocumentationComponent } from './components/documentation/documentation.component';
import { ErrorBoundaryComponent, ErrorState } from './components/error-boundary/error-boundary.component';
import { BrainwaveService } from './services/brainwave.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, BrainwaveDashboardComponent, AudioSettingsComponent, SessionHistoryComponent, DocumentationComponent, ErrorBoundaryComponent],
  template: `
    <!-- Error Boundary - Shows on critical errors -->
    @if (hasError()) {
      <app-error-boundary 
        [error]="errorState"
        [onRetry]="handleRetry"
        [onReload]="handleReload" />
    }
    
    <div class="app-container" [class.hidden]="hasError()">
      @if (currentView() === 'dashboard') {
        <app-brainwave-dashboard 
          (settingsClick)="showSettings()" 
          (historyClick)="showHistory()"
          (docsClick)="showDocs()" />
      } @else if (currentView() === 'settings') {
        <div class="settings-view">
          <header class="sticky top-0 z-50 bg-gray-800 border-b border-gray-700 px-4 py-3">
            <div class="flex items-center gap-3 max-w-2xl mx-auto">
              <button 
                (click)="showDashboard()"
                class="touch-target p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <h1 class="text-xl font-bold">Back to Dashboard</h1>
            </div>
          </header>
          <app-audio-settings />
        </div>
      } @else if (currentView() === 'history') {
        <div class="history-view">
          <header class="sticky top-0 z-50 bg-gray-800 border-b border-gray-700 px-4 py-3">
            <div class="flex items-center gap-3 max-w-2xl mx-auto">
              <button 
                (click)="showDashboard()"
                class="touch-target p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <h1 class="text-xl font-bold">Back to Dashboard</h1>
            </div>
          </header>
          <app-session-history />
        </div>
      } @else if (currentView() === 'docs') {
        <app-documentation (closeClick)="showDashboard()" />
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }

    .app-container {
      min-height: 100vh;
      background-color: #111827;
    }

    .settings-view, .history-view {
      min-height: 100vh;
    }

    .touch-target {
      min-width: 44px;
      min-height: 44px;
    }

    .hidden {
      display: none !important;
    }
  `]
})
export class AppComponent {
  currentView = signal<'dashboard' | 'settings' | 'history' | 'docs'>('dashboard');

  constructor(private brainwaveService: BrainwaveService) {}

  // Error boundary state
  hasError = computed(() => this.brainwaveService.criticalError() !== null);
  
  errorState = computed((): ErrorState => {
    const error = this.brainwaveService.criticalError();
    if (!error) {
      return {
        type: 'unknown',
        message: '',
        recoverable: false
      };
    }
    
    return {
      type: error.type,
      message: error.message,
      details: error.details,
      recoverable: true
    };
  });

  handleRetry = (): void => {
    this.brainwaveService.resetError();
    this.brainwaveService.connect();
  };

  handleReload = (): void => {
    window.location.reload();
  };

  showDashboard(): void {
    this.currentView.set('dashboard');
  }

  showSettings(): void {
    this.currentView.set('settings');
  }

  showHistory(): void {
    this.currentView.set('history');
  }

  showDocs(): void {
    this.currentView.set('docs');
  }
}
