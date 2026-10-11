# 5ud0ku — M6 core algorithm port

## Scope

M6 ports only the historical algorithmic core from Java ME to framework-free JavaScript. It deliberately does **not** add a game UI, modern solving strategies, persistence, history, localization, or presentation code.

Ported components:

- `GridSlot`
- `Position`
- `Grid`
- Java-compatible RNG
- abstract solver solution bookkeeping
- `BruteForceSolver`
- mixed `GridSolver`
- `GridCreator`
- historical Hard candidate ranking helper

The implementation is written as ES modules and can run directly under modern Node.js; the modules are browser-compatible core code and do not depend on Node APIs.

## Exact M2 parity

The M2 JSON oracle is consumed directly by `tests/m2-oracle.test.js`.

### Generator

All 3 historical deterministic generator fixtures pass exactly:

- Easy: creator seed 1801 / digit seed 91801
- Normal: creator seed 1802 / digit seed 91802
- Hard: creator seed 1803 / digit seed 91803, including best-of-3 selection

Compared fields include:

- puzzle before digit randomization;
- complete solution before digit randomization;
- puzzle after digit randomization;
- complete solution after digit randomization;
- givens;
- singles;
- backtracking depth;
- solution count;
- Hard attempts/found count.

All 81 puzzle/solution digits match the Java oracle exactly.

### Solver

All 10 M2 fixtures pass with the same rule-check result, solution count and solution ordering:

- very easy;
- easy;
- medium;
- hard17;
- almost complete;
- unique;
- multiple;
- impossible;
- contradictory;
- empty.

The intentionally slow historical `hard17` fixture remains slow in JavaScript because M6 does not replace the row-major brute-force algorithm. On the M6 validation environment it took about 5.6 seconds under Node.js. Wall-clock timing is not a parity assertion.

## 300-puzzle uniqueness regression

`tests/uniqueness-300.test.js` generates 100 deterministic puzzles per requested level and checks them with the separately ported `BruteForceSolver`.

Result: **300/300 unique**.

Sample-specific givens ranges:

| Requested level | Unique | Actual givens range | Average generation attempts |
|---|---:|---:|---:|
| Easy | 100/100 | 35–40 | 2.02 |
| Normal | 100/100 | 30–34 | 2.16 |
| Hard | 100/100 | 24–35 | 1.97 |

These ranges belong to this deterministic sample only. They reinforce the historical behavior that 40/33/23 are targets, not guaranteed final givens counts.

## Fidelity details preserved deliberately

Several implementation details look unusual in JavaScript but are retained because they affect historical behavior:

1. **`java.util.Random` semantics.** The 48-bit LCG is implemented with `BigInt`, and `nextInt()` returns a signed Java-compatible 32-bit value.
2. **Two RNG streams remain separate.** `GridCreator` owns creation randomness; `Grid` owns final digit randomization.
3. **Java `Math.abs(int)` edge semantics** are represented, including `Integer.MIN_VALUE` overflow behavior.
4. **Mutable `Vector.elements()` iteration behavior** in Singles/Hidden Singles is emulated. Removing the current element can cause the shifted successor to be skipped during that enumeration pass; changing this can alter solving paths.
5. **`Grid.clone()` does not copy `backTrackingDepth` or elapsed time**, matching the source rather than “fixing” it.
6. **Duplicate-solution bookkeeping updates backtracking depth** on the already stored solution. This is how the original uniqueness solver ultimately transfers difficulty depth to a generated puzzle.
7. **Brute-force traversal stays row-major, digits 1→9.** No MRV, bitset search, dancing links, or other modern optimization has been substituted.
8. **Symmetry and removal order are unchanged.** Initial 36-cell hiding, rollback after failed uniqueness checks, and the 3 historical symmetry modes are preserved.

## What M6 intentionally does not preserve

Allocation inefficiencies of the original Java implementation are not reproduced when they have no effect on output. For example, Java's `Grid.clone()` created an extra set of temporary `GridSlot` objects. M6 preserves state and decisions, not unnecessary garbage creation.

The 15-second Hard wall-clock timeout is also excluded from deterministic QA. The original best-of-3 comparison is preserved; tests use bounded candidate/attempt counts rather than machine-speed-dependent termination.

## Not yet in scope

M6 is **not** a playable release. Still to port:

- `MoveStack` / undo-redo;
- save/load/autosave and web persistence;
- timer/state controller;
- custom-puzzle workflow orchestration;
- input layer;
- localization;
- rendering and responsive Libre Arcade UI;
- worker boundary for long-running generator/custom solver jobs.

The M5 parity contract remains the acceptance contract for later milestones.
