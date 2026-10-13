# MilCity 1.0.5 — behavioral oracle specification

Goal: compare the historical Java decision rules with a future JavaScript port without upgrading the AI.

## Instrumented state
For each AI decision tick record:
- tick / build-turn index
- level
- money, energy, acceleration factor, score
- counts by building type and building state
- ammo by weapon type
- fire cooldown deadline / eligibility
- status-grid summary
- RNG draws supplied by deterministic test adapter
- selected action, building type, coordinate, target player, weapon type
- action success/failure

## Canonical scenarios
1. Fresh game, 100 money, no buildings.
2. Low money (< Power Plant cost).
3. Energy > 6 with enough money.
4. Energy <= 6 with >1 Commercial.
5. Energy <= 0 with insufficient generation.
6. Level-specific military threshold reached.
7. Multiple ammo classes ready simultaneously.
8. Target grid containing known water / unknown ground / known hits.
9. Opponent shield present (expect no AI-specific adaptation).
10. Score one hit away from victory (expect no strategy change).
11. Long game with many buildings.
12. Forced invalid placement sequence for 10 retries.

## Expected strategy matrix
| Scenario | Easy | Medium | Hard | Madness |
|---|---|---|---|---|
| first economic growth | Commercial/Power Plant bootstrap | same | same | same |
| military producer | Missile Silo | Factory | Air Field | Nuke Silo |
| planned Commercial threshold | 0 | 2 | 4 | 6 |
| Spy | never | never | never | never |
| Shield | never | never | never | never |
| House | never | never | never | never |
| adaptive targeting | none | none | none | none |

## Parity rule
The future port passes AI parity when, for identical state plus injected RNG sequence, it emits the same action sequence as `AIPlayer.java`, including failed build attempts and fixed weapon-order behavior.
