# Changelog

## Unreleased

- Joined the Libre Arcade collection: restructured into the shared
  `public/` → `game/` layout, added `dev`/`build`/`start`/`lint` npm scripts
  and an ESLint config, and `PROVENANCE.md`/`SOFTWARE_ARCHAEOLOGY.md` linking
  back to the collection's own philosophy document. No gameplay, parity, or
  licensing content changed.

## 1.1.0 — production pass

- Localized WebGL-unavailable fallback screen and context-loss recovery
  path.
- Automatic human-match pause on page hide; held inputs cleared on focus
  loss.
- Persistent user options and language; Italian/English UI and full How to
  Play screen.
- Favicon and static-site metadata.

## 1.0.0 — faithful port

- Ported PSY PONG 3D 0.9 (Quetzy Garcia, 2009, GPL-3.0-or-later) to WebGL:
  renderer-independent deterministic gameplay core, original score limit,
  odd-second level-increase quirk, always-diagonal ball motion, paddle warp
  and random side-swap, and the level-scaled CPU probability model.
- Established the asset boundary: the three historical BMP textures
  (`menu.bmp`, `background.bmp`, `spiral.bmp`) are excluded for unclear
  media provenance (see `reference/audit/LEGAL_AUDIT.md`) and replaced with
  newly created artwork documented in `public/assets/ASSET_PROVENANCE.md`.
- Documented, not ported: GLUT/OpenGL windowing and input, and exact
  historical frame-rate-dependent pacing (platform-dependent). See
  `SOFTWARE_ARCHAEOLOGY.md` and `PROVENANCE.md`.
