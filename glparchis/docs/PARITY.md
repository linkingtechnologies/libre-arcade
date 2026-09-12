# Parity matrix

Reference implementation: **glParchis 20181125** under `reference/glparchis-20181125/`.

| Behaviour | JS status | Automated test | Parity status |
|---|---|---:|---|
| 4 pawns/player | Implemented | indirect | Source-confirmed |
| start-player highest-die contest | Implemented | yes | Source-confirmed |
| ties reroll only tied leaders | Implemented | yes | Source-confirmed |
| leave home with 5 | Implemented | yes | Source-confirmed |
| compulsory exit with 5 | Implemented | yes/indirect | Source-confirmed |
| 6 → 7 when all pawns are out | Implemented | yes | Source-confirmed |
| extra throw after 6 | Implemented | simulation | Source-confirmed |
| two own pawns form barrier | Implemented | yes | Source-confirmed |
| 6 forces own barrier opening | Implemented | yes | Source-confirmed |
| barrier blocks passage | Implemented | yes | Source-confirmed |
| ordinary safe square blocks capture | Implemented | yes | Source-confirmed |
| special start-square capture on exit | Implemented | regression path | Source-confirmed |
| capture bonus +20 | Implemented | yes | Source-confirmed |
| goal bonus +10 | Implemented | yes | Source-confirmed |
| exact finish / no bounce | Implemented | yes | Source-confirmed |
| three 6s penalty | Implemented | yes | Source-confirmed |
| final-ramp exemption from three 6s | Implemented | yes | Source-confirmed |
| victory = all four at goal | Implemented | simulations | Source-confirmed |
| 3/4/6/8 route topology | Ported from GPLv3 data | yes | Source-confirmed |
| AI priority ordering | Implemented | yes | Source-confirmed |
| AI normal-threat current-player bug | Preserved | yes | **Bug-for-bug source parity** |
| AI foreign-start special threat | Preserved | yes | **Bug-for-bug source parity** |
| all-CPU full game completion | Implemented | yes, 3/4/6/8 | Core validation |
| deterministic/scripted test RNG | Implemented | yes | Intentional testability adaptation |
| original WAV effects | Not reused | n/a | Replaced by clean-room Web Audio cues |
| network statistics/update calls | Not ported | static audit | Intentional privacy/static-hosting omission |

The suite is deterministic. `SeededRng` is used for repeatable games and `scriptedDice` can inject exact die sequences for historical-rule cases.
