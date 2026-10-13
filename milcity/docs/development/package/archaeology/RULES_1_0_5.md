# MilCity Blue 1.0.5 — reconstructed ruleset

## Canonical configuration
- Grid: 30 x 30
- Default water: 50%
- Starting money: 100
- Score to win: 1000
- Money per operational Commercial per second: 1
- House acceleration: +5 each, capped at +50
- Blackout acceleration factor: -200
- Maximum continuous non-positive-energy interval: 120 s
- Score per building cell hit: 10
- Additional score per building cell when its building becomes destroyed: 10

## Buildings
| Building | Size | Cost | Build s | Energy | Produces | Production s |
|---|---:|---:|---:|---:|---|---:|
| Missile Silo | 1x1 | 10 | 10 | -1 | Missile | 30 |
| Shield Generator | 1x1 | 40 | 20 | -1 | Shield | 60 |
| Power Plant | 2x1 | 20 | 20 | +10 | — | — |
| Air Field | 1x3 | 60 | 30 | -1 | Aircraft | 60 |
| Laboratory | 2x1 | 90 | 30 | -1 | Spy | 30 |
| Factory | 2x2 | 40 | 30 | -1 | Mortar | 45 |
| House | 1x1 | 100 | 10 | -1 | acceleration | — |
| Commercial | 1x1 | 50 | 20 | -1 | money | continuous |
| Nuke Silo | 3x3 | 160 | 60 | -5 | Nuke | 60 |

Power Plant is special: construction time is not modified by acceleration/blackout.

## Weapons
| Weapon | Effect area |
|---|---:|
| Missile | 1x1 |
| Shield | 2x2 |
| Aircraft | 2x3 |
| Mortar | 2x2 |
| Nuke | 4x4 |
| Spy | 3x3 |

Offensive weapons use cell destruction, not numeric HP damage. A building is destroyed when all of its component cells are hit. Shield temporarily negates eligible cells for 60 seconds; incoming offensive fire on a shielded cell is reported to the attacker as a ground miss. Spy reveals building cells and shielded cells within 3x3.

## Fire cooldown
After firing, the player cannot fire again for area-in-cells seconds, modified by acceleration: `1000*area - accelerationFactor*(10*area)` ms. Examples at acceleration 0: Missile 1 s, Mortar 4 s, Aircraft 6 s, Nuke 16 s.

## Energy / defeat
Only operational buildings count toward energy. Money and weapon production stop while energy <= 0. Normal construction/production timing is multiplied by the acceleration formula; with factor -200 this becomes 3x nominal. A player with constructed buildings and energy <=0 loses immediately if current money cannot buy the number of Power Plants calculated as `ceil(-energy/10)`, or after 120 seconds continuously non-positive.

## Victory
- score >= configured Maximum Score; or
- every other player has lost.
