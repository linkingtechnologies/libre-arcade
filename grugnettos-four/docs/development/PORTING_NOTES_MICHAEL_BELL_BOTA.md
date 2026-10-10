# Michael Bell BotA porting notes

## Historical identity

- Project: `mrbell/connectfour`
- Preserved revision: `cb92ebe7350eb590ad4de783b860cc5e612c1943`
- Revision date: 2012-12-24
- License: GPL-3.0-or-later, stated per source file and in `COPYING`
- Relevant originals: `board.py`, `c4bot.py`, `trainer.py`, `init_db.py`

BotA is not Q-learning. It is a tabular Monte Carlo state-value learner. After each decisive self-play game, every visited afterstate receives the final winner. The stored estimate is the posterior mean `(wins + 1) / (games + 2)`, equivalent to a Beta(1,1) prior. Draws do not update the table.

## Preserved behavior

- 42-cell row-major base-3 board identifier;
- mirrored positions share one record;
- unseen afterstates have probability `0.5`;
- a move maximizes the current player's estimated win probability;
- tied maxima are selected randomly;
- learning updates every recorded afterstate with the terminal winner.

## Explicit adaptation boundary

The historical repository contains no trained `games.db`. A database cannot therefore be presented as an original artifact. `tools/train-bell-bota.mjs` is a dependency-free port of `trainer.py` and produces the bundled snapshot from 10,000 self-play games with seed `20121012`. Counts are stored losslessly in `C4BA1`; probabilities are derived at runtime with the original formula.

The original used NumPy's process-global random generator and did not expose a seed. ConnectLab uses xorshift32 to make both training and Arena ties reproducible. This preserves the policy but not the original random stream.

The unfinished 2017 `tdc4bot.py` is intentionally excluded: it is incomplete, has unresolved TODOs and no trained weights.
