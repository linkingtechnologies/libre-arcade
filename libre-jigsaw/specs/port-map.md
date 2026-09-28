# Port map: Virtual Toybox / Libre Jigsaw Java to src/*.js

Two generations of the original are preserved and both remain implemented, because they are genuinely different code, not a refactor of one another. `specs/ARCHAEOLOGY.md` tells the genealogy; this file maps each module to what it comes from and how strong the evidence is.

## Verification level

The collection ranks evidence: an executable oracle first, hand-computed exact values second, documented source-level review third (`../../SOFTWARE_ARCHAEOLOGY.md`).

| Area | Level | Evidence |
|---|---|---|
| 2010 tile-count/dimension layout, both square and hex | 1, executable oracle | `test/Print2010Layout.java` calls the real `SquareTileManager`, `HexTileManager`, `SquareJigsawManager` and `HexJigsawManager` from `puzzlegames.jar`; `test/geometry2010-smoke.mjs` replays the 32 recorded scenarios and was re-run against a fresh compile during integration, with an exact match |
| Square and hex edge-curve tuning constants, both generations | 2, exact values read from source | The five bubble/variance factors were read directly in both generations' Java files and match the JavaScript constants; see `PROVENANCE.md` |
| The 2011-02-08 snap-policy change | 2, exact text from source | `libre-jig-master.zip`'s own `src/changelog` states the change verbatim; `test/snapping-smoke.mjs` covers both policies |
| Layers, multi-selection, completion presentation, save/load semantics | 3, documented source review | Read from `JigsawHandler.java` and `gui.xml`; `specs/LAYERS_MULTISELECT_2010.md` and `specs/RESOLUTION_INDEPENDENCE.md` (in `test/`) record the reading |

No native session of either generation was ever run interactively; the Java oracle above executes the original's own layout math directly, without a GUI.

## Module by module

| Module | Original | Generation | Notes |
|---|---|---|---|
| `geometry2010.js` | `SquareJigsawManager.buildEdge()`, `HexJigsawManager` | 2010, `puzzlegames.jar` | The square cutter is a genuinely different algorithm from the later one, not a variance-tuning difference alone; the hex cutter already used the edge construction later generalized into `JigsawCutter`, so it is treated as historically equivalent and the module reuses `geometry2012.js`'s hex implementation |
| `geometry2012.js` | `JigsawCutter`, `SquareJigsawManager`, `HexJigsawManager` | later Libre Jigsaw, `libre-jig-master.zip` | The production player's default geometry. `makeRng` is a restoration aid (seeded PRNG for reproducible tests), not a port of `java.util.Random` |
| `snapping.js` | `JigsawHandler.mouseReleased()` | both, selectable | `planSnap2010` implements the weighted integer-average recentering the 2010 code performs; `planSnap2012` implements the largest-on-board-group anchor introduced 2011-02-08. Both share the same neighbor gate: `SNAP_THRESHOLD=5`, strict `-5 < correction < 5`, equal rotation required |
| `layers.js` | `JigsawHandler.setLayer()`, `gui.xml`'s `1`/`2`/`3` accelerators | both, unchanged between them | Three layers, `LAYER_COUNT=3`; a picked-up group or active multi-selection moves with a layer switch, unselected groups stay put |
| `savegame.js` | `.ljf` writer/reader in the Java `PuzzleLoader`/`GUI` classes | conceptually both; format itself is new | `SAVE_FORMAT='libre-jigsaw-html5'`, `SAVE_VERSION=2`. Preserves the user-level state (cut, piece count, seed, positions, rotations, groups, z-order, areas, image) in a self-contained JSON; does not read or write the historical binary/text format. A v1 (Beta 2) save is still read; a Java-era file beginning `version:` is detected and rejected with a clear message rather than misparsed |
| `completion.js` | `finishGame()` | later Libre Jigsaw | Rotates the single remaining connected group upright and centers it; interaction stops. The 2010 generation's equivalent was not separately preserved because the later behavior is what `specs/ARCHAEOLOGY.md` designates as canonical |
| `viewport.js` | no direct original; a 2026 addition | — | The original had no independent concept of a logical playfield versus a display viewport. Freezing the playfield at creation and only ever applying a uniform scale/letterbox transform on resize is documented as an adaptation in `specs/RESOLUTION_INDEPENDENCE.md`, not attributed to the Java code |
| `i18n.js` | — | — | English and Italian strings, new work |
| `app.js` | `JigsawHandler`, `GUI`, `PuzzleCanvas` (event wiring only) | both, as adapted | DOM event handling, canvas rendering, menu wiring. The rules it calls into (geometry, snapping, layers, save, completion) are the ported modules above; the wiring itself is new |

## Deliberate departures

1. **Random numbers.** `java.util.Random`, unseeded in the original, is not reproduced. `makeRng` in `geometry2012.js` is seeded so the JavaScript tests can be exact, which is a testing aid, not a claim about the original's number sequence.
2. **Save format.** Deliberately not `.ljf`-compatible with the Java binary/text encoding. A legacy file is detected (`version:` prefix) and rejected with a message rather than guessed at.
3. **Resolution independence.** The frozen logical playfield and uniform viewport transform (`viewport.js`) are a 2026 addition with no original counterpart; the original ran in a fixed-size Swing window.
4. **Interface.** Touch-equivalent area selector, English/Italian strings, and the classic-script bundle for `file://` support are all adaptations, not original behavior.
