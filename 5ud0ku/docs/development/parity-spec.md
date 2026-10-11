# 5ud0ku 1.8 — M5 HTML5 Parity Contract

This document is the acceptance contract for a future Libre Arcade port. It distinguishes **must preserve**, **may adapt**, and **must not silently change** behavior.

## P0 — Algorithmic parity (blocking)

### Generator

The port must preserve:

1. 9×9 grid and the original `GridSlot` state semantics.
2. Three diagonal 3×3 blocks filled with random permutations as the initial matrix.
3. Completion of that matrix using the original first-solution brute-force path.
4. One of the original three symmetry modes.
5. Initial removal of 36 cells without per-step uniqueness testing.
6. Uniqueness verification after the initial removal.
7. Further symmetric removal with rollback whenever uniqueness is lost.
8. requested targets: Easy 40, Normal 33, Hard 23 givens;
9. actual final givens may differ because symmetric groups are removed and uniqueness can prevent further removal.
10. Hard candidate comparison order:
    - greater backtracking depth;
    - then lower `singles + givens`;
    - then lower givens.
11. default historical Hard selection of up to 3 successful candidates and 15-second UI timeout.
12. separate digit-randomization pass after candidate selection.

### RNG / deterministic QA

The historical program has two independent `java.util.Random` streams (`GridCreator` and `Grid`). QA must therefore support deterministic `creatorSeed` and `digitSeed` inputs. The production UI need not expose them.

A future single internal Libre Arcade seed may derive the two streams deterministically, but the M2 two-seed oracles remain the canonical historical comparison fixtures.

### Mixed solver / uniqueness checker

Preserve:

- candidate initialization;
- naked singles;
- hidden singles;
- repeated logical propagation until stable;
- first remaining empty position for guessing;
- candidate order 1→9;
- recursive backtracking;
- stop after a second distinct solution;
- historical backtracking-depth semantics.

### Custom-puzzle solver

Preserve the historical `BruteForceSolver` result semantics and solution order for oracle fixtures:

- contradiction can fail pre-check;
- 0 solutions = impossible;
- 1 = unique;
- 2 = multiple/stop;
- row-major traversal;
- digit order 1→9.

Do not replace it invisibly with a modern solver. To protect responsiveness, run it in a Web Worker.

## P0 — Gameplay/state parity (blocking)

Preserve:

- fixed/given vs editable cells;
- shown value vs stored answer;
- pencil mark toggle semantics;
- automatic candidate recomputation in Beginner Mode;
- `Display Digit` as a reveal of the cell answer, not a strategy explanation;
- reveal participates in undo/redo;
- conflict highlighting is based on Sudoku row/column/box conflicts;
- show-solution mode can compare against `answer`;
- redo branch is discarded after a new move following undo;
- save/load preserves board, givens, answers, pencil marks, elapsed time and game type;
- undo history is reset after load;
- autosave on pause/exit equivalent lifecycle points;
- custom puzzle can be unique, multiple, impossible, or immediately contradictory.

## P0 — Behavioral oracle

M2 generated oracle records must pass for Easy/Normal/Hard, including solution count and difficulty metadata.

M2 solver fixtures must retain their expected results.

M3 state tests must remain green.

A JS regression suite should consume `oracles.json` directly.

## P1 — Input parity

Support:

- keyboard digits;
- navigation keys/arrows;
- mouse/touch cell selection;
- pen/pencil mode;
- undo/redo;
- hint/check/save/load/custom puzzle.

Pointer and keyboard paths should converge on the same state-changing functions, as in the original.

## P1 — Rendering parity

Preserve the information hierarchy, not literal 128×128 limitations:

- full 9×9 board visible;
- visual distinction for givens/user values;
- pencil marks readable;
- current focus clear;
- original compact visual character can inform the theme.

The historical 128×128 overlap where digit hitboxes collide with smiley/pencil controls is **documented bug behavior and must not be reproduced**.

## P1 — Persistence

Use `localStorage` (or equivalent client-side storage), but preserve state semantics. Exact RMS binary compatibility is optional unless a later import/export feature is explicitly added.

Recommended: keep a serializer capable of reproducing the historical logical fields, while using a versioned web envelope.

## P1 — Responsiveness/performance

- no vertical scroll during play;
- board entirely visible on desktop/tablet/phone/small monitor;
- generator and custom solver must not block rendering/input;
- use Web Workers for generator/solver execution if synchronous execution can exceed a frame budget;
- keep cancel/abort behavior analogous to `AbortableTask`;
- do not alter algorithmic decisions merely for speed.

## P2 — Allowed adaptations

Allowed when clearly separated from historical mode:

- larger readable typography;
- responsive layout;
- accessible focus indicators;
- improved touch targets;
- modern settings/help/credits navigation;
- optional modern solver/hint mode only if explicitly labeled and not used for historical parity tests.

## Explicitly not preserved as defects

- 128×128 touch hitbox overlaps;
- effective 99-move capacity caused by the 100-slot ring sentinel, if Libre Arcade chooses a true 100-move history (must be documented);
- `stepBack()` returning `null` after applying the last undo internally;
- wall-clock nondeterminism in QA caused by the historical 15-second Hard timeout.

For a strict “historical mode”, these may optionally be emulated; the normal Libre Arcade UI should favor correct usability.

## Port acceptance gates

Before calling the HTML5 restoration beta-ready:

- all M2 generator oracles pass;
- all M2 solver fixtures pass;
- all M3 state tests pass;
- 100 generated puzzles per level have exactly one solution;
- Easy/Normal/Hard selection metrics remain compatible;
- custom hard fixture runs without freezing the UI;
- save/load/autosave round-trip is lossless;
- EN/IT UI complete;
- pointer/keyboard/touch complete;
- no gameplay vertical scroll;
- credits/license provenance complete.
