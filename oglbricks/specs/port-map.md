# Port map: OGLBricks 0.2 C++ to public/js/

The original is a Qt 4 / OpenGL 1.1 program in C++. It is not in this repository (see `../PROVENANCE.md`, "The gap in the reference folder"), so the columns below name the original translation units the M0.x audit read, and the extracted data it produced, which `specs/original-shapes.json` and `specs/original-spatial-contract.json` hold.

## Verification level

The collection ranks evidence: an executable oracle first, hand-computed exact values second, documented source-level review third (`../../SOFTWARE_ARCHAEOLOGY.md`). This port has **no executable oracle**, and never had one: nothing here has run the original program.

| Area | Level | Evidence |
|---|---|---|
| The 27 shapes, their cells and all four turn states | 2, exact values from the source, checked mechanically | `original-spatial-contract.json` holds every shape's cells at each quarter turn, derived from `Shape.cpp` with the transform recorded in the file itself. `test/site.test.mjs` compares the whole catalog entry by entry and `test/engine.test.mjs` compares all four rotations |
| Field rules, spawn search, clearing, scoring, speed progression | 3, documented source review | The formulas are transcribed from `GameEngine.cpp`; the line numbers were not preserved by the audit, only the expressions |
| Native gameplay | not run | Eight of twelve oracle scenarios were exercised by the user on Windows and reported back. They are observations, not recordings, and one of them contradicts the source (below) |
| Rendering, animation, timing, audio | not applicable | Declared adaptations. The original is OpenGL; this is Canvas 2D |

## Rules, as the source defines them

| Original behavior | Where it came from | `public/js/engine.js` |
|---|---|---|
| 27 piece types in five categories by block count, [1, 1, 2, 7, 16] types for sizes 1 to 5 | `Shape.cpp` | `SHAPES` in `shapes.js`, `normalizeSettings` keeps the `enabled` categories |
| Two rotation origins per shape, alternating, and no wall-kick search | `Shape.cpp`, `GameObject.cpp` | Precomputed `cells[0..3]`, so a rotation either fits or is refused |
| The next type is drawn from the enabled types **excluding the current one** | `GameEngine.cpp` | `spawn()` builds `available` without `lastType`, then falls back to the full list |
| Spawn searches from the centre column rightwards, then leftwards | `GameEngine.cpp` | `spawn()`, the two loops at lines 39 and 40; failing both is game over |
| Score for a landing that clears rows: `clearedLines² × fieldWidth × speed` | `GameEngine::_endTurn` | `land()`: `this.score += n*n*this.settings.width*this.speed` |
| Speed rises after `width × height × speed` accumulated cleared rows | `GameEngine.cpp` | `land()`, capped at speed 10 |
| Field width and height independently settable from 10 to 50; default 20 x 20, speed 1, automatic fall on, sizes 1 to 4 enabled | the 0.2 settings dialog | `WIDTH_MIN`/`WIDTH_MAX` and `DEFAULT_SETTINGS` |
| Version differences: 0.1 has 26 shapes, 0.1.1 and 0.2 have 27 | the three source archives | The port follows 0.2 |

## Deliberate departures

1. **The random generator.** Qt's `qrand()` becomes xorshift32 (`makeRng`). A seed replays a browser game only. The original's random piece colours are not reproduced; the port colours pieces by type.
2. **`InvalidType`.** With a single category enabled the original C++ can return an invalid piece. The port repeats the one available shape. A safety exception, documented here and in `AUDIT.md`, not original behavior.
3. **Timing.** A landed piece locks after a 300 ms delay and rows clear in the same step. Qt's queued events and the end-of-turn animation are not modeled; the logical outcome is.
4. **Saves.** `.sg` and `settings.bin` are Qt binary formats and are not read or written. The browser keeps its own JSON, `format: "oglbricks-libre-arcade"`, `version: 1`, validated field by field on load, with an invalid file leaving the running game untouched.
5. **Presentation.** Canvas 2D instead of OpenGL, system fonts instead of the original's, no 3D models. English and Italian, touch controls, dialogs and the seven synthesized audio cues are 2026 additions.
6. **Scoring, unresolved.** The formula above is what the C++ says. The one native observation of a two-row clear on a width-10 field at speed 1 reported 10 points, where the formula gives 40. The port follows the formula. Neither number has been reproduced since, and this is the port's one known open parity question.
