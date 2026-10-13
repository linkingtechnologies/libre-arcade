# Port map: MilCity - Blue Edition 1.0.5 (Java ME) to JavaScript

How the original's classes correspond to the port's modules, what was compared with the original and how, and what the comparison found. The original is in `reference/milcity-blue-1.0.5/`; the port is `public/src/`.

## Verification level

Collection-wide levels (`AGENTS.md` at the root): 1 an executable oracle, 2 hand-computed values, 3 careful reading.

- **Level 1, for the game itself.** The original's classes (the core, and the model, the views and the engine's `paint()` of the GUI) are compiled unmodified and run in virtual time next to the port; the state of the two is compared after every tenth of a second. This covers the economy, the buildings and their construction and production, the weapons, the shields, the radar, the computer's four levels, the map, the end of the game, the score and the vibration.
- **Level 3, for the page.** The menus, the panel, the keyboard and the mouse, the pictures, the texts, the saving, the options' storage and the hints are the page's own and are read, not compared. The cursor model (`M5Controller`) is the package's own design for a mouse; the original's `MilCityModel`, which moves a cursor with the handset's keys, is not compared with it (the original's is in the oracle only to run its `paint()`).

## How the oracle works

`tools/java-oracle.mjs` writes a scenario (the options, a seed, and what the person does in each tenth of a second: build here, fire there, place a shield, look at the radar, leave), plays it on the port, then on the original, and compares a checksum of the state after each tenth of a second. If they differ it asks both for the whole state of that moment and prints the first line that differs.

- The original is compiled with `javac --release 8` against stand-ins for the handset's API (`test/java-oracle/javax`: they draw nothing). At run time a class loader changes three names in the constant pools of the original's classes, nothing else: `java/lang/Thread` to a virtual-time thread, `java/lang/System` to a virtual clock, and `java/util/Random` to a generator whose seeds come from a given sequence (`test/java-oracle/oracle/launch/RewritingLoader.java`). The bytecode of every method is as the compiler wrote it.
- Time is virtual and a cooperative scheduler runs one thread at a time: the two players' threads (one pass a second each, from the moment the game starts) and the engine's (a picture ten times a second). Equal times run in the order the threads went to sleep, which is a model: on the handset it is a race.
- The engine's thread is replaced by the harness's own copy of `GameEngine.run()` (`Harness.FrameEngine`), because `Object.wait()` cannot be used under a cooperative scheduler; what it calls on each beat is the original's own `GameEngine.paint()`: the model's `Ai()` with the keys, then the three views.
- The original draws a new unseeded `java.util.Random` whenever it needs random numbers (one per coastline walker, three per shot or building of the computer). The oracle gives both sides the same sequence of seeds (SplitMix64 from the scenario's seed), in the order they are asked for, so a game can be repeated. The port makes a new generator for each use as well.
- `MILCITY_CLASSES=<directory with the unzipped classes of the author's deployed jar>` runs his compiled classes instead of the ones compiled here.

`npm run test:live` plays the 13 scenarios again against the original. `npm test` replays the recording (`test/fixtures/java-oracle.json`, 13 scenarios of 60 to 900 seconds, the original's checksum for each tenth of a second) against the port without Java, and breaks the port nine ways to show that the comparison sees each (`test/oracle-sensitivity.test.mjs`).

## The classes

| Original | Port | How it was checked |
|---|---|---|
| `Config` | `core/config.js` (`CONFIG`) | read from `Config.java`, `Building.java`, `Weapon.java` (`test/core.test.mjs`); the oracle |
| `Cell`, `TimedCell`, `Cells` | the grid's numbers, `core/grid.js`; the shields in `core/combat.js` | the oracle (every cell of both cities, the shield list, each building's cells) |
| `Building`, `BuildingFactory`, the nine kinds | `core/player.js` (`build`, `updateBuildings`, `constructionMs`), `config.js` | the oracle (kind, state, times, hits) |
| `PowerPlant.update`, `Commercial.update` | the `specialBuildTiming` and `specialPositiveAccelerationTiming` flags | the oracle |
| `Weapon`, `WeaponFactory`, the six weapons | `core/combat.js` (`fireWeapon`, `hitCell`, `applyShield`, `applySpy`) | the oracle |
| `StatusGrid` | `status` of the player, `core/combat.js` | the oracle (the radar of each city) |
| `Command`, `Commander`, `Commands` | not objects: their effects, in `combat.js` (scores) and `game.js` (loss, win, end) | the oracle |
| `PlayerAbstract`, `LocalPlayer` | `core/player.js` | the oracle |
| `AIPlayer` | `ai/historical-ai.js` | the oracle: its turn, its builds, its shots, and how many seeds it takes |
| `Game`, `GameListener` | `core/game.js` | the oracle (status, winner; the vibration as a callback) |
| `Grid`, `GridBuilder`, `RandomWalkGridBuilder`, `RandomWalker` | `core/grid.js` | the oracle (the map, and how many seeds it takes) |
| `GameEngine.paint()`, `GridView` (its effect on the game) | `ui/m6-renderer.js` (`drawCity`, `drawRadar`, with `step`) | the oracle (explosions, radar fading, the count of tens) |
| `MilCityModel`, `CursorView` | `ui/m5-model.js` (the package's design for a mouse) | reading |
| `MenuView`, `ImageDrawer`, `Splash`, `ImageFont`, `DisplayManager` | `ui/app.js`, `ui/m6-renderer.js` (drawn by the page) | reading |
| `MilCityBlue` (menus, options, help) | `ui/app.js` | reading; the steps of the options in `test/core.test.mjs` |
| `ParametersStore` | the options in `localStorage` | reading |
| `bluetooth/*`, `RemotePlayer` | not ported | |

## What the oracle found in the package's port

The package's port was written from a reading of the source. Its tests assert what its authors read in it (and that the port repeats itself under a seed), and a script checks that the source contains certain facts; none of them ran the original, as its parity document says (`docs/development/package/M8_PARITY_CERTIFICATION.md`). Each of these was found by the comparison with the original, and fixed in `public/src/`:

1. **Time.** The package moved the game in whole seconds and settled the accounts from the first second on. The original's threads settle them the moment the game starts and again every second, while what the person does happens at any moment: a building's time of making and a weapon's reload are read from the clock at that moment. The game now has a clock in milliseconds and a pass at 0, 1000, 2000 ms; `Game.advance(ms)`.
2. **The computer's choice of target.** `AIPlayer.fire()` takes a second, new generator to choose the opponent (`getRandomPlayerIndexButNotSelf()`) and draws from it until it is not itself; the package drew nothing. Every shot of the computer therefore used up different numbers, and its later choices were different.
3. **The coastline.** `RandomWalkGridBuilder` lets all ten walkers take their step before it looks at the water again; the package stopped as soon as the target was reached, in the middle of a round. This shows only when the target is not a multiple of ten cells, e.g. with the water at 45% or 55%.
4. **A building hit while it is being built** shows the flame (cell 29) once it is finished, because `updateConstruction()` copies the building's own cells to the grid; the package put the whole tile back.
5. **Training mode ends when the person loses** (`hasLoose()` calls `Game.end()` when there is one player); in the package the game went on.
6. **The computer never scores.** The score goes with a command to "the other player" of the one hit, and `Commander` applies it only to the local player. So the person scores for hitting the computer's city and nobody scores for hitting the person's. The package gave the computer points, and with enough hits it could win by score.
7. **The computer plays its turn after winning or losing in the same pass.** `AIPlayer.run()` calls `play()` after `hasWon()` whatever the result; the package skipped it.
8. **A player decides on its own victory, in its own pass.** The package checked all players after each pass, and so declared the person the winner a second early when the computer lost (and the other way round).
9. **Shields.** The original stores a shielded cell in the grid as its type, negated; the shield ends in the first pass after the end time (`now > end`) and puts the saved type back, and a cell found shielded is not grass, so nothing can be built under a shield; a building that finishes under a shield rewrites the cells as they were made, which drops the shield but leaves its end to put the old type back. The package kept a list beside an untouched grid and tested the time directly, which differs in each of these. The port now stores shields as the original does and the renderer draws a negated cell with its frame, as `GridView` does.
10. **The picture changes the game, in the original, ten times a second and no more.** `GridView.render()` moves each explosion on a step and fades the radar once in ten pictures. The package did the same in its drawing routines, but the page drew a picture for every click as well, so every click moved the explosions on. They are now moved only by the ten-a-second beat (`step`).
11. **The seeds.** The package fixed the seed of every game (`seed:12345` in the page), so every game had the same coast and the same computer. Games now take their seeds from the browser, as the original takes them from the clock.
12. **Vibration.** The handset vibrates for the weapon's area in tenths of a second when the person fires (even if the shot does not come off) and when the computer's shot lands on the person's city; the package omitted it and said so. It is added (`Game.vibrate`), and its times are compared like the rest.

Two faults of the oracle itself were found and fixed on the way: the engine's thread measured the time of a picture with the real clock instead of the virtual one (it drifted by a millisecond, which moved the pictures against the passes), and a check whose option had been mistyped selected no scenario and reported success (a check that checks nothing now fails).

## Known differences that are kept, on purpose

- **A pause stops the game's clock.** In the original the timers read the phone's clock, so a pause did not stop them: construction and reloads and the two minutes without energy went on, and a pause shorter than a second left two loops running for each player. The page stops the game when a dialog is open, when the page is hidden and when the person leaves, and nothing counts the time away.
- **Training mode** has no enemy radar in the page; the original lets the person switch to "Military(P1)" and shoot at their own city.
- **The Bluetooth game** is not ported (the package took it out of the page, and the original's classes for it are kept only in `reference/`).
- **The pictures** are drawn by the page. The original's tile sheet, its bitmap font, its splash and its icon are not used (their licence is not established).
- **No sound.** The original's sound option is switched off in the code and nothing plays.
- **Saving the game** and resuming it, the hints, the panel and the Italian text are the page's own.
- **The order of two threads at the same instant** is fixed (the person's, then the computer's); on the handset it is a race.
- **The page's clock** follows the real one in steps of 50 ms (at most 250 ms at a time), so a slow machine plays slower, not faster.

## What the comparison does not cover

- The page: its menus, panel, texts, mouse and keyboard, the saving, the layout. They were driven in a real browser (see `PROVENANCE.md`).
- The cursor model of the original (`MilCityModel`), which the page does not use.
- The drawing itself (colours, tiles). Only what drawing does to the game is compared.
- The Bluetooth classes.
- Scenarios that the player bots do not reach; the coverage report (`node tools/oracle-coverage.mjs`) lists what they do reach.
