# MilCity Blue — M1 archaeology audit

## Baseline
Canonical source baseline: `MilCity-Blue_v1.0.5_src.zip`.
Its SHA-256 matches the historical SourceForge value: `6149db64b8acf3fc3e65df8050212ff53b3a48cfde16bf6c9fc7ba1a1311d47e`.

The separately supplied JAR/JAD identify themselves as 1.0.3 and are therefore retained as historical comparison artifacts, not the 1.0.5 executable baseline. The 1.0.5 source ZIP itself contains deployed 1.0.5 artifacts.

## License
README, COPYING and the overwhelming majority of Java source headers use GPL v3 wording: `either version 3 of the License`, with no `or any later version` clause. Preservation classification: GPL-3.0-only for code, pending any contradictory file-specific notice. Asset licensing remains a separate gate.

## Architecture
- MIDlet/UI: `MilCityBlue`
- simulation/game orchestration: `core.Game`, `PlayerAbstract`
- local player thread: `players.LocalPlayer`
- AI player thread: `players.AIPlayer`
- board/model: `Grid`, `Cell`, `Cells`, `Building`, factories
- procedural map: `RandomWalkGridBuilder` + `RandomWalker`
- fog/attack knowledge: `StatusGrid`
- weapons/effects: `Weapon` and six subclasses
- Bluetooth command synchronization: `bluetooth/*`, `commands/*`

Single player and Bluetooth share the same core Player/Grid/Weapon/Command model, which is favorable for a faithful browser port.

## Board
30x30 canonical grid, default 50% water. Solo creates one procedural map and clones its terrain for the AI so both players build on equivalent geography while maintaining separate cities.

## AI conclusion
The advertised four AI types are four levels of one `AIPlayer` implementation: Easy, Medium, Hard, Madness. Their main strategic difference is the military production building and the number of Commercial buildings sought before that branch. Preserve all four historical levels, but do not describe them as four independent algorithms.

## Significant historical quirks to preserve/test
- unseeded fresh `Random` instances used repeatedly;
- AI build placement retries only 10 times, then may submit an invalid position;
- AI ignores Spy, Shield, House, Laboratory and Shield Generator;
- targeting is random except avoidance of cells already known to be WATER;
- score logic is explicitly marked in source as 2-player limited;
- shield makes protected cells appear as ground misses to the attacker;
- blackout changes normal timing via acceleration factor -200, while Power Plant construction remains nominal;
- configuration menu cycles water %, max score and starting money rather than accepting arbitrary values.

## Port gate
GO for continued archaeology and eventual HTML5 port. HOLD public reuse of original graphical assets until their provenance/license is resolved or replacements are selected.
