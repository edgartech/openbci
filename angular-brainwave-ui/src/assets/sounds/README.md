# Preset Audio Files

This directory should contain preset audio files for the brainwave alerts.

## Required Files

Place the following audio files (MP3 format recommended) in this directory:

### Band-Specific Sounds (Default):
1. **delta.mp3** - Deep, slow sound for Delta band (1-4 Hz)
2. **theta.mp3** - Calming sound for Theta band (4-8 Hz)
3. **alpha.mp3** - Relaxed sound for Alpha band (8-12 Hz)
4. **beta.mp3** - Alert sound for Beta band (13-30 Hz)
5. **gamma.mp3** - Sharp sound for Gamma band (30-45 Hz)

### Additional Preset Options:
6. **beep.mp3** - Simple beep sound
7. **chime.mp3** - Pleasant chime sound
8. **bell.mp3** - Bell notification sound
9. **tone.mp3** - Pure tone sound
10. **click.mp3** - Click/tap sound

## File Requirements

- **Format**: MP3, WAV, or OGG
- **Duration**: 200-1000ms recommended
- **Size**: Under 100KB per file recommended
- **Sample Rate**: 44.1kHz or 48kHz

## Where to Find Sounds

You can:
1. Create your own using audio editing software (Audacity, GarageBand, etc.)
2. Download from free sound libraries:
   - freesound.org
   - zapsplat.com
   - soundbible.com
3. Use system sounds from your OS
4. Generate tones using audio software

## Testing

After adding files:
1. Restart the Angular dev server
2. Go to Settings in the app
3. Select "Preset" for any band
4. Choose the preset sound from the dropdown
5. Click "Test Sound" to verify it works

## Note

If preset files are missing, the app will still function but preset sounds won't play. You can use the "Tone" option to generate sounds using the Web Audio API instead.
