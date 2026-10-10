# XO World M3 — Headless JavaScript parity

## Scope
M3 ports only historical model/rules/AI to JavaScript. No Canvas/UI/audio/assets are introduced.

## Gate result
- 22/22 deterministic M2 AI oracle cases: PASS.
- Deep recursive oracle O-22: PASS, depth 7 observed.
- Basic headless game-flow test: PASS.
- Historical `check2o3c()` mutation quirk: intentionally preserved.
- Random fallback is injectable via `randomFn` for QA; default runtime behavior remains `Math.random`.

## Files
- `src/xoworld-engine.js` — direct behavioral port of the Java rules and AI.
- `src/game-model.js` — minimal headless game wrapper mirroring original move flow.
- `qa/oracle.test.js` — JavaScript execution of the 22 M2 fixtures.
- `qa/model.test.js` — legality/win/basic move-flow checks.
- `results/js-oracle-run.txt` — recorded parity run.

## Deliberate non-modernizations
No changes to:
- rule priority;
- board size;
- `potez` semantics;
- recursion cap;
- pattern order;
- random-neighbour fallback;
- historical mutation quirks.

## Next gate
M4 may add a browser-facing renderer/input layer only after retaining this headless engine unchanged or regression-equivalent.
