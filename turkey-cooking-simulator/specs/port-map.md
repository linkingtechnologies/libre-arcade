# Port map

What of the original is in the port, where, and how it was checked. The original is `reference/original/`: commit `13afa12`, the last of 1 December 2013
(see `../reference/SOURCE.md`). The restoration package had ported the earlier commit `56bcde6` (kept in `reference/package-baseline/`); this game moves to the later one.

## Levels of confidence (the collection's, in the root `AGENTS.md`)

| Part | Level | How |
|---|---|---|
| The thermal model: the oven's approach to its set point, the finite-difference sphere, water loss, the cook conditions of skin, body and core, the highest temperatures | **1, an executable oracle** | `js/model.js` of `13afa12`, run as it is next to `public/js/thermal-model.js`, tick for tick, compared **exactly** (`Object.is`, no tolerance) |
| The oven's air cooled by the open door (3 C when it is opened, 1 C a second while it stays open) | 1 for what it does to the model, 3 for the door | the oracle gives both models the same `setRawTemp` calls; that the page makes them is read in `ui.js` and shown by `test/gameplay.test.mjs` and by a game played in a browser |
| The one-second scheduler, the skip, the door states, the probe, the alarm | 3, source-level review | `js/ui.js` is not executable without CreateJS and a browser; read against `public/js/runtime.js` |
| The score | **1, the original run under stubs** | `ScoreScreen` of `js/screens.js`, run as it is with `createjs` and the game state stubbed, compared with `calculateLegacyScore` over 3,000 random servings and three model states (`test/original-screens.test.mjs`); `test/gameplay.test.mjs` also pins the tables, the optima and two worked totals |
| The market's prices and weight rule | **1, the original's statements run** | the statements of `js/main.js` that build the random weights and the market, cut out as they are and run with a recording `MarketItem`; compared with `MARKET_STATIC` and `makeTurkeyOffers` for 50 random draws |
| The effect of buying (stuffing max, frills 5, hardcore 20, one turkey) | 3, source-level review | `js/ui.js` (`MarketItem` click handler) read against `HeadlessGameState.purchase` |
| A whole game | 1 for the model along it | a game played in headless Chrome (6,019 ticks, five set points, five skips, the door open for about seven seconds) is replayed on the original and the port and agrees to 1e-12 (`test/browser-session.test.mjs`) |
| The page (canvas drawing, layout, Italian, the sounds, saving, the units) | 3, driven in a browser | new in the package, the units new here; the original's art is not used |

## The oracle

`test/model-oracle.test.mjs`. For each of ten turkeys (8, 10, 10.1, 12.2, 14.3, 15, 16.4, 18.5, 20 and 22.99 lb) and each of eleven oven schedules (steady 350, 425 and 150 °F; three set points; changes a few seconds apart; a hot
oven switched off; the door left open five minutes; a door opened and closed thirty times; three pseudo-random schedules with set points and door events), the original's `OvenModel` and the port's `PreservationOvenModel` are ticked
second by second and compared after every tick: each layer's temperature (bit for bit), highest temperature and cook condition (name, fraction and key), the oven's raw temperature and the cook time. About 540,000 ticks, in ten
seconds; **no difference**. (The file is run as a sloppy-mode function body, so its undeclared variables are globals of the test's process, as in a 2013 browser script.)

What it cannot see: `getTurkeyState()` does not expose the water lost, which is compared through the condition's fraction (a function of it), and the 20 radial points are not exposed, only the three layers' points. A test for the
package's earlier port against the earlier `model.js` is kept (`test/package-baseline-oracle.test.mjs`), to show what the package had got right.

## Mapping

| Original (`13afa12`) | Port |
|---|---|
| `js/model.js` `UtilityFunctions.calculateRadius`, `waterLoss`, `C2F`, `F2C`, `lbs2kgs` | `thermal-model.js` `calculateRadius`, `waterLoss`, `cToF`, `fToC`, `lbsToKg` |
| `transientSphereSeries` (the finite-difference step, ten sub-steps of 0.1 s, in place) | `advanceTemperatures` |
| `cookCondition(cookValue, layerName)` | `cookCondition(cookValue, layerName)` |
| `TurkeyLayer` (layer number, highest temperature), `TurkeyModel` (20 points, `initializePoints`) | `TurkeyLayer`, `TurkeyModel` (layers as `skin`, `body`, `core`; `exportState`/`importState` added for saving) |
| `OvenModel` (`equalizeTemp`, `secondTick`, `changeTemp`, `setRawTemp`) | `PreservationOvenModel` |
| `js/ui.js` the second timer (`diff > 1000`), `OvenUI.secondTick(diff)` (door-open cooling, then the model's tick) | `runtime.js` `RuntimeClock` in `legacy` mode (the page uses `fixed-step`, which catches up whole seconds) and `RuntimeClock.tick()` |
| `ui.js` skip (1200 ticks; `alarmTimer -= 1200` if the alarm is on) | `RuntimeClock.skipSeconds`, `OvenInteractionController.casualSkip20Minutes` |
| `ui.js` door (closed, peek, open; `setRawTemp(raw - 3)` on opening), the probe, `gameState.ovenOpened` | `DoorState`, `OvenInteractionController` |
| `js/main.js` `GameState`, the market (`MarketItem`), prices, the wallet 45.00, turkey weight 8 by default | `gameplay-state.js` `HeadlessGameState`, `MARKET_STATIC` |
| `js/ui.js` the effect of buying (stuffing keeps the largest modifier, frills set 5, hardcore 20, one turkey) | `HeadlessGameState.purchase` |
| `js/screens.js` `ScoreScreen` (the two score charts, `scoreDistribution`, the four modifiers) | `calculateLegacyScore`, `SKIN_SCORE_CHART`, `CORE_SCORE_CHART`, `scoreDistribution` |
| save and resume | new: `JsonSaveStore`, `GameSession.snapshot`/`restore` (the original has none) |
| the units | new: `app.js` `fmtF`, `fmtSet`, `stepLabel`, `toggleUnits` (the original is in Fahrenheit only) |
| the sound manager and its sounds | the twelve MP3 files it plays are used unchanged (`public/sounds/`); the page plays them from `app.js` (`SOUNDS`, `MUSIC`, `playSound`, `syncMusic`), with the original's volumes (the tunes quieter); the probe, save and light cues stay synthesized |
| the dialogue engine, the stories, the death screen, the art | **not ported** (`stories.js` and the art are not kept; the page draws its own pictures) |

## What was found, and what was done about it

1. **The package ported the morning of 1 December 2013, not the last version of the day** (`../reference/SOURCE.md`). Moved: this game follows `13afa12`. The package's `thermal-model.js` is exact for `56bcde6`
   (`test/package-baseline-oracle.test.mjs`), and was replaced by `public/js/thermal-model.js` written from `13afa12`'s `model.js` in the same order of arithmetic, then compared with it.
2. **The score, the door and the skip's counting changed too, and were ported**: the score tables (skin raw -1000, a core table of its own), the highest skin temperature, the 260 F skin optimum; the open door's cooling; the grade thresholds.
   `turkeyCookCounter` counting skipped ticks was already so in the package.
3. **Not ported: the death.** In the original, oven set points over 1,100 F, and (since `32f291a`) serving a turkey whose skin is on fire, show a house-fire screen with an explosion and a random number of guests, and nothing else.
   The port has none of it (the package had none either): serving a burning turkey gives a score, and the oven stops at 1,100 F. The original never scores a burning turkey (its score tables have no entry for "fire"); the port
   gives "fire" the same as "burnt" (-500 skin, 0 core).
4. **The package's own recorded oracle differs from this machine's in the last digit.** `archaeology/tests/oracle.json` (from a hand transcription of the earlier `model.js`, `legacy-reference.js`) holds `0.20471953130718815` where the original and the
   package's port, run in one process here, both give `0.20471953130718826` (T03), so the package's M1 test, which compares exactly, fails there on its own layout. JavaScript engines can round `Math.pow`, `Math.exp` or `Math.sin` one unit in the last place apart (item 7).
5. **The package's M12 test does not pass on the package's own README** (R17 and R18 look for text it no longer has), although its recorded results say 18/18. M11 cannot run here (it reads `/mnt/data/...`).
   `test/package.test.mjs` runs the rest, against the package's own `src/`, and records these outcomes.
6. **The package's `reference/original/README.md` is not the original's README** (links removed, a section dropped); the originals' READMEs are kept here.
7. **Engines agree to the last bit only some of the time.** The game played in headless Chrome (`test/fixtures/browser-session.json`) gives, replayed in Node on the original's `model.js` and on the port's, the same
   temperatures to 1e-12; the replay is therefore compared to 1e-12 and not bit for bit. Inside one engine the port and the original agree exactly (the oracle). A player cannot see this.
8. **The market's weights are fixed.** The original draws five turkey weights at random for each game (10.10 to 22.99 lb); the port always offers 10.10, 12.20, 14.30, 16.40 and 18.50 lb, with the original's price rule (the weight
   times 1.2, 1.0, 0.6, 1.4 and 0.8). It makes the game deterministic and is a departure from the original (the oracle's turkeys include 22.99 lb, the top of what can be drawn).
9. **The package's `replayActionLog` does not put the ticks where the live page did** (it places 4 and 2 where the page took 3 and 3 in an earlier game), because the page moves the clock's last wall time itself when cooking starts and after a skip, which the
   log does not record. Saving and resuming store the state and do not use replay.
10. **The oven's "OFF"** is a set point of 125 F, as in the original; in Celsius the lowest set point is 50 C.

## What was not compared

The page's pictures, the layout, which sound plays when (the original's events were mapped by hand), the Italian translation, saving and resuming, the units, the market's weights and the dialogue are not compared with the original (the units do not exist in it). `ui.js`'s timing in a browser
(a one-second step, `Date.now()` differences) is read, not run. The effect of buying is read, not run.
