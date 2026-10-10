# ConnectLab Control Baseline

## Role

M23 is an original GPLv3 experimental control, not a recovered historical intelligence. It closes the collection at **22 principal intelligences plus one control player**. The `[CONTROL]` prefix is shown in both human-play and Arena selectors.

## Profiles

1. **Random** chooses uniformly from legal columns using the Arena RNG.
2. **Tactical 1-ply** takes an immediate win, otherwise blocks an immediate loss, otherwise chooses randomly.
3. **Negamax depth 4** searches four plies with alpha-beta, stable center-first ordering and a deliberately simple evaluation over the canonical 69 winning groups. Open groups receive weights 1, 8 and 80 for one, two and three stones.

All three profiles use the same common player contract. They contain no historical database, learned weights, opening book or project-specific special case.

## Interpretation

The control is meant to calibrate Arena results. A historical adapter can rank below it because of a small browser budget, stochastic policy, absent upstream data, a deliberately human-like design or poor generalization—not because its original research family is intrinsically inferior.

With seed `20261003`, head-to-head paired totals against the same 22 principal players were:

| Profile | Wins | Draws | Losses | Points |
|---|---:|---:|---:|---:|
| Random | 1 | 0 | 43 | 1 |
| Tactical 1-ply | 9 | 0 | 35 | 9 |
| Negamax depth 4 | 32 | 2 | 10 | 33 |

This monotonic ladder is the intended sanity check. Negamax's fourth-place tournament result is a benchmark observation, not a promotion into the historical collection.
