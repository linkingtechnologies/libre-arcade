# Presentation assets: historical vs reconstructed

The gameplay target remains Yanoid 0.3.0 (SDL Game Development Contest 2001). The following presentation assets are modern reconstructions and are intentionally **not** represented as historical Yanoid material.

## Bitmap font

`assets/fonts/yanoid-web-5x7.png` is a new 5×7 bitmap alphabet authored for this web port. It is used for messages and pause/game-over overlays rendered inside the 800×600 Canvas.

It does not copy or trace the historical `ConsoleFont.png` or `LargeFont.png`. Those historical fonts are not included in the public release; their provenance is documented only in the archaeology notes.

The surrounding HTML UI uses only a system monospace stack; no font file is downloaded or bundled for DOM text.

## Music

`src/audio.js` contains an original four-bar, 64-step chiptune/tracker-style loop at 132 BPM. Lead, bass and percussion are synthesized at runtime with Web Audio oscillators. There are no samples and no embedded MOD/XM data.

The historical `yanoid.xm` is not included and is not loaded by the web game.

## Sound effects

All gameplay sound effects are synthesized at runtime. Historical WAV files are not included or loaded by the web game.

## User controls

Effects and music have separate toggles. Their values are persisted in local storage as `yanoid.fx` and `yanoid.music`.
