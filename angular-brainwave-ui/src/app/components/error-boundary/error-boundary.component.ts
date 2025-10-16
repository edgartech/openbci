import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ErrorType = 'connection' | 'websocket' | 'audio' | 'storage' | 'unknown';

export interface ErrorState {
  type: ErrorType;
  message: string;
  details?: string;
  recoverable: boolean;
}

@Component({
  selector: 'app-error-boundary',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 bg-gray-900 flex items-center justify-center p-4 z-50" 
         role="alert" 
         aria-live="assertive"
         aria-atomic="true">
      <div class="max-w-md w-full bg-gray-800 rounded-lg shadow-xl border border-red-500/30 overflow-hidden">
        <!-- Error Icon -->
        <div class="bg-red-500/10 p-6 text-center">
          @if (error().type === 'connection' || error().type === 'websocket') {
            <svg class="w-20 h-20 mx-auto text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3" />
            </svg>
          } @else if (error().type === 'audio') {
            <svg class="w-20 h-20 mx-auto text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clip-rule="evenodd" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          } @else if (error().type === 'storage') {
            <svg class="w-20 h-20 mx-auto text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
            </svg>
          } @else {
            <svg class="w-20 h-20 mx-auto text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
        </div>

        <!-- Error Content -->
        <div class="p-6">
          <h2 class="text-2xl font-bold text-red-400 mb-2" id="error-title">
            {{ getErrorTitle() }}
          </h2>
          
          <p class="text-gray-300 mb-4" id="error-message">
            {{ error().message }}
          </p>

          @if (error().details) {
            <details class="mb-4">
              <summary class="cursor-pointer text-sm text-gray-400 hover:text-gray-300 mb-2">
                Technical Details
              </summary>
              <pre class="text-xs text-gray-500 bg-gray-900 p-3 rounded overflow-x-auto">{{ error().details }}</pre>
            </details>
          }

          <!-- Recovery Instructions -->
          <div class="bg-gray-900 p-4 rounded-lg mb-4" role="region" aria-labelledby="recovery-title">
            <h3 class="font-semibold text-gray-200 mb-2 flex items-center gap-2" id="recovery-title">
              <svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Troubleshooting Steps
            </h3>
            <ul class="text-sm text-gray-400 space-y-1 list-disc list-inside">
              @if (error().type === 'connection' || error().type === 'websocket') {
                <li>Check that the C# backend server is running</li>
                <li>Verify WebSocket URL in settings matches backend</li>
                <li>Ensure firewall isn't blocking port 8080</li>
                <li>Try restarting the backend application</li>
              } @else if (error().type === 'audio') {
                <li>Check browser permissions for audio playback</li>
                <li>Try clicking anywhere on the page to enable audio</li>
                <li>Verify master volume is not muted</li>
                <li>Test with different audio settings</li>
              } @else if (error().type === 'storage') {
                <li>Check browser storage isn't full (clear cache)</li>
                <li>Disable private/incognito mode if active</li>
                <li>Try a different browser</li>
                <li>Export your data before clearing storage</li>
              } @else {
                <li>Refresh the page to reset the application</li>
                <li>Check browser console for error details</li>
                <li>Try a different browser</li>
                <li>Clear browser cache and reload</li>
              }
            </ul>
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-3">
            @if (error().recoverable && onRetry) {
              <button 
                (click)="onRetry()"
                class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
                aria-label="Retry connection">
                <span class="flex items-center justify-center gap-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Retry
                </span>
              </button>
            }
            @if (onReload) {
              <button 
                (click)="onReload()"
                class="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-800"
                aria-label="Reload application">
                <span class="flex items-center justify-center gap-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Reload Page
                </span>
              </button>
            }
          </div>
        </div>

        <!-- Footer -->
        <div class="bg-gray-900 px-6 py-3 text-center border-t border-gray-700">
          <p class="text-xs text-gray-500">
            Need help? Check the 
            <a href="https://github.com/openbci" class="text-blue-400 hover:text-blue-300 underline" target="_blank" rel="noopener">
              documentation
            </a>
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class ErrorBoundaryComponent {
  @Input({ required: true }) error!: () => ErrorState;
  @Input() onRetry?: () => void;
  @Input() onReload?: () => void;

  getErrorTitle(): string {
    switch (this.error().type) {
      case 'connection':
      case 'websocket':
        return 'Connection Lost';
      case 'audio':
        return 'Audio Error';
      case 'storage':
        return 'Storage Error';
      default:
        return 'Something Went Wrong';
    }
  }
}
