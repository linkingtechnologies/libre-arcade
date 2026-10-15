# M28 — NES visual fidelity pass

Version: **1.0.0-rc.5**  
Date: **2026-10-12**

## Verdict

**GAMEPLAY / DETERMINISTIC CORE: GREEN — UNCHANGED**  
**AUDIO ENGINE: GREEN — UNCHANGED**  
**CLEAN-ROOM VISUAL BOUNDARY: GREEN**  
**NES VISUAL-GRAMMAR PASS: GREEN / MANUAL SMOKE REQUIRED**

M28 addresses the remaining presentation gap identified after M27. It does not attempt to recreate
historical sprite/tile bytes. Instead, it moves the procedural renderer toward the broad visual
language visible in the original NES release while preserving the strict media boundary.

## Changes

- playfield changed from dark modern grid to sparse black NES-style field;
- HUD changed to cyan/white high-contrast bitmap treatment;
- platforms use a new cyan/magenta/white striped procedural tile;
- ladders use hard pixel rails/rungs with no subpixel strokes;
- filing cabinets are now recognizable two-drawer green cabinets with four procedural topic glyphs;
- phones use a compact handset/body silhouette, pixel ring rays and white urgent state;
- protagonist palette/silhouette moved to orange hair + red skirt suit while remaining newly authored;
- Ghost and all NPCs converted to block-built pixel treatments; `G`/`M`/`D` debug-like letters removed;
- canvas chrome reduced to a 2px radius so the 256×240 field reads more like an original game screen.

## Regression

- Full M8→M28 suite: **305/305 PASS**.
- New M28 visual-fidelity tests: **12/12 PASS**.
- Gameplay `src/player.js` and `src/simulation.js`: byte-identical to M27.
- Procedural `web/audio.js`: byte-identical to M27/M26.
- No raster images, ROM, CHR or sampled audio added.

## Release position

This is **1.0.0-rc.5**, not final 1.0.0. The final remaining gate is a real-browser visual/audible
smoke on representative desktop/mobile sizes. In particular, verify the new striped platforms,
ladder readability, cabinet icons, phone urgent state and heroine readability at actual CSS scaling.
