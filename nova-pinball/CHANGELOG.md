# Changelog

## Unreleased

- Restructured the game into this collection's standard `public/` → `game/` layout: `index.html`, `src/`, `assets/` and `data/` now live under `public/`.
- Added the standard `package.json` scripts (`dev`, `build`, `start`, `test`, `lint`, `check`), `scripts/serve.mjs`, `scripts/build.mjs` and `eslint.config.mjs` shared by every game in the collection.
- Added the GoatCounter analytics snippet used by every other game.
- Removed `serve.bat`/`serve.sh` in favor of `npm run dev`, matching the rest of the collection.
- Removed a dead `stars`/`makeStars` starfield array in `src/app.js` that was computed but never read (caught by the shared ESLint config); no visual or gameplay change.
- Updated `tests/` to read from the new `public/` paths and narrowed the release-audit test's external-URL scan to exempt the GoatCounter domains and to skip dev-only files (`node_modules/`, `package-lock.json`) it was never meant to police.
- Fixed the About/Info screen overflowing at short window heights: it showed an unwanted scrollbar and clipped longer mission-hint text (e.g. "Follow the display and table lights") off the right edge instead of wrapping it. `.about-stage`'s fixed `min-height:300px` and the heading/detail text's `white-space:nowrap` are now responsive (`clamp()`-based sizing, wrapping enabled), matching the scroll-free treatment the Menu and Pause screens already had.
- No gameplay, physics, mission, audio or scoring changes.

## 1.0.1 — 2026-09-14

- Fixed the procedural dot-matrix HUD font missing the comma glyph used by thousands-formatted scores such as `15,000`.
- Added a regression test covering score punctuation in the dot-matrix renderer.
- No gameplay, physics, mission, audio, UI-layout or asset changes.

## 1.0.0 — 2026-09-14

- Promoted the restoration baseline to production-ready 1.0.0.
- Centered the quick-control footer row; keyboard instructions remain on a separate row below.
- Removed normal desktop/fullscreen vertical scrolling from the main and pause menus and added short-viewport compaction.
- Added final GitHub Pages packaging guidance, upstream history and a preservation matrix.
- Added a complete upstream credit record (Wesley Werner, Eric Ahnell and every third-party credit named by upstream) plus the engine lineage and Software Heritage preservation reference.
- Expanded the public archaeology manifest while continuing to exclude original archives/media with unclear redistribution terms.
- Gameplay, physics constants, mission sequencing, scoring and audio assets are unchanged from RC9.

## 1.0.0-rc9 — 2026-09-14

- Reorganized the bottom bar into two rows: quick controls first, keyboard instructions underneath.
- Fullscreen controls no longer share horizontal space with help text.
- Narrow/mobile help may wrap independently without moving the control buttons.
- No gameplay, physics, mission, audio or scoring changes.

## 1.0.0-rc8 — 2026-09-14

- Added direct background-music selection to the bottom control bar.
- The music button cycles through None, Dreamy Orbit, Arcade Pulse, Wormhole Drive and Playlist and persists the choice.
- Kept music volume in Settings.
- Hardened fullscreen footer layout so the new music control cannot push buttons onto a second row; help text yields first on narrower screens.
- Gameplay, physics, missions and audio assets are unchanged from RC7.

## 1.0.0-rc7

- Simplified all player-facing menus and descriptions.
- Removed development, licensing, archaeology, clean-room and asset-policy language from the in-game UI.
- Reworked the About screen around gameplay, controls and credits.
- Browser title is now simply `Nova Pinball`.
- Technical provenance and licensing information remains available in README/NOTICE/docs only.

## 1.0.0-rc6 — 2026-09-14

- Re-audited all 19 historical WAV files and their source triggers; 18 are used by v0.2.3 and `powerup-2.wav` is present but unreferenced.
- Expanded clean-room Web Audio synthesis to mirror the historical sound roles, including wall, word bonus, Black Hole lock/release, Hydrogen/Fusion, Timewarp, looping Wormhole, Wormhole close, Supergravity and drain.
- Replaced the system-font HUD/LED rendering with a new procedural 5×7 dot-matrix renderer; no historical TTF is bundled.
- Added three optional modern CC0 background tracks plus `None`/`Playlist` choices and separate persistent music volume.
- Added `docs/AUDIO_PARITY.md`, `docs/MODERN_MUSIC.md` and per-track source/license/hash records.
- Historical Beyond tracker music remains quarantined and is not redistributed.
- Gameplay, table geometry, physics constants and mission sequencing remain frozen from RC5.

## 1.0.0-rc5 — 2026-09-14

- Re-audited the v0.2.3 Lua presentation source and historical artwork for UI fidelity.
- Restored historical-style main-menu hierarchy, keyboard navigation and procedural ball cursor.
- Restored pre-launch table preview pan, in-canvas Score/Balls HUD and 36 px green LED message queue.
- Restored Mission Hints modes: LED / Lights / Both / None.
- Reworked the playfield renderer toward the original palette and component appearance without copying historical pixels.
- Restored teal pause presentation, animated About lines and scrolling Game Over transition.
- Documented original asset proportions/palette and optional future CC0 modern-music candidates.
- Kept gameplay, physics, scoring, mission sequencing and historical-media quarantine unchanged.

## 1.0.0-rc4 — 2026-09-14

- Fixed fullscreen footer wrapping on desktop.
- Made Web Audio startup robust: effects are queued until the AudioContext is actually running.
- Added recovery for suspended/interrupted audio contexts.
- Raised the clean procedural SFX master level from 0.24 to 0.48 for normal laptop speakers.
- Kept gameplay, physics, missions and clean-asset policy unchanged.

## 1.0.0-rc3

Release-hardening candidate. No gameplay or physics constants changed.

- added fail-safe browser storage with in-memory fallback;
- active games now pause and release held flippers on browser focus loss or when the page becomes hidden;
- added release metadata and a self-contained favicon;
- expanded automated hardening and storage regression tests;
- refreshed release documentation and distribution audit.

## 1.0.0-rc2

- formalized the conservative public-distribution policy for historical media;
- original tracker music and original release archives remain documented but are not redistributed;
- strengthened the distribution audit against quarantined media and archives.

## 1.0.0-rc1

- froze gameplay from prototype 0.7;
- added explicit GPL-3.0-or-later metadata, provenance notice and release audit;
- corrected settings back-navigation between menu and pause.

## 0.7

- presentation polish, mission feedback, procedural effects, fullscreen and responsive touch refinements.

## 0.6

- menu/pause layer, persistent high scores, settings and synthesized Web Audio effects.

## 0.5

- true multiball and Matter Jettison branch.

## 0.4

- completed the main historical mission cycle through Black Hole, Wormhole and Supergravity.

## 0.3

- original scoring and first mission chain restored.

## 0.2

- historical Ball camera behavior restored.

## 0.1

- first playable clean-room browser vertical slice.
