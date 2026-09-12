# Changelog

## Unreleased

- Joined the Libre Arcade collection: restructured into the shared
  `public/` → `game/` layout, added `dev`/`build`/`start`/`lint` npm scripts
  and an ESLint config, and `PROVENANCE.md`/`SOFTWARE_ARCHAEOLOGY.md` linking
  back to the collection's own philosophy document. Independently
  re-verified the archive's SHA-256 and read `COPYING.TXT` directly rather
  than relying on the existing audit's summary alone. Fixed 7 pre-existing
  unused-variable lint findings in `public/src/app.js` (an unwired status
  element, six unused `catch (_)` bindings replaced with optional catch
  binding — no behavior change). No gameplay or parity content changed.

## 1.0.2 — production-ready preservation build

- Ported Terramancers (Shai Shapira, Liberated Pixel Cup 2012,
  GPL-3.0-or-later code / CC-BY-SA-3.0+GPL-3.0-or-later dual-licensed
  artwork) to Canvas 2D: 32×32 tile grid, six terrain families, Reversi-style
  horizontal/vertical capture, original Easy/Medium/Hard tree counts and
  obstacle ratios, the flat 0.8 px/tick movement constant (the source's own
  dynamic speed formula is commented out and unused), un-normalized diagonal
  movement, point-only collision, and the original single-player
  tie-counts-as-loss comparison.
- Simulation timing preserved at nominal 180 ticks/s (60 FPS × 3 ticks/frame)
  with walking animation on an independent 60 Hz historical repaint clock.
- Launched the preserved `Terramancers.jar` directly and captured its
  800×600 menu for comparison; documented the intentional arena clipping at
  that resolution. See `reference/audit/EXECUTABLE_PARITY.md`.
- Documented, not ported: Java AWT/Swing rendering and windowing; the unused
  Vakho Arena combat/tavern/league code sharing this codebase's repository;
  the legacy `Map.map` binary format the completed game no longer loads. See
  `SOFTWARE_ARCHAEOLOGY.md` and `PROVENANCE.md`.
