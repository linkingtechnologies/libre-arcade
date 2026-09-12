# Changelog

## Unreleased

- Joined the Libre Arcade collection: restructured into the shared
  `public/` → `game/` layout, added `dev`/`build`/`start`/`lint`/`check`
  npm scripts, an ESLint config, and `PROVENANCE.md`/`SOFTWARE_ARCHAEOLOGY.md`
  linking back to the collection's own philosophy document. No gameplay,
  parity, or licensing content changed.

## 1.1.0

- Added the bilingual English/Italian browser shell (Options → Language,
  locale auto-detection, persisted choice) without changing game rules.

## 1.0.0

- Ported the 1.0.1 post-compo release of **For Science!** (Juan J. Martínez,
  PyWeek 16, 2013, GPL-3.0-or-later) to HTML5 Canvas 2D and Web Audio: the
  10×10 match-3 board, turn economy, scoring quirks, and the original AI's
  move/attack heuristics. Parity baseline 0.3 — source-anchored visual/input
  parity, Python 2.7 deterministic oracles across multiple seeds, and
  byte-identical verification of every copied original asset.
- Added browser robustness, loading and error handling, an in-game How to
  Play screen, safer preference persistence, fullscreen synchronization, and
  production page metadata.
- Documented, not ported: Cocos2d/Pyglet's native window management and OS
  audio drivers, replaced by their browser equivalents with no gameplay
  effect. See `SOFTWARE_ARCHAEOLOGY.md` and `PROVENANCE.md`.
