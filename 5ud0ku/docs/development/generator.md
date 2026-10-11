# Generator

The JavaScript generator is a source-level port of the recovered 5ud0ku 1.8 `GridCreator` / `CreatorTask` behaviour.

## Historical sequence

1. Randomly fill the three diagonal 3×3 boxes.
2. Complete the grid with the brute-force solver.
3. Choose one of the historical symmetry modes.
4. Remove an initial set of cells.
5. Check uniqueness.
6. Continue removing symmetry groups; after each removal, reject/rollback any change that would permit another solution.
7. For Hard, generate multiple candidate puzzles and choose the historically ranked candidate.
8. Clear transient candidate marks and randomize digit identities before returning the game board.

## Difficulty targets

- Easy: target 40 givens
- Normal: target 33 givens
- Hard: target 23 givens

These are generator targets, not guaranteed final counts. Symmetric removals and uniqueness constraints can leave the final puzzle above or below the nominal target.

## Hard selection

Hard candidate ranking is preserved in this order:

1. greater backtracking depth;
2. then fewer `singles + givens`;
3. then fewer givens.

The browser version performs the work in a Web Worker but does not replace the algorithm.

## Deterministic QA

Historical generation uses separate random streams for puzzle construction and final digit randomization. QA therefore records `creatorSeed` and `digitSeed`. The production UI does not expose these seeds.
