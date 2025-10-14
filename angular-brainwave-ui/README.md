# Brainwave Monitor - Angular Frontend

Modern Angular 20 web application for real-time brainwave visualization and customizable audio alerts.

## Quick Start

### Install Dependencies

```bash
npm install
```

### Development Server

```bash
npm start
```

Navigate to `http://localhost:4200`. The app will automatically reload if you change any source files.

### Build

```bash
npm run build
```

Build artifacts will be stored in the `dist/` directory.

## Features

- **Real-time WebSocket Connection** to C# backend
- **Live Band Visualization** with smooth color transitions
- **Customizable Audio Alerts** per brainwave band
- **Duration Threshold Configuration** (0-30 seconds per band)
- **Multiple Audio Sources**:
  - Preset sounds
  - Custom file uploads
  - Tone generation (Web Audio API)
- **Mobile-First Design** optimized for touch interfaces
- **LocalStorage Persistence** for all settings

## Configuration

Edit `src/environments/environment.ts` to change the WebSocket URL:

```typescript
export const environment = {
  production: false,
  websocketUrl: 'ws://localhost:8080'
};
```

## Project Structure

```
src/
├── app/
│   ├── components/
│   │   ├── brainwave-dashboard/    # Main visualization component
│   │   └── audio-settings/         # Settings and configuration
│   ├── services/
│   │   ├── brainwave.service.ts    # WebSocket connection & data
│   │   ├── audio.service.ts        # Audio playback & management
│   │   └── alert.service.ts        # Duration threshold logic
│   └── app.component.ts            # Root component
├── assets/
│   └── sounds/                     # Preset audio files (add your own)
├── environments/                   # Environment configurations
└── styles.css                      # Global Tailwind styles
```

## Adding Preset Sounds

1. Place audio files in `src/assets/sounds/`
2. Required filenames:
   - `beep.mp3`
   - `chime.mp3`
   - `bell.mp3`
   - `tone.mp3`
   - `click.mp3`
3. Restart dev server

See `src/assets/sounds/README.md` for details.

## Technologies

- **Angular 20** - Standalone components architecture
- **TypeScript** - Strict mode enabled
- **TailwindCSS** - Utility-first styling
- **RxJS** - Reactive data streams
- **Web Audio API** - Tone generation
- **WebSocket** - Real-time data connection

## Browser Support

- Chrome/Edge 90+
- Safari 15+ (iOS 15+)
- Firefox 90+

**Note:** Safari on iOS requires user interaction before playing audio.

## Development

### Code Scaffolding

```bash
ng generate component components/my-component
ng generate service services/my-service
```

### Running Tests

```bash
ng test
```

### Linting

```bash
ng lint
```

## Deployment

### Production Build

```bash
npm run build
```

### Deploy to Static Hosting

The `dist/` folder can be deployed to:
- Netlify
- Vercel
- GitHub Pages
- Firebase Hosting
- Any static file server

Remember to update `environment.prod.ts` with your production WebSocket URL.

## Troubleshooting

**WebSocket won't connect:**
- Ensure C# backend is running on port 8080
- Check browser console for errors
- Verify `environment.ts` WebSocket URL

**Audio not playing:**
- On iOS: Tap any sound test button first
- Check volume settings (master + per-band)
- Verify audio files exist in `assets/sounds/`

**Settings not saving:**
- Check browser LocalStorage isn't disabled
- Try clearing cache and reloading

## License

Part of the OpenBCI Brainwave Monitor project.
