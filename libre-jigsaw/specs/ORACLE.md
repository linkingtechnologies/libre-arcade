# Libre Jigsaw behavioural oracle

## Player behaviour

1. New puzzles use the selected Classic or Hexagonal cut and 12/24/48/96 requested pieces.
2. Pieces begin scattered and randomly rotated.
3. A click/tap rotates a normal piece or connected group counter-clockwise; right-click rotates clockwise. While dragging, Left/Right arrows rotate the group.
4. Correct logical neighbours snap only when they have equal orientation and both positional corrections are strictly below 5 px.
5. Snapped pieces move and rotate as one physical connected group.
6. Dragging an empty area creates a temporary multi-selection of intersected connected groups.
7. Multi-selection moves groups together without physically joining them; it does not snap on release and cannot be rotated as a selection.
8. Areas 1, 2 and 3 organise pieces. Keys 1/2/3 and the Area selector switch area; a dragged or selected group follows the switch.
9. Only the current area's pieces are visible and interactive.
10. Gallery exposes the ten historical photographs. My image accepts JPG/PNG/GIF/WebP and remains browser-local.
11. Save writes the current state to `.ljf`; Open restores cut, requested piece count, deterministic cut seed, positions, rotations, groups, z order, areas, current area and image.
12. Personal images are embedded in the save and do not require the original local file when reopened.
13. Java-era text `.ljf` files beginning with `version:` are recognized as legacy and are not misread as browser saves.
14. Resizing the window preserves the current state and rescales it rather than starting a new puzzle.
15. When every piece belongs to one connected group, the puzzle is rotated upright, centered and locked until a new/opened puzzle replaces it.
16. English/Italian switching covers player controls, help and status messages.
17. The page has no document-level vertical scroll at normal desktop and narrow mobile sizes.

## Historical parity regressions

- `geometry-smoke.mjs` exercises later square/hex geometry.
- `geometry2010-smoke.mjs` checks 2010 geometry and recorded Java layout parity.
- `snapping-smoke.mjs` covers the 2010 weighted merge and later largest-group anchor rules.
- `layers-selection-smoke.mjs` covers the three-layer and selection model.
- `savegame-smoke.mjs` covers the browser-native save schema, embedded images and legacy-save detection.
- `completion-smoke.mjs` covers upright/center placement planning.
- `file-mode-smoke.mjs` ensures direct-from-disk packaging has no ES-module dependency and local-image failures are visible.
- `production-smoke.mjs` checks the player-facing package and licensed gallery assets.
- `(cd reference && sha256sum -c SHA256SUMS.txt)` verifies the preserved upstream archives.
