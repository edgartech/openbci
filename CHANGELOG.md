# Changelog

## Version 2.0.0 - WebSocket Integration & Angular Frontend

### Backend Changes (C#)

#### Added
- **WebSocket Server** using Fleck library (port 8080)
- Real-time broadcasting of brainwave data to connected web clients
- Time-in-band tracking with millisecond precision
- Dominant frequency calculation (center of band range)
- Connection management for multiple WebSocket clients

#### Changed
- **Alert Logic**: Now only triggers when dominant band **changes** (not continuously)
- Alert() method returns boolean indicating if alert was triggered
- Added `previousAlertedBand` tracking to prevent repeated alerts
- Added `currentDominantBand` and `bandStartTime` for precise timing
- Enhanced console output with time-in-band display

#### JSON Output Format
```json
{
  "timestamp": "2025-10-13T23:31:45.123Z",
  "dominantBand": "alpha",
  "dominantFrequency": 10.0,
  "timeInBand": 2.5,
  "bandPowers": {
    "delta": 0.15,
    "theta": 0.22,
    "alpha": 0.38,
    "beta": 0.18,
    "gamma": 0.07
  },
  "isAlert": false
}
```

### Frontend Added (Angular 20)

#### Core Features
- **Real-time Visualization Dashboard**
  - Live dominant band display with color-coded background
  - Frequency range and center frequency display
  - Time-in-band counter with progress bar
  - Band power distribution meters (0-100%)
  - WebSocket connection status indicator

- **Audio Settings Panel**
  - Per-band audio configuration
  - Multiple audio source types:
    - Preset sounds (5 built-in options)
    - Custom audio file upload (MP3, WAV, OGG)
    - Tone generation with Web Audio API
    - Disable option
  - Individual volume control per band
  - Master volume control
  - Global enable/disable toggle

- **Duration Threshold Configuration**
  - Per-band threshold (0-30 seconds, 0.5s increments)
  - Real-time progress visualization
  - Enable/disable per band
  - Visual feedback for threshold completion

#### Technical Implementation
- **Angular 20** with standalone components architecture
- **Signals** for reactive state management
- **RxJS** for WebSocket stream management
- **TailwindCSS** for mobile-first responsive design
- **Web Audio API** for tone generation
- **LocalStorage** for settings persistence
- **Automatic reconnection** logic for WebSocket

#### Services
- `BrainwaveService`: WebSocket connection, data streaming, reconnection
- `AudioService`: Audio playback, file uploads, tone generation, settings
- `AlertService`: Duration tracking, threshold logic, alert triggering

#### Components
- `BrainwaveDashboardComponent`: Main visualization
- `AudioSettingsComponent`: Configuration UI
- `AppComponent`: Root with view routing

#### Mobile Optimization
- Touch-friendly interface (44x44px minimum targets)
- Portrait orientation optimized
- iOS Safari compatible
- Safe area insets support
- No horizontal scrolling
- PWA-ready architecture

### Dependencies Added

#### Backend
- `Fleck` 1.2.0 - WebSocket server library

#### Frontend
- `@angular/animations` 20.0.0
- `@angular/common` 20.0.0
- `@angular/core` 20.0.0
- `@angular/forms` 20.0.0
- `@angular/platform-browser` 20.0.0
- `tailwindcss` 3.4.17
- `rxjs` 7.8.1

### Configuration Options

#### Backend (Program.cs)
- `WEBSOCKET_PORT`: WebSocket server port (default: 8080)
- `USE_AVERAGE_BANDPOWER`: Data source mode toggle
- `DOMINANCE_THRESHOLD`: Sensitivity (0.0-1.0, default: 0.45)
- `STABLE_FRAMES`: Stability requirement (default: 4)

#### Frontend (environment.ts)
- `websocketUrl`: Backend WebSocket URL (default: ws://localhost:8080)

### Breaking Changes
- Alert behavior now requires band **change** instead of continuous alerts
- WebSocket server must be accessible for frontend to function
- Browser LocalStorage required for settings persistence

### Migration Notes
- No changes required to OpenBCI data input (UDP ports unchanged)
- Existing Program.cs logic preserved, only extended
- Console.Beep() still functions as before (on band change)

### Known Limitations
- iOS Safari requires user gesture before audio playback
- Preset audio files must be manually added to assets/sounds/
- WebSocket connection limited to 10 reconnection attempts
- Custom audio files limited to 5MB

### Documentation Added
- `README.md` - Comprehensive project documentation
- `SETUP.md` - Quick setup guide with troubleshooting
- `angular-brainwave-ui/README.md` - Frontend-specific docs
- `assets/sounds/README.md` - Audio file requirements

### Future Enhancements (Potential)
- Historical data logging and playback
- Multiple visualization modes (graphs, spectrograms)
- Session recording and export
- Cloud sync for settings
- Advanced biofeedback protocols
- Multi-user support
- REST API for data access
- Notification system (email, SMS, push)

---

## Version 1.0.0 - Initial Release

- UDP data reception (ports 15000/15001)
- FFT processing for raw time series
- Band power computation (Delta, Theta, Alpha, Beta, Gamma)
- Console-based alerts with beep sound
- Dominance detection with threshold
- Stability frame requirement
