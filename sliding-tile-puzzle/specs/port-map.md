# Port map: Virtual Toybox SliderHandler/PuzzleCanvas to src/game.js

## Verification level

The collection ranks evidence: an executable oracle first, hand-computed exact values second, documented source-level review third (`../../SOFTWARE_ARCHAEOLOGY.md`).

| Area | Level | Evidence |
|---|---|---|
| Shuffle algorithm (`mix()`) | 1, executable oracle | `test/PrintSliderMix.java` drives the real `SliderHandler` class from `puzzlegames.jar` via reflection; `test/mix-parity.cjs` checks the port against a stored re-run (`test/fixtures/mix-oracle.json`), 3 sizes x 3 seeds |
| Background color from mean RGB | 1, executable oracle | `test/PrintBackgroundColors.java` calls the real `java.awt.Color.RGBtoHSB()`/`getHSBColor()`; `test/background-parity.cjs` checks the port against a stored re-run (`test/fixtures/background-oracle.json`), all 11 recorded values |
| The 10 photos' mean RGB inputs | 2, exact values read from source | Read directly in the jar's own `pics.xml`, not copied from the delivered test |
| Legal-move rule, completion, square-in-rectangle image geometry, tile bevel | 3, documented source review | Read from `SliderHandler.java` and `PuzzleCanvas.java`; `specs/ARCHAEOLOGY.md` records the reading |

## Module by module

| `src/game.js` | Original | Notes |
|---|---|---|
| `mix()` | `SliderHandler.mix()` | Faithful port, including the always-`(-1)` directional bias from `random.nextInt(1)*2-1` (original lines 143, 150). Verified against the live class via reflection, see above |
| `moveBlankTo()` | `SliderHandler.moveMissingTileTo()` | Slides the blank toward a target cell using only legal moves, picking an axis at random when both are available |
| `slide()`, `isSolved()`, `areAdjacent()` | `SliderHandler`'s click handler and completion check | A click only acts on a tile orthogonally adjacent to the blank; completion is every tile back at its original index |
| `layout()` | `SquareTileManager` (as used by `PuzzleCanvas`) | Square tiles sized to the smaller image dimension; a rectangular photo's puzzle region is centered, leaving non-square strips visible outside it |
| `backgroundFromMean()`, `rgbToHsb()`, `hsbToHex()` | `PuzzleCanvas.setMeanColor()` | Rotate hue 180°, full saturation, brightness `0.5` when the source is very dark or very light, otherwise source brightness `+0.15`. HSB math ported to match `java.awt.Color`'s conversion bit for bit, not CSS `hsl()` |
| `keyboardTarget()` | none; a 2026 addition | The 2010 game is mouse-click only. Arrow keys move the blank one legal cell as an accessibility path; they perform the same `slide()` any click would, never a different move |
| `computeViewport()`, `canvasToLogical()`, `fitImage()` | none; a 2026 addition | Display-only scaling. Resizing the window never regenerates the puzzle or changes its topology, only the on-screen transform |

## Deliberate departures

1. **No timer, score, move counter or hints.** None are part of the recovered 2010 behavior.
2. **Keyboard input**, as above: an alternate path to the same legal moves, not a new rule.
3. **Display scaling**, as above: adaptation, not original behavior.
4. **Size labels.** The 2010 dialog offered "8", "15" and "25" pieces (`tilesAcross = floor(sqrt(preferredSize + 1))`, so a "25" board is actually 5x5 with 24 visible tiles). The restoration labels these unambiguously as 3x3, 4x4 and 5x5; the grids themselves are unchanged.
