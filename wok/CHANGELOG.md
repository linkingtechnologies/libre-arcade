# Changelog

## Unreleased

- Joined the Libre Arcade collection: restructured into the shared
  `public/` → `game/` layout, added `dev`/`build`/`start`/`lint` npm scripts
  and an ESLint config, and `PROVENANCE.md`/`SOFTWARE_ARCHAEOLOGY.md` linking
  back to the collection's own philosophy document. Replaced five unused
  `catch (_) {}` bindings with the equivalent optional-catch-binding form
  (no behavior change) to satisfy lint. No gameplay, parity, or licensing
  content changed.

## 1.0.0 — faithful port

- Ported Wok 1.0 (Kenta Cho, 2001 SDL Game Development Contest,
  BSD-2-Clause-style) to plain browser JavaScript: pan tilt/damping physics,
  ball-ball and ball-wall collision, the six generator types (fire, volcano,
  tree, bucket, cloud, water tap), the continuous `rank` difficulty curve,
  and the combo-multiplier scoring sequence.
- Decoded the two historical beta-Vorbis music tracks to PCM WAV once, with
  no additional lossy encoding stage, so they play in current browsers that
  reject the original setup codebooks. Original `.ogg` files preserved
  unchanged; see `specs/AUDIO_CONVERSION.md`.
- Used the original PNG/WAV/OGG assets directly — no replacement artwork
  needed, since Wok's own BSD-2-Clause-style license covers the whole
  package with no separate media restriction.
- Documented, not ported: SDL/SDL_mixer/libao native audio and windowing,
  and exact SDL 8-bit palette quantization (a future visual-parity task, not
  a gameplay change). See `SOFTWARE_ARCHAEOLOGY.md` and `PROVENANCE.md`.
