# Quick Setup Guide

## Prerequisites Check

Before starting, ensure you have:

- [ ] .NET 9.0 SDK installed (`dotnet --version`)
- [ ] Node.js 18+ installed (`node --version`)
- [ ] OpenBCI board or data source ready

## Step-by-Step Setup

### 1. Backend Setup (5 minutes)

```bash
# Navigate to backend directory
cd openbci/console-bandalert

# Install Fleck WebSocket library
dotnet restore

# Run the application
dotnet run
```

**Expected Output:**
```
OpenBCI Band Alert — C# with WebSocket Server
Mode: AverageBandPower (UDP 15000)
WebSocket Server: ws://localhost:8080
Press Ctrl+C to exit.

WebSocket server started on port 8080
```

**Keep this terminal running** - the backend must be active for the frontend to work.

### 2. Frontend Setup (10 minutes)

Open a **new terminal**:

```bash
# Navigate to Angular project
cd openbci/angular-brainwave-ui

# Install dependencies (first time only)
npm install

# Start development server
npm start
```

**Expected Output:**
```
✔ Browser application bundle generation complete.
** Angular Live Development Server is listening on localhost:4200 **
```

Open your browser to `http://localhost:4200`

### 3. Add Preset Audio Files (Optional - 5 minutes)

```bash
# Navigate to sounds directory
cd src/assets/sounds

# Add your audio files here:
# - beep.mp3
# - chime.mp3
# - bell.mp3
# - tone.mp3
# - click.mp3
```

**Don't have audio files?** No problem! Use the **Tone** option in settings to generate sounds with Web Audio API.

### 4. Configure OpenBCI Data Source

In OpenBCI GUI or your data source:

**For Average Band Power mode:**
- Set UDP streaming to `localhost:15000`
- Enable Average Band Power output

**For Raw Time Series mode:**
- Set UDP streaming to `localhost:15001`
- Enable Raw Data output
- Update `console-bandalert/Program.cs`: `const bool USE_AVERAGE_BANDPOWER = false;`

### 5. Test the System

1. **Check Connection**: Look for green dot in top-left of web app
2. **Verify Data Flow**: Band power meters should update in real-time
3. **Test Audio**: 
   - Click gear icon → Settings
   - Expand any band
   - Click "Test Sound"
4. **Configure Alerts**:
   - Set duration thresholds per band
   - Customize audio sources
   - Adjust volumes

## Troubleshooting

### Backend Issues

**Problem**: `dotnet: command not found`
- **Solution**: Install .NET 9.0 SDK from https://dotnet.microsoft.com/download

**Problem**: WebSocket server won't start
- **Solution**: Port 8080 may be in use. Edit `console-bandalert/Program.cs` and change `WEBSOCKET_PORT`

**Problem**: No data received from OpenBCI
- **Solution**: 
  - Check OpenBCI GUI networking settings
  - Verify correct UDP port (15000 or 15001)
  - Check firewall isn't blocking UDP

### Frontend Issues

**Problem**: `npm: command not found`
- **Solution**: Install Node.js from https://nodejs.org

**Problem**: WebSocket connection failed
- **Solution**: 
  - Ensure C# backend is running
  - Check console for errors
  - Verify WebSocket URL in `src/environments/environment.ts`

**Problem**: Audio doesn't play
- **Solution**: 
  - **iOS**: Tap any "Test Sound" button first (Safari requires user gesture)
  - Check master volume and per-band volumes
  - Try "Tone" mode instead of "Preset"
  - Ensure audio files exist in `assets/sounds/`

**Problem**: Page shows "Connection Lost"
- **Solution**: 
  - Start the C# backend first
  - Check backend console for errors
  - Verify WebSocket server started successfully

### OpenBCI Configuration

**Problem**: Data format not recognized
- **Solution**: 
  - For pre-computed bands: Use Average Band Power mode → Port 15000
  - For raw EEG: Use Raw Time Series mode → Port 15001
  - Match `USE_AVERAGE_BANDPOWER` setting in `console-bandalert/Program.cs`

## Network Configuration

### Running on Different Machines

**Backend on Server (e.g., 192.168.1.100):**

1. Update `console-bandalert/Program.cs`:
   ```csharp
   var server = new WebSocketServer($"ws://0.0.0.0:{WEBSOCKET_PORT}");
   ```

2. Update frontend `environment.ts`:
   ```typescript
   websocketUrl: 'ws://192.168.1.100:8080'
   ```

3. Configure firewall to allow:
   - UDP 15000/15001 (OpenBCI data)
   - TCP 8080 (WebSocket)

### Mobile Device Access

1. Get your computer's local IP (e.g., 192.168.1.100)
2. Ensure firewall allows connections on port 4200
3. On mobile browser, navigate to: `http://192.168.1.100:4200`

## Production Deployment

### Backend (Windows Service)

```bash
dotnet publish -c Release -r win-x64 --self-contained
# Output in bin/Release/net9.0/win-x64/publish/
```

### Frontend (Static Hosting)

```bash
cd angular-brainwave-ui
npm run build
# Deploy dist/ folder to hosting service
```

Update `environment.prod.ts` with production WebSocket URL before building.

## Quick Reference

### Default Ports

| Service | Port | Purpose |
|---------|------|---------|
| UDP Average Band Power | 15000 | OpenBCI data input |
| UDP Raw Time Series | 15001 | OpenBCI raw data input |
| WebSocket Server | 8080 | Backend to frontend |
| Angular Dev Server | 4200 | Frontend web app |

### File Locations

- **Backend Configuration**: `openbci/console-bandalert/Program.cs`
- **Frontend Configuration**: `angular-brainwave-ui/src/environments/environment.ts`
- **Audio Files**: `angular-brainwave-ui/src/assets/sounds/`
- **Settings Storage**: Browser LocalStorage

### Useful Commands

```bash
# Backend
dotnet run                    # Run backend
dotnet watch run             # Run with hot reload
dotnet publish -c Release    # Build for production

# Frontend
npm start                    # Run dev server
npm run build               # Production build
ng generate component X     # Create component
```

## Next Steps

1. ✅ Backend running and receiving OpenBCI data
2. ✅ Frontend connected via WebSocket
3. ✅ Real-time visualization working
4. → Configure audio alerts per band
5. → Set duration thresholds
6. → Test on mobile device
7. → Customize band colors/settings

## Support

- Check main README.md for detailed documentation
- Review browser console for errors
- Check backend terminal for connection logs
- Test with sample data to isolate issues

---

**Quick Test**: With both backend and frontend running, you should see real-time updates in the browser within seconds of OpenBCI data transmission.
