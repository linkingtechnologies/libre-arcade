# M29 — Playability audit notes

## Certification layers

1. **Behavioral parity** — existing M11/M12 shadow/runtime work verifies timing, RNG, calls, NPC
   effects, Dream semantics and level collision fingerprints against v1.02.
2. **Production simulation completion** — M24 verifies that all stages terminate through the real
   `Simulation` and campaign state machine.
3. **Normal-input evidence (new in M29)** — Day 1 and Day 2 are won without assigning coordinates or
   forcing phone/score state.
4. **Physical interaction reachability (new in M29)** — every interaction coordinate in every stage
   is reachable from the historical spawn through the real movement routine using only directional
   inputs.

## Reachability totals

| Stage | Targets | Reachable |
|---|---:|---:|
| Day 1 | 4 | 4 |
| Day 2 | 6 | 6 |
| Day 3 | 7 | 7 |
| Day 4 | 6 | 6 |
| Day 5 | 8 | 8 |
| Day 6 | 9 | 9 |
| Day 7 | 9 | 9 |
| Dream | 7 | 7 |
| **Total** | **56** | **56** |

Targets are phones, topic cabinets, coffee pickups and Dream table/phone positions. NPCs are not
listed as required interaction targets because most are moving hazards/effects rather than objects
that must be collected.

## Important boundary

The movement reachability search isolates geometry and the production movement routine. It does not
pretend that reaching a coordinate in isolation proves that every later level is easy to beat while
multiple calls and NPC hazards are active. The separate Day 1 and Day 2 input-only runs exercise
full simulation timing while playing.
