# Milestone 6 — clean audio/music and release-prep playtest documentation

## Scope

Milestone 6 improves the clean-room audible presentation without introducing any historical WAV/OGG assets. The goal is not to reconstruct original Bubble Train music, but to replace the previous minimal single-beep feedback with a more complete procedural audio layer suitable for a production-minded restoration build.

## Implemented

### Procedural SFX

`src/audio/clean-audio.js` now provides richer synthesized cues for:

- fire
- match
- bomb / colour-bomb
- level transition
- win
- lose
- UI click

All cues are built from short oscillator envelopes and remain sample-free.

### Procedural music

A lightweight looping music planner was added for:

- **menu mode**
- **gameplay mode**

Gameplay music now varies by historical theme identity (`default`, `arctic`, `beach`, `mexico`, `mountains`, `sea`, `sky`, `space`) using simple note/bass plans. These are new melodies/patterns created for the restoration and are not intended as recreations of the historical soundtrack.

### Runtime integration

The demo now:

- starts menu music on the start/end overlays;
- starts gameplay music on run start;
- updates music theme when the campaign advances to a level with a different historical theme;
- attenuates music while paused;
- keeps audio clean-room and dependency-free.

## Validation

Two new tests were added:

- `tests/audio-music.test.js` verifies that procedural music covers the eight historical theme names.
- `tests/audio-music.test.js` also verifies deterministic planner fallback behavior.

Total suite: **57/57 passing**.

## Release-prep playtest checklist

Before calling the restoration production-ready, run the following matrix:

1. **Campaign sweep** — start each of the five historical `.gms` selections and verify:
   - start overlay;
   - first level load;
   - fire/match/bomb cues;
   - level transition audio;
   - pause/resume audio behavior.
2. **Long-form gameplay** — play through representative levels from `Easy`, `Normal`, `Hard` and `Everything`, especially those with many specials or multiple trains.
3. **Browser matrix** — Chromium, Firefox, Safari/WebKit where available.
4. **Input matrix** — keyboard, mouse/pointer, touch controls.
5. **Audio permission matrix** — verify first user gesture unlocks audio cleanly and that Sound Off fully disables cues/music.
6. **Accessibility checks** — small-screen readability, theme/background contrast, control discoverability, sound-off use.

## Fidelity boundary

The procedural music and SFX are explicitly **clean-room replacements**, not restorations of the historical soundtrack. Gameplay, timing, data and mechanics remain source-derived and historically grounded; audible presentation remains modern clean-room preservation support.

## Next recommended step

The next step is a final release-prep pass: browser/device matrix results, parity captures against an original-compatible build, and any last UI or audio balance tweaks revealed by real play sessions.
