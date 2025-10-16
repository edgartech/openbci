# Dominant Alerts: Bug Fix + Audio Distinction Feature

## Issues Addressed

### 1. ✅ Bug Fixed: Global Audio Control Blocking Dominant Alerts

**Problem:** When global audio was disabled, dominant alerts wouldn't play even though they have their own separate enable/disable toggle.

**Root Cause:** The `AudioService.playForBand()` method checked `globalEnabled()` and returned early, blocking ALL audio playback.

**Solution:** Added optional `bypassGlobalControl` parameter to `playForBand()`:
- Live alerts: Respect global control (default behavior)
- Dominant alerts: Bypass global control (independent operation)

**Code Changes:**
```typescript
// audio.service.ts
playForBand(band: BrainwaveBand, bypassGlobalControl = false): void {
  if (!bypassGlobalControl && !this.globalEnabled()) {
    return;  // Only blocks if not bypassing
  }
  // ... rest of playback logic
}

// alert.service.ts - Live alerts
this.audioService.playForBand(band);  // Respects global control

// alert.service.ts - Dominant alerts
this.audioService.playForBand(band, true);  // Bypasses global control
```

**Result:** Dominant alerts now work independently. You can:
- ✅ Disable global audio but keep dominant alerts enabled
- ✅ Mute live alerts while using dominant alerts
- ✅ Have complete independent control over both systems

---

### 2. ✅ Audio Distinction Feature Implemented

**Problem:** When both alert types are enabled, users can't distinguish which alert triggered because they play identical sounds.

**Solution:** Added **Audio Distinction Modes** with pitch-shifting capability.

#### **New Configuration Options**

##### **Audio Mode Selection:**

1. **Same as Live Alerts**
   - Identical sound as configured for the band
   - Use when only one alert system is enabled
   - No distinction between live and dominant

2. **Higher Pitch** ⭐ RECOMMENDED DEFAULT
   - Plays same sound at higher pitch (default 150%)
   - Easy to distinguish from live alerts
   - Works with all audio types (preset, custom, tone)
   - Sounds "brighter" and "elevated" = achievement!

3. **Lower Pitch**
   - Plays same sound at lower pitch (configurable)
   - Sounds "deeper" and "calmer"
   - Alternative if you prefer lower tones

4. **Separate Audio** (Coming Soon)
   - Completely independent audio configuration per band
   - Future enhancement for maximum flexibility

##### **Pitch Shift Control:**
- **Range:** 50% - 200%
- **Default:** 150% (50% higher)
- **Examples:**
  - 75% = Deeper, slower sound
  - 100% = Normal (same as live)
  - 150% = Higher, brighter sound (default)
  - 200% = Much higher, chipmunk-like

#### **How Pitch Shifting Works**

**For Preset & Custom Audio:**
Uses HTML5 Audio `playbackRate` property:
```typescript
clone.playbackRate = pitchMultiplier;  // 1.5 = 50% higher
clone.preservesPitch = false;  // Allow pitch change
```

**For Tone Generator:**
Adjusts frequency directly:
```typescript
oscillator.frequency.setValueAtTime(
  config.toneFrequency! * pitchMultiplier,
  this.audioContext.currentTime
);
```

#### **UI Location**

Settings → Dominant Frequency Alerts → Audio Distinction (when enabled)

```
┌─────────────────────────────────────┐
│ ⭐ Dominant Frequency Alerts        │
├─────────────────────────────────────┤
│ [x] Enabled                         │
│                                     │
│ Confidence Level                    │
│ [2 Stars+ (Moderate+)        ▼]    │
│                                     │
│ 🔊 Audio Distinction                │
│ [Higher Pitch (Recommended)  ▼]    │
│                                     │
│ Pitch Shift              150%       │
│ [━━━━━━━━━●━━━━━━━━━━]            │
│ Lower (50%)  Normal (100%)  (200%)  │
│                                     │
│ Cooldown Period          5.0s       │
│ [━━━━━━━━━━━━━━━━━━━━━]            │
└─────────────────────────────────────┘
```

---

## Recommended Configuration

### **For Both Alert Types Enabled:**

```yaml
Live Alerts:
  - Purpose: Instant feedback
  - Sound: Normal pitch (default audio)
  - Example: "Beep" at normal pitch

Dominant Alerts:
  - Purpose: Sustained state confirmation
  - Sound: Higher pitch (150%)
  - Example: "Beep" at 1.5x higher pitch
```

**Experience:**
- Quick "beep" = Live alert (just entered Alpha)
- Higher "beeep" = Dominant alert (sustained Alpha state achieved!)

### **For Meditation Training:**

```yaml
Live Alerts:
  - Disable or set to very long thresholds
  - Reduces distractions

Dominant Alerts:
  - Enabled with 3-4 stars (high confidence)
  - Higher pitch mode
  - Result: Only alerted when truly in meditative state
```

### **For Research/Logging:**

```yaml
Live Alerts:
  - Short thresholds (5s)
  - Normal pitch
  - Log instant transitions

Dominant Alerts:
  - 2 stars (moderate confidence)
  - Lower pitch mode (distinct but calm)
  - Log sustained states
```

---

## Technical Details

### **Files Modified:**

1. ✅ `src/app/services/audio.service.ts`
   - Added `bypassGlobalControl` parameter
   - Implemented `playForBandWithPitch()`
   - Added `playPresetWithPitch()` and `playCustomWithPitch()`

2. ✅ `src/app/services/alert.service.ts`
   - Added `DominantAudioMode` type
   - Expanded `DominantAlertSettings` interface
   - Updated `triggerDominantAlert()` to use audio modes
   - Added `setDominantAudioMode()` and `setDominantPitchShift()`

3. ✅ `src/app/components/audio-settings/audio-settings.component.ts`
   - Imported `DominantAudioMode` type
   - Added UI control methods
   - Added label/description helpers

4. ✅ `src/app/components/audio-settings/audio-settings.component.html`
   - Added audio mode dropdown
   - Added pitch shift slider (conditional)
   - Updated info box text

### **New Interfaces:**

```typescript
export type DominantAudioMode = 
  | 'same-as-live'     // Identical sound
  | 'pitch-higher'     // Higher pitch (recommended)
  | 'pitch-lower'      // Lower pitch
  | 'separate';        // Future: separate settings

export interface DominantAlertSettings {
  enabled: boolean;
  confidenceLevel: ConfidenceLevel;
  cooldownSeconds: number;
  audioMode: DominantAudioMode;     // NEW
  pitchShift: number;               // NEW (50-200%)
}
```

### **Storage:**

All new settings are automatically saved/loaded via localStorage:
- Key: `brainwave-dominant-alerts`
- Includes: `audioMode`, `pitchShift`
- Auto-saved on every change
- Included in backup/restore exports

### **Performance:**

- Negligible overhead
- Pitch shifting uses native browser APIs
- No additional audio file loading
- Same memory footprint

---

## Testing Guide

### **Test 1: Verify Bug Fix**

1. Disable global audio control
2. Enable dominant alerts
3. Wait for primary state to change
4. ✅ **Expected:** Dominant alert plays
5. ❌ **Before fix:** No sound

### **Test 2: Audio Distinction**

1. Enable both live and dominant alerts
2. Set dominant to "Higher Pitch" (150%)
3. Trigger both alerts (e.g., hold Alpha for 5s, then 30s)
4. ✅ **Expected:** 
   - Live: Normal pitch beep
   - Dominant: Higher pitch beep (clearly distinguishable)

### **Test 3: Pitch Adjustment**

1. Set pitch to 200% (maximum)
2. Trigger dominant alert
3. ✅ **Expected:** Very high-pitched sound
4. Set pitch to 50% (minimum)
5. Trigger dominant alert
6. ✅ **Expected:** Very low-pitched, slow sound

### **Test 4: Mode Switching**

1. Try all audio modes:
   - Same as Live: Identical sound
   - Higher Pitch: Clearly higher
   - Lower Pitch: Clearly lower
2. ✅ **Expected:** Immediate effect, no restart needed

---

## Migration Notes

### **Existing Users:**

Your dominant alert settings will auto-upgrade with these defaults:
```yaml
audioMode: 'pitch-higher'
pitchShift: 150
```

No action needed. Settings will be applied on next app load.

### **Backup Files:**

Old backup files (without audio settings) will import fine.
New fields will use defaults.

New backup files include:
```json
{
  "alerts": {
    "dominantSettings": {
      "enabled": true,
      "confidenceLevel": "moderate-plus",
      "cooldownSeconds": 5,
      "audioMode": "pitch-higher",
      "pitchShift": 150
    }
  }
}
```

---

## Future Enhancements

### **Planned (if requested):**

1. **Separate Audio Configuration**
   - Completely independent audio per band for dominant alerts
   - Own presets, custom sounds, tones
   - Maximum flexibility

2. **Per-Band Audio Modes**
   - Different pitch shifts per band
   - E.g., Alpha = higher, Beta = lower

3. **Visual Indicators**
   - Show which type of alert fired
   - History log of alerts
   - Dashboard badge/icon

4. **Audio Effects**
   - Reverb/echo for dominant alerts
   - Double-beep pattern
   - Fade in/out

5. **Presets**
   - "Meditation Mode" configuration
   - "Focus Training" configuration
   - "Sleep Tracking" configuration
   - One-click setups

---

## Summary

✅ **Bug Fixed:** Dominant alerts now independent of global audio control

✅ **Feature Added:** Audio distinction with pitch-shifting

✅ **Default Behavior:** Higher pitch (150%) for easy distinction

✅ **User Control:** Full customization of audio modes and pitch

✅ **Backward Compatible:** Existing settings preserved

✅ **Documented:** Complete user guide and technical docs

---

## Quick Start

### **Recommended Setup (Both Alert Types):**

1. Settings → Dominant Frequency Alerts
2. Enable dominant alerts ✅
3. Set confidence to "2 Stars+ (Moderate+)"
4. Set audio to "Higher Pitch (Recommended)"
5. Keep pitch at 150%
6. Set cooldown to 5 seconds

**Result:** 
- Live alerts = normal sound (instant feedback)
- Dominant alerts = higher pitch (sustained achievement)
- Easily distinguish which alert triggered!

Enjoy your enhanced neurofeedback training! 🧠⚡
