import { environment } from '../../environments/environment';

/**
 * Production-safe logging utility
 * Logs only appear in development mode
 */
export class Logger {
  static log(...args: any[]): void {
    if (!environment.production) {
      console.log(...args);
    }
  }

  static warn(...args: any[]): void {
    if (!environment.production) {
      console.warn(...args);
    }
  }

  static error(...args: any[]): void {
    if (!environment.production) {
      console.error(...args);
    }
    // In production, could send to error tracking service like Sentry
    // this.sendToErrorTracking(args);
  }

  static debug(...args: any[]): void {
    if (!environment.production) {
      console.debug(...args);
    }
  }

  static info(...args: any[]): void {
    if (!environment.production) {
      console.info(...args);
    }
  }
}
