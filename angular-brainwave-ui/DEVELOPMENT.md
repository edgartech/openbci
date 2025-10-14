# Development Guide

## Getting Started

### First Time Setup

```bash
# Install dependencies
npm install

# Start development server
npm start
```

### Development Workflow

1. **Backend First**: Always start the C# backend before the frontend
2. **Live Reload**: Frontend automatically reloads on file changes
3. **Console Debugging**: Check browser console and backend terminal for errors

## Common Development Tasks

### Adding a New Brainwave Band

1. **Backend** (`Program.cs`):
   ```csharp
   static readonly (string label, double lo, double hi)[] Bands = new[] {
       ("delta", 1.0, 4.0),
       ("theta", 4.0, 8.0),
       ("alpha", 8.0, 12.0),
       ("beta",  13.0, 30.0),
       ("gamma", 30.0, 45.0),
       ("custom", 45.0, 60.0)  // Add your band here
   };
   ```

2. **Frontend** (`brainwave.service.ts`):
   ```typescript
   export type BrainwaveBand = 'delta' | 'theta' | 'alpha' | 'beta' | 'gamma' | 'custom';
   
   export const BAND_INFO: Record<BrainwaveBand, ...> = {
     // ... existing bands
     custom: { label: 'Custom', range: '45-60 Hz', color: '#9333EA' }
   };
   ```

3. **Tailwind Config** (`tailwind.config.js`):
   ```javascript
   colors: {
     'band-custom': '#9333EA',
   }
   ```

4. Update TypeScript types in audio.service.ts and alert.service.ts

### Customizing Band Colors

**Option 1: Tailwind Config**
```javascript
// tailwind.config.js
colors: {
  'band-delta': '#6B46C1',  // Change these
  'band-theta': '#3B82F6',
  // ...
}
```

**Option 2: Service Constant**
```typescript
// brainwave.service.ts
export const BAND_INFO: Record<BrainwaveBand, ...> = {
  delta: { label: 'Delta', range: '1-4 Hz', color: '#YOUR_COLOR' },
  // ...
};
```

### Adding New Preset Sounds

1. Add audio file to `src/assets/sounds/your-sound.mp3`
2. Update `audio.service.ts`:
   ```typescript
   const PRESET_SOUNDS = [
     'beep',
     'chime',
     'bell',
     'tone',
     'click',
     'your-sound'  // Add here
   ];
   ```

### Changing WebSocket Port

**Backend** (`Program.cs`):
```csharp
const int WEBSOCKET_PORT = 9000;  // Change this
```

**Frontend** (`environment.ts`):
```typescript
websocketUrl: 'ws://localhost:9000'  // Match backend
```

### Modifying Alert Sensitivity

**Dominance Threshold** (how strong band must be):
```csharp
const double DOMINANCE_THRESHOLD = 0.45;  // 0.0-1.0
// Lower = more sensitive, Higher = requires stronger dominance
```

**Stability Frames** (how many frames to confirm):
```csharp
const int STABLE_FRAMES = 4;  // Number of consecutive frames
// Lower = faster alerts, Higher = more stable/less false positives
```

### Creating a New Component

```bash
cd src/app/components
ng generate component my-new-component --standalone
```

### Creating a New Service

```bash
cd src/app/services
ng generate service my-service
```

## Architecture Patterns

### Signal-Based State Management

```typescript
// Use signals for reactive state
myValue = signal<number>(0);
myComputedValue = computed(() => this.myValue() * 2);

// Update signal
this.myValue.set(10);
this.myValue.update(v => v + 1);
```

### WebSocket Data Flow

```
C# Backend → WebSocket → BrainwaveService.data$ → AlertService → AudioService
                              ↓
                        BrainwaveDashboardComponent
```

### Settings Persistence Pattern

```typescript
// Save to localStorage
private saveSettings(): void {
  localStorage.setItem('key', JSON.stringify(this.settings()));
}

// Load from localStorage
private loadSettings(): void {
  const saved = localStorage.getItem('key');
  if (saved) {
    this.settings.set(JSON.parse(saved));
  }
}
```

## Debugging Tips

### WebSocket Connection Issues

1. **Check Backend Console**:
   ```
   WebSocket server started on port 8080
   WebSocket client connected: 192.168.1.x
   ```

2. **Check Browser Console**:
   ```javascript
   // Look for connection messages
   console.log('WebSocket connected');
   ```

3. **Test WebSocket Manually**:
   ```javascript
   // In browser console
   const ws = new WebSocket('ws://localhost:8080');
   ws.onmessage = (e) => console.log(JSON.parse(e.data));
   ```

### Audio Not Playing

1. **Check Audio Context State**:
   ```javascript
   // In browser console
   const ctx = new AudioContext();
   console.log(ctx.state);  // Should be 'running'
   ```

2. **Test Web Audio API**:
   ```javascript
   // In browser console
   const ctx = new AudioContext();
   const osc = ctx.createOscillator();
   osc.connect(ctx.destination);
   osc.start();
   osc.stop(ctx.currentTime + 0.5);
   ```

3. **iOS Debugging**:
   - Connect device via USB
   - Safari → Develop → [Device] → [Page]
   - Check console for audio errors

### Data Flow Debugging

Add logging in services:

```typescript
// brainwave.service.ts
this.ws.onmessage = (event) => {
  console.log('Raw WS data:', event.data);
  const data = JSON.parse(event.data);
  console.log('Parsed data:', data);
  this.dataSubject.next(data);
};

// alert.service.ts
private startMonitoring(): void {
  this.brainwaveService.data$.subscribe((data: any) => {
    console.log('Alert service received:', data);
    // ...
  });
}
```

## Performance Optimization

### Reduce Change Detection

Use `OnPush` strategy:
```typescript
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush
})
```

### Optimize Signal Updates

```typescript
// Bad: Creates new object every time
this.settings.set({ ...this.settings(), newProp: value });

// Good: Only update what changed
this.settings.update(current => ({ ...current, newProp: value }));
```

### Lazy Load Large Assets

```typescript
// Don't preload all sounds if not needed
private lazyLoadSound(name: string): Promise<HTMLAudioElement> {
  return new Promise((resolve) => {
    const audio = new Audio(`assets/sounds/${name}.mp3`);
    audio.addEventListener('canplaythrough', () => resolve(audio));
    audio.load();
  });
}
```

## Testing

### Manual Testing Checklist

- [ ] WebSocket connects successfully
- [ ] Data updates in real-time
- [ ] Band colors change correctly
- [ ] Time counter increments
- [ ] Progress bar animates smoothly
- [ ] Settings button opens panel
- [ ] Audio test buttons play sounds
- [ ] Volume sliders affect playback
- [ ] Custom audio upload works
- [ ] Tone generator produces sound
- [ ] Settings persist after reload
- [ ] Mobile layout responsive
- [ ] Touch targets adequate size
- [ ] No horizontal scrolling
- [ ] Reconnection after disconnect

### Unit Testing

```bash
# Run all tests
ng test

# Run with coverage
ng test --code-coverage

# Run specific test file
ng test --include='**/brainwave.service.spec.ts'
```

### E2E Testing (Future)

```bash
# Install Playwright
npm install -D @playwright/test

# Run E2E tests
npx playwright test
```

## Deployment Checklist

### Before Building

- [ ] Update `environment.prod.ts` with production WebSocket URL
- [ ] Test all features in production mode locally
- [ ] Verify audio files are included in build
- [ ] Check bundle size is acceptable
- [ ] Test on target mobile devices

### Build

```bash
# Production build
npm run build -- --configuration production

# Analyze bundle size
npm install -g webpack-bundle-analyzer
ng build --stats-json
webpack-bundle-analyzer dist/angular-brainwave-ui/stats.json
```

### Deploy

```bash
# Deploy to Netlify
npm install -g netlify-cli
netlify deploy --prod --dir=dist/angular-brainwave-ui/browser

# Deploy to Vercel
npm install -g vercel
vercel --prod
```

## Common Pitfalls

1. **Forgetting to start backend** - Frontend will show "Connection Lost"
2. **iOS audio not playing** - User must interact first (tap test button)
3. **Settings not persisting** - Check localStorage isn't disabled
4. **WebSocket disconnecting** - Check firewall/network settings
5. **Audio files not found** - Verify files are in assets/sounds/
6. **Band colors not updating** - Check both TailwindCSS and service colors match

## Useful VS Code Extensions

- **Angular Language Service** - IntelliSense for templates
- **Tailwind CSS IntelliSense** - Class name autocomplete
- **ESLint** - Code quality
- **Prettier** - Code formatting
- **Angular Schematics** - Component generation

## Resources

- [Angular Docs](https://angular.dev/)
- [TailwindCSS Docs](https://tailwindcss.com/)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [RxJS Docs](https://rxjs.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## Getting Help

1. Check browser console for errors
2. Check backend terminal for connection logs
3. Review README.md troubleshooting section
4. Test with minimal configuration
5. Isolate the issue (backend vs frontend)
