# MilCity M4 — gameplay parity

M4 tightens the JavaScript simulation against the supplied MilCity Blue 1.0.5 source. It is still a parity harness, not a visual restoration.

## Corrections from M3

- Solo mode now uses **one generated terrain map**, cloned for the AI exactly as `MilCityBlue.startSoloGame()` does. Human and AI coast/grass cells therefore match.
- `PlayerAbstract` initial acceleration is represented as `0`, then recalculated on the first one-second update.
- Building update order now matches `Building.update()`: **production clock first, construction completion second**.
  - Laboratory placed at t=0 with acceleration 0 becomes operational at 30 s but produces its first Spy at 60 s.
  - Nuke Silo becomes operational at 60 s but produces its first Nuke at 120 s.
- Power Plant retains its fixed 20 s special construction path even during blackout.
- Commercial retains its special rule: with positive acceleration its construction time is the unaccelerated base time; with zero/negative acceleration it falls back to normal `Building.update()` timing.
- Shield placement now follows the historical self-fire path and **does not set the global weapon reuse delay**.
- An already shielded cell cannot have its 60 s shield refreshed by overlapping another shield while active.
- Offensive fire on known water produces no hit command/status change, matching `Weapon.makeEffect()`.
- Starting Money and Maximum Score are configurable in the harness, reflecting the 1.0.4+ options.

## Historical scoring quirk preserved

Java 1.0.5 continues iterating destroyed buildings when a weapon hits their former cells. `Cell.isHit()` returns true for a cell whose type is already >= `CELL_DESTROYED`. The attacker's `StatusGrid` then changes that cell from BUILDING_DESTROYED back to BUILDING_HIT (+10), immediately receives DESTROYED for the same cell (+10), and returns it to BUILDING_DESTROYED.

Result: repeatedly hitting the same already-destroyed building cell can award **20 additional score per attack**. M4 deliberately preserves this behavior. It should be treated as a historical gameplay bug/quirk, not silently fixed in the parity mode.

## Blackout timing: code vs manual wording

The help text says construction times are "doubled" below zero energy. The actual 1.0.5 formula uses acceleration factor `-200`:

`time = base*1000 - 10*base*(-200) = 3 * base*1000`

So generic construction, production and offensive weapon reuse delays become **3× base**, not 2×. M4 follows the code. Power Plant remains the special exception.

## Rotation

The Java API carries an angle argument (`0/90/180/270`), but `Size.isFreeAt`, `Size.isInGridAt`, all building constructors and the UI placement path ignore rotation. `MilCityModel` always sends `Building.ANGLE_0`. Therefore M4 does **not** invent rotatable footprints: lack of rotation is parity, not a missing feature.

## Test gate

M4 contains 21 automated tests covering configuration, Java RNG vectors, shared solo terrain, all four AI levels, shields, Spy, water behavior, scoring, the destroyed-cell scoring quirk, production timing, cooldown timing, options and blackout loss timing.
