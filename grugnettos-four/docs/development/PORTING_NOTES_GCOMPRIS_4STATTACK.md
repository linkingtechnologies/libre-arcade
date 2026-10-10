# GCompris / 4st Attack random-minimax porting notes

## Identity

- GCompris Connect4 implementation: Laurent Lacheny, 2005 and 2008
- AI attribution in source: 4st Attack 2 by Jeroen Vloothuis (`slm`)
- Preserved repository: archived GTK GCompris tree
- Snapshot commit: `09adaa111b827df53fc370a75a3cba7f4dceba3b`
- License on every relevant Python file: GPL-3.0-or-later

The archived commit is later than the activity itself because it is the final repository state. Original headers and attributions are retained unchanged.

## Historical algorithm

The AI expands legal columns left to right without alpha-beta pruning. A root win scores `10000-depth`; a root loss scores `-10000+depth`. Every other horizon leaf receives `int(random()*100)-50`, divided by `depth+1` with Python 2 integer semantics. Internal nodes alternate minimum and maximum. Equal best root moves are selected randomly.

This is not a conventional positional heuristic: its identity is a tactical minimax shell whose horizon evaluation is controlled noise. Increasing depth improves the tactical window while leaving non-terminal comparisons stochastic.

## Reproducibility and parity

`src/players/gcompris-4stattack.js` includes the exact CPython integer seeding procedure, MT19937 state transition and 53-bit `random()` construction. Negative division uses `Math.floor`, matching Python 2 integer division rather than JavaScript truncation.

`tools/gcompris-4stattack-oracle.py` independently evaluates multiple boards at depths 1–4. The test compares every root score, chosen column, tie count and visited-node count. Persistent RNG state is retained across moves within one game and reset between Arena games.

## Adapter boundary

GCompris historically uses the AI as player two. The search itself is player-parameterized, so the common adapter invokes the unchanged logic for either colour. Rendering, timers and original media are outside the AI module and are not redistributed.
