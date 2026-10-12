# Lawn Mower — Libre Arcade restoration M9 / RC6

Faithful browser restoration of Shiru's 2011 NES homebrew **Lawn Mower**.

M9 is the production-readiness milestone. RC2 fixed two renderer artefacts found during hands-on play; RC3 completed a focused PPU/CHR hardening pass; RC4 hardened Web Audio; RC5 corrected title raster alignment. RC6 closes the remaining visual-parity issues in message reveal/camera phase and the low-fuel mower flash.

## Play locally

Serve this directory over HTTP:

- Windows: `run-local.bat`
- Linux/macOS: `./run-local.sh`

Then open `http://localhost:8000/`.

For deployment, publish the contents of **`release/`** rather than the preservation root. The release tree intentionally excludes ROMs, the historical editor, audit screenshots, tests and archaeology material.

## Controls

### Keyboard
- Arrow keys: direction
- **Z/X**: boost (NES A/B)
- **Enter**: start / pause / unpause / confirm

### Touch
- D-pad: direction
- **A/B**: boost
- **START**: start / pause / confirm

Touch controls use a dedicated deck in portrait and translucent side overlays in landscape. The shell is designed to avoid document scrolling.

## Release shell

- English/Italian wrapper; original in-game NES pixels are preserved.
- Audio toggle with optional local preference persistence.
- Instructions and credits live in a modal, not on the game screen.
- Opening the modal freezes simulation/audio and isolates background focus.
- Hiding the page suspends Web Audio to prevent stuck tones.
- Restart is a true cold-reset (`seed=1`).
- No save/resume was added because the historical game had none.
- No debug, archaeology text or Libre Arcade footer appears on the main game screen.

## Fidelity baseline

The restoration preserves all 10 levels, movement/fuel rules, RNG side effects, NTSC cadence, original CHR/title/final assets, full game flow, and the original FamiTone music/SFX event streams.

See `audit/RC6_REPORT.md` for the final visual-parity pass, `audit/RC4_AUDIO_REPORT.md` for audio-level QA, `audit/RC3_REPORT.md` for PPU/CHR QA, `audit/M9_REPORT.md` for production-readiness QA, and `CHANGELOG.md` for the restoration history.
