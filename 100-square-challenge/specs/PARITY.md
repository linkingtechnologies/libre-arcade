# 100-Square Challenge — historical oracle vs browser restoration

**Historical target**: the playable TAJJAVA v0.1 Java JAR (March 2011), not the
later incomplete standalone SourceForge snapshot. The raw original-JAR oracle
is preserved in `test/fixtures/oracle_original_jar.txt` (copied from the
archaeological audit), together with mathematical witness paths. Coordinates
are zero-based. The source Java archive and executable in `reference/` were
never modified. The 15 original test observations are documented in that log.

## Invariant historical rules

- 10×10 fixed empty board; the first square is `(0,0)` and places 1.
- Each subsequent move is a chess knight's move to an unoccupied square.
  Invalid, occupied, out-of-grid and non-knight destinations do not place a
  number. The path ends at 100 or when it has no legal continuation.
- Single-step Undo (not an unlimited move history); New game; Main menu
  preserves the board upon return. No RNG, solver, level or timer.

## Intentional user-interface/state corrections

| Scenario | Measured original JAR | Browser restoration |
|---|---|---|
| Before move 1 | Undo enabled but inoperative | Undo disabled until first valid move |
| Undo move 1 | Empty board; proposes `(2,1),(1,2)` (wrong) | Empty board; proposes `(0,0)` (correct) |
| New game after completion/dead end | Board cleared but `ended` flag and Undo-button state can remain stale | Fresh state: blank grid, `ended=false`, Undo disabled |
| Click on ended board | Can silently reset board, discarding score/path | Ignored; board stays visible until Undo or New game |

These departures fix historical defects without introducing a different puzzle.
Do not describe them as features of the Java original. Test assertions for the
adaptation live in `test/parity.test.js`; the original oracle remains unchanged
for independent comparisons.

## Witness paths

`test/fixtures/hamiltonian_witnesses.csv` contains 15 independent 100-cell
paths (one per square-symmetry class); the browser game does not use these as
hints. The `(0,0)` sequence is exercised through the JS rules and the DOM UI.
`test/fixtures/blocked_path.csv` is a valid 24-cell path that runs out of moves;
Undo reopens the path. These fixtures are observations and mathematical
analysis, not algorithms discovered in the Java game.
