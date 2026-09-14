# Parity matrix

The target is the documented traditional Game of the Goose ruleset, not parity with one software implementation.

| Behaviour | Selected baseline | `goose-game` | `game-of-the-goose` classic | Grugnetto’s Goose |
|---|---|---|---|---|
| 63 spaces | yes | yes | yes | yes |
| two dice | yes | yes | yes | yes |
| exact finish | yes | yes | yes | yes |
| bounce beyond 63 | yes | yes | yes | yes |
| full Goose series | yes | incomplete | yes | yes |
| Bridge 6 → 12 | yes | yes | yes | yes |
| Inn 19 | variant-dependent | absent | miss 1 turn | miss 2 turns |
| Well 31 | replacement/release baseline | absent | replacement/release | replacement/release |
| Maze 42 | chosen 42 → 39 | absent | 42 → 37 | 42 → 39 |
| Prison 52 | replacement/release baseline | absent | replacement/release | replacement/release |
| Death 58 → Start | yes | absent | yes | yes |
| opening 3+6 / 4+5 | selected baseline | absent | implemented through the opening landing on 9 | yes |
| occupied ordinary space | exchange in selected baseline | implementation differs | not adopted as authority | exchange |
| deterministic replay | project feature | no | no | yes |

## Interpretation

Historical programs are comparison points, not automatic authorities. A difference is recorded rather than silently “corrected”. Grugnetto’s Goose keeps a deliberate ruleset whose disputed choices are documented in `rules.md`.
