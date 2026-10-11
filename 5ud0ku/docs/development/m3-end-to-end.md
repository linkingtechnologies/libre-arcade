# 5ud0ku 1.8 — M3 End-to-End Behavioral Audit

## Scope

M3 deliberately does **not** start the HTML5 port. It validates the application-level behavior that surrounds the generator/solver certified in M2: pencil marks, Display Digit (hint), undo/redo, local conflict checking, custom puzzles, save/load/autosave, quick save, and pointer input.

Two evidence levels are kept separate:

1. **M3A — executable core oracle**: original 1.8 model/history/persistence/solver classes compiled unchanged, with a minimal in-memory implementation of the Java ME RMS API only where the host JDK lacks it.
2. **M3B — real MIDlet emulator smoke test**: launch the historical 63,862-byte JAR under an actual Java ME emulator and exercise rendering/input/RMS lifecycle. This remains open in the current environment because no Java ME emulator binary is installed and external binary download is unavailable here. No headless shim is being presented as an emulator substitute.

## Inputs

- `5ud0ku.src.zip` — recovered source distribution, SHA-256 `41c57fb55c323530d09c1a0cf039e5e2ca39e675fa6a7f5de176beb742c42ddf`
- `5ud0ku.jar` — historical 1.8 binary, 63,862 bytes, SHA-256 `b7189ced0699cfe278b1d9d94b4675a29b85951f527f69329a10225bfad0d414`
- `5ud0ku.jad` — declares version 1.8, CLDC 1.0, MIDP 1.0

## M3A executable oracle

Result: **36 PASS / 0 FAIL**.

The executable oracle uses original `Grid`, `GridSlot`, `MoveStack`, `GridStore`, `BruteForceSolver`, `Solver`, `Position`, and `AbortableTask` source without changing their logic. A minimal `javax.microedition.rms.RecordStore` test double supplies only the storage API missing from a desktop JDK.

### Pencil marks

Verified:

- automatic candidate calculation;
- manual mark add/remove;
- Beginner Mode semantics: recalculating candidates after a definitive digit removes that digit from peers;
- pencil marks survive grid serialization and save/load.

The original implementation keeps the nine pencil marks in an integer bit mask, so this remains a useful parity target for the JavaScript model even though JavaScript does not share the same memory constraints.

### Display Digit / hint

`SudokuUI.solveSlot()` first records the move and only then calls `grid.promote()`. The executable oracle reproduces this ordering:

- Display Digit promotes the stored answer into the shown digit;
- the hint is undoable;
- the hint is redoable.

The historical hint is therefore a **reveal-cell operation**, not a modern strategy-explanation engine.

### Undo / redo

Verified:

- pen move undo/redo;
- pencil-toggle undo/redo;
- making a new move after undo destroys the redo branch;
- loading or installing a new grid resets the move history (source oracle).

#### Historical ring-buffer quirk

`MoveStack` declares `MAX_NUMBER_OF_STORED_MOVES = 100`, but `startPos == endPos` is also used as the empty/sentinel state. After inserting 100 moves, only **99 are externally undoable**. This is reproducible with the original class and should be documented as historical behavior. A faithful port may preserve 99 effective moves; a user-facing modernization to a true 100 should be explicit, not accidental.

Another internal quirk is that `stepBack()` can apply the final available undo and return `null`; the UI compensates by reading `getNextUndoPosition()` before stepping back. This should not be copied blindly into a new API, but the visible behavior must remain the same.

### Error checking

Verified against `Grid.getConflictPositions()`:

- a duplicate in a row is detected;
- clearing a cell yields no conflict.

This confirms the normal in-game check is based on Sudoku constraints, not simply on comparison with the precomputed answer.

### Custom puzzles

Verified with the original `BruteForceSolver`:

| Case | Basic rule precheck | Solutions returned |
|---|---:|---:|
| Known unique puzzle | pass | 1 |
| Empty board | pass | 2 (early stop) |
| Locally valid but impossible puzzle | pass | 0 |
| Immediate contradiction | fail | solver not required |

This distinction must survive the port: **contradictory** and **unsatisfiable** are not the same state.

### Save/load and AUTO_SAVE

With the original serialization and `GridStore` logic, using an RMS-compatible in-memory store:

- manual save/load round-trips byte-for-byte;
- elapsed time persists;
- game type persists;
- pencil marks persist;
- AUTO_SAVE round-trips byte-for-byte;
- nonexistent saves return `null`;
- the reserved RMS names `SETTINGS` and `PREF_LANG` are rejected by `saveGrid()`;
- the representative serialized grid is only **288 bytes**.

The move stack is not part of `Grid.toByteArray()`, and `SudokuStateControl.gameLoaded()` explicitly resets it. Undo/redo history therefore does **not** survive loading.

### Lifecycle autosave / quick save

Static source oracle result: **14 PASS / 0 FAIL**.

Source confirms:

- on first startup, `AUTO_SAVE` is loaded before a new game is generated;
- `pauseApp()` stops the timer and autosaves;
- `destroyApp()` stops the timer and autosaves;
- autosave is intentionally skipped while the user is entering/editing a puzzle;
- the configured quick-save key calls `autoSaveGrid()` directly;
- settings are saved by the broader `autoSave()` path.

### Keypad behavior

Source confirms:

- numeric 1–9 enter digits when digits are not being used as navigation;
- numeric 0 toggles pen/pencil mode outside custom-puzzle entry;
- `#` toggles move/input mode;
- `*` controls the status popup in valid states.

### Pointer/touch behavior

Pointer support is native in the original UI, not an emulator patch.

The 1.8 source implements this interaction model:

1. tap a number in the digit sidebar to select 1–9;
2. tap a board cell; the selected digit is immediately passed to the same `numberPressed()` path used by keypad input;
3. tap the pen/pencil symbol to toggle mode;
4. in undo mode, left half of the screen = undo, right half = redo;
5. tap the smiley/status target for status display where allowed.

This is a valuable historical touch UI and should be reproduced semantically before redesigning the controls.

## Historical build environment recovered from the source package

`building.txt` provides unusually strong provenance for rebuilding the original:

- Eclipse 3.1 + EclipseME during development;
- Antenna 0.9.13 for external builds;
- Sun Wireless Toolkit 2.2;
- CLDC 1.0;
- external compilation using MIDP 2.0 APIs while the JAD/manifest still declare MIDP 1.0, with runtime capability detection;
- ProGuard 3.4;
- Nokia API JAR for Nokia-specific full-screen/device-control wrappers.

The historical build log reports 28 source files, 44 program classes before shrinking, 43 after ProGuard shrinking, and a successful build in 9 seconds on the original development environment.

This explains an apparent contradiction in the artifact: the distributed JAD advertises MIDP 1.0 compatibility, while the build system deliberately compiles against MIDP 2.0 and falls back at runtime.

## M3B — real emulator smoke test status

**OPEN, not faked.**

The original JAR has not yet been launched in a real Java ME runtime in the present execution environment. The next smoke test should use one of:

- MicroEmulator 2.0.4;
- FreeJ2ME / FreeJ2ME-Plus;
- Sun Java Wireless Toolkit 2.2 in an isolated historical environment.

Minimum smoke matrix:

1. boot with no RMS data;
2. generate Easy / Normal / Hard;
3. keypad digit input;
4. pointer digit selection + board tap;
5. pencil mode and Beginner Mode;
6. Display Digit, undo, redo;
7. quick save;
8. pause/exit, restart and restore AUTO_SAVE;
9. manual save/load and verify history reset;
10. custom unique / multiple / impossible / contradictory puzzle;
11. run at 128×128 and a larger 240×320-style canvas;
12. capture screenshots and timings.

Until this real-emulator pass is complete, the original audit gate item **“build/emulation original” remains open** and the HTML5 port should remain blocked.

## M3 verdict

- **M3A application behavior:** PASS
- **M3 source/lifecycle oracle:** PASS
- **M3B real Java ME emulator execution:** OPEN
- **Port gate:** still CLOSED solely because the real-emulator smoke test is not yet certified.

The M3 evidence strengthens the restoration case: 5ud0ku is not only an interesting generator/solver. It also contains a compact, coherent mobile application model with reversible hints, bit-packed pencil state, sub-300-byte typical saves, autosave lifecycle, and a genuine pre-smartphone pointer UI.
