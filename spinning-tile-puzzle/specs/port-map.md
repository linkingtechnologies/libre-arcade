# Port map: Virtual Toybox SpinnerHandler/HexSpinnerManager to src/game.js

## Verification level

The collection ranks evidence: an executable oracle first, hand-computed exact values second, documented source-level review third (`../../SOFTWARE_ARCHAEOLOGY.md`).

| Area | Level | Evidence |
|---|---|---|
| Board geometry (tile/vertex positions, spacing, offsets) | 1, executable oracle | `test/PrintSpinnerOracle.java` (mode `geom`) constructs the real `HexSpinnerManager`; `test/spinner-parity.cjs` checks the port against a stored re-run (`test/fixtures/geometry-oracle.json`), 4 board sizes |
| Shuffle algorithm (`mix()`) | 1, executable oracle | `PrintSpinnerOracle.java` (mode `mix`) drives the real `SpinnerHandler` via reflection; checked against `test/fixtures/mix-oracle.json`, 3 seeds |
| Spin mechanics (`spin()`) | 1, executable oracle | `PrintSpinnerOracle.java` (mode `spin`) calls the real public `HexSpinnerManager.spin()`; checked against `test/fixtures/spin-oracle.json`, all 6 vertices x 2 directions |
| Background color from mean RGB | 3, documented source review, shared with the sibling games | Same `PuzzleCanvas.setMeanColor()` formula as Libre Jigsaw and Sliding Tile Puzzle, already executable-oracle-verified in those two; not re-verified here since the formula and the photos are identical |
| Nearest-vertex hit testing, tile expansion/compaction indexing | 3, documented source review | Read from `HexSpinnerManager`'s internal 6x3 super-grid indexing and `SpinnerHandler`'s click handling |

## Module by module

| `src/game.js` | Original | Notes |
|---|---|---|
| `layout()` | `HexSpinnerManager`'s constructor sizing math | Hard-coded to a 5x3 super-grid fitted to the board; tile width/height derived from the board and clamped to a multiple of 2 (width) or 4 (height); `scaleFactor` corrects Canvas's square pixels for the historical hex aspect ratio |
| `superExpandedIndex()`, `expandedIndex()`, `superFlatIndex()`, `flatIndex()` | `HexTileManager`'s internal 6-column/3-row indexing, as reused by `HexSpinnerManager` | Converts between the 7 real tile positions and the 9-cell super-grid the original code computes internally (2 cells are always empty). This indexing has no independent behavior to observe from outside; it is verified indirectly, by every tile and vertex position the geometry oracle checks coming out correct |
| `tilePosition()`, `vertexPosition()` | `HexSpinnerManager.getTilePosition()`, `getVertexPosition()` | Checked directly against the oracle, all 7 tiles and 6 vertices, 4 board sizes |
| `getNearestVertex()` | `SpinnerHandler`'s click-to-vertex hit test | Not independently oracle-checked (the original method is `private` and not reachable without reflection this port didn't attempt for it); `test/game-smoke.cjs` checks that every vertex position round-trips back to its own index |
| `spin()` | `HexSpinnerManager.spin()` | A public method, called directly by the oracle with no reflection needed. Orbits the 3 tiles around a vertex and adds 2 of the 6 sixty-degree rotation steps to each, in the direction given. Checked against the oracle for every vertex and direction |
| `mix()` | `SpinnerHandler.mix()` | Five passes; each pass shuffles the 7 tile indices (0 through 6) and spins each one. Index 6 is not a valid vertex and is a documented no-op in the original, reproduced here by `spin()`'s own bounds check rather than filtered out before calling it |
| `createSolvedState()`, `isSolved()` | `HexSpinnerManager`'s solved-state fields, `SpinnerHandler.checkSolved()` | Solved requires every tile's original index and rotation count both back to their starting values |
| `backgroundFromMean()`, `rgbToHsb()`, `hsbToHex()` | `PuzzleCanvas.setMeanColor()` | Identical to the sibling games' implementation; not re-verified against Java here since it was already verified there with the same 10 photographs |
| `fitImage()`, `computeViewport()`, `canvasToLogical()` | none; a 2026 addition | Display-only scaling, matching the sibling games' pattern |

## Deliberate departures

1. **No timer, score, move counter, hints or save/load.** None are part of the recovered 2010 behavior.
2. **Keyboard input (keys 1-6, Enter/Space to reshuffle after completion)** and **the `Puzzle -> Direction` menu (a Shift-key-free way to choose counter-clockwise)**: both are alternate paths to the same `spin()` the original already exposes, not new rules.
3. **Display scaling**: adaptation, not original behavior.
