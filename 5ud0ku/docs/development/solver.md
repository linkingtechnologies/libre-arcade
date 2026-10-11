# Solvers

5ud0ku 1.8 contains two distinct solving paths, both preserved by the restoration.

## GridSolver

Used by the generator/uniqueness logic. Its solving flow combines:

1. candidate calculation;
2. naked singles;
3. hidden singles;
4. recursive guess/backtracking.

For uniqueness checks it can stop when a second solution is demonstrated.

## BruteForceSolver

Used for completion/custom-puzzle solving. It is intentionally simple:

- cells are visited in row-major order;
- candidate digits are tried from 1 through 9;
- recursion/backtracking performs the search;
- solution enumeration stops at two when the caller only needs to distinguish unique vs multiple solutions.

The algorithm can be expensive on difficult inputs. It is therefore executed in a Web Worker in the browser rather than replaced with a modern solver.

## Custom-puzzle outcomes

The restoration preserves the historical distinction between:

- an immediately contradictory board (fails basic Sudoku-rule validation);
- a locally valid but unsolvable board (0 solutions);
- a unique puzzle (1 solution);
- a multiple-solution puzzle (2 found, then stop).
