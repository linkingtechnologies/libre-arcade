# XO World — Behavioral Oracle M2

Baseline archive: `javagames-1.0.tgz`  
SHA-256: `259893181e230ce3cb006ea9dcd629cc16ba501d85e1a251ebb547a91056835d`

Coordinates use linear index `row*10+col` (0..99). X=1 human, O=2 CPU, empty=0.
`potez` is the original human-turn counter and is part of the AI state.

## Result

22 deterministic `igraj()` regression cases pass against the unmodified historical game logic.

Coverage includes:

- opening response (upper/lower half);
- immediate CPU win and human-win block;
- horizontal, vertical and diagonal five-window logic;
- early X_X bridge;
- Cross and Box patterns;
- CPU and human open-four;
- CPU and human double closed-four (`check24c`);
- CPU and human closed-four + open-three (`checkc4o3`);
- CPU and human double-open-three (`check2o3c`);
- `checkSerie()` offensive and defensive cases;
- one board that reaches recursion depth 7, confirming the `DUBINA=7` cap is exercised in practice;
- late fallback helpers (`checko4c(...,CLEAN)` and `check5(...,CLEAN)`).

See `qa/XOM2OracleHarness.java` and `results/m2-oracle-run.txt` for exact boards, expected moves and observed recursion depth.

## Deep recursion oracle

O-22 reaches `checkSerie(..., dub=7)` and still returns the historical CPU move 65. This is the strongest M2 parity fixture for preserving the recursive threat search.

## Important state rule

A JS port must preserve at least:

- board state;
- `potez`;
- last human move x/y passed to `igraj()`;
- rule priority order;
- mutation quirks documented in `historical-bugs.md`.

The random fallback is deliberately excluded from deterministic assertions because the original uses `Math.random()` with no exposed seed.
