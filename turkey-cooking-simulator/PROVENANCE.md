# Provenance

## What this is

*Turkey Cooking Simulator* is a browser game made for GitHub's Game Off in 2013 by Robert J. Chen (programming), Benjamin Kwok (art), Scott R. Mobley
(math and dialogue) and Sheen Kao (finite elements). You buy a turkey with $45, cook it in an oven whose temperature you set, and serve it; the turkey's
skin, body and core heat at different speeds, and the score depends on how cooked they are. The original is JavaScript on CreateJS and runs in a browser.

This folder is a **ported** game in the collection's sense: the thermal model, the market and the score are in modules of their own, with a new page
around them (a canvas drawn here, Italian and English, saving, touch, and a choice of °F or °C that the original does not have). It started from a restoration package,
`turkey-cooking-simulator-complete-rc1.zip` (SHA-256 `5a5883690f19da28af75e302beb97ac7dfcc703b16a8b8fe0b8d640716760d6e`, 151,914 bytes, 110 files; every
hash in the package's own `SHA256SUMS` files was checked and agreed), which carried a JavaScript port, its page, twelve milestone reports and test scripts.

**The package ported the morning of 1 December 2013** (commit `56bcde6`, 06:50). The authors changed the thermal model, the cook ranges, the score and the oven door over
the rest of that day, so the game here follows **the last commit of that day, `13afa12` (23:25)**, and the package's model and score were replaced by a port of
that one. The package's port had been exact for the commit it named, which was checked first. Everything else in the package's code was kept.

## Where each thing comes from

| Thing | Source | Evidence |
|---|---|---|
| `public/css/app.css`, `public/js/game-session.js` | the package's `game/src/`, **byte for byte** | `test/reference.test.mjs` (the package's SHA-256) |
| `public/js/thermal-model.js`, `runtime.js`, `gameplay-state.js`, `app.js`, `ui-shell.js`, `public/index.html` | the package's, **changed**: the model and score of `13afa12`, the door, the units, two lines of `index.html` | `docs/development/CHANGES.md` (hashes before and after, what changed in each); `specs/port-map.md` |
| `docs/development/package/` | the package, unmodified except that its ~50 per-milestone reports, results and hash lists were replaced by `docs/development/MILESTONES.md`: its README, its page and modules (`game/src/`, the earlier port), its test scripts and recorded oracle, its `game/` documents | `docs/development/README.md`; the package's own hashes agreed before the removal, and `test/package.test.mjs` checks `src/` against `game/SHA256SUMS` |
| `reference/original/` | nine files of commit `13afa12` of <https://github.com/fernjager/game-off-2013>, byte for byte | `reference/ORIGINAL_SHA256.txt` (SHA-256 and git blob SHA-1); `reference/SOURCE.md` |
| `reference/package-baseline/` | the same nine files of commit `56bcde6`, byte for byte | `reference/package-baseline/SHA256.txt`; the blob IDs agree with the package's own record |
| `test/model-oracle.test.mjs`, `test/package-baseline-oracle.test.mjs`, `test/browser-session.test.mjs`, `test/fixtures/browser-session.json`, `test/gameplay.test.mjs` | new | Level 1 for the thermal model; a game played in Chrome; hand-worked score and door numbers |
| `HOW_TO_PLAY.md` | the package's `game/HOW_TO_PLAY.md`, with the open door, the score and the units added | |
| the licences, `README.md`, this file, `specs/port-map.md`, `CHANGELOG.md`, `STORY.md`, `SOFTWARE_ARCHAEOLOGY.md`, the scripts and the other tests | new | |

## The licences

**The code** (`public/`, `scripts/`, `test/`) is **GPL-3.0-only**: the package's modules say `SPDX-License-Identifier: GPL-3.0-only`, the original's
`LICENSE` is the GPL version 3 and none of the files kept (both sets) carries a per-file notice or the words "or later". "Or later" is therefore not
assumed (the check is `test/reference.test.mjs`).

**The original's artwork** is, according to its README, licensed Creative Commons Attribution-NonCommercial by Benjamin Kwok "unless indicated otherwise
in the credits page", and **the original's sound** is attributed on its credits screen. The artwork is not redistributed, and the port references none of it (`test/production.test.mjs`). **The sound is used**: twelve of the original's MP3 files are in `public/sounds/` (see below). The credits screen and the sound attributions were read (below). The dialogue corpus
(`js/stories.js`) has no statement of its own; it is not redistributed either. The page draws its own pictures.

The original's files kept in `reference/` stay under the original's licence.

The original's credits screen (`res/screens/HelpCreditsScreen/Credits.png`) and its `res/sound/Audio Sources.txt` were read in the clone (and not kept). They credit Scott Mobley (dialogue), Robert J. Chen (JavaScript), Benjamin Kwok (art) and Sheen Kao (finite elements), name CreateJS as the library, and list the music and sounds: *Turkey in the Straw* (American folk song, performed by the United States Air Force Band, public domain), *Waterford* (Kevin MacLeod, FreePD, public domain) and eleven Freesound effects (buzz1, Cash Register Fake, click1, click2, Coinbank, explosion, Fire, Frying Pan, Supermarket MS, Tongue Click, winchester 30-30 lever action EJECT) each marked Creative Commons 0; the sources file says that, unless noted, all sounds and music are in the public domain. The credits screen says nothing about the artwork's licence, so the README's CC BY-NC statement for the artwork stands. **Twelve of the original's sound files are used here, byte for byte** (`public/sounds/`, with `README.txt` giving the SHA-256, git blob ID and original path of each): the ones that its `soundmanager.js` registers and plays (click, buzz, purchase, ding, the oven alarm's double beep, the shop entrance, four oven-door sounds, and the tunes *Turkey in the Straw* and *Waterford*). The credits do not say which Freesound file is which effect, and the door and entrance files carry no credit of their own, so those are covered only by the sources file's general public-domain statement, which is the original's and was not independently established. The page still synthesizes three cues that the original has no sound for (the probe, the save and the oven light).

## How it was checked

**The thermal model, Level 1.** `js/model.js` of `13afa12` is run as it is (`new Function`, with `DEBUG` and `console` parameters and a stub for the oven light) next to
`public/js/thermal-model.js`, second by second, and everything the original exposes is compared exactly: each layer's temperature, highest temperature and cook condition
(name, fraction and key), the oven's raw temperature and the cook time. Ten turkeys (8 to 22.99 lb) × eleven oven schedules (steady, stepped and random set points, the door
left open, the door opened and closed again and again; the door's cooling is applied to both models from outside, as the original's `ui.js` does) = about 540,000 ticks.
**No difference.** The original's `getTurkeyState()` does not expose the water lost, which is compared through the condition's fraction.

**The package's earlier port, Level 1 too.** The same was done, before the move, for the package as it arrived: its `thermal-model.js` against the `model.js` of `56bcde6`, one turkey and four schedules in the
kept test (`test/package-baseline-oracle.test.mjs`; an earlier run of 47,700 ticks on three turkeys and eight schedules, with the original's own roots and series, also showed no difference). The package was exact for the commit it named.

**A game played in a browser against the original.** A Casual game in headless Chrome (a Free Range Turkey of 12.2 lb; oven 350, 400, 325 and, in Celsius, 170 °C; five
"Skip 20 min"; the door fully open for about seven real seconds with the probe read; 6,019 ticks) was saved by the page, and its log was replayed on the original's `model.js` and on the port, with the door's cooling as
`ui.js` has it: the temperatures, highest temperatures and conditions agree to 1e-12 (`test/browser-session.test.mjs`; to 1e-12 and not to the bit because Chrome's engine may round `Math.pow` and friends one unit in the last place from Node's).

**The score and the market, Level 1 under stubs.** `ScoreScreen` of `screens.js` is run as it is, with `createjs`, `Button`, the stage and the game state replaced by stubs (and the dialogue arrays of the missing `stories.js` by stand-in strings), and the total and the two temperature scores that it builds are compared with the port's `calculateLegacyScore` over 3,000 random servings (every cook condition, the four turkey types, the stuffings, frills and difficulty) and over three states that the model itself reaches: no difference (`test/original-screens.test.mjs`). The statements of `main.js` that draw the five random turkey weights and build the market are cut out as they are and run with a recording `MarketItem`: the prices of the eight fixed items and the rule price = weight × multiplier, for 50 random draws (weights between 10.10 and 22.99 lb), are the port's.

**The door, Level 3, with worked numbers.** `ui.js` needs CreateJS and a browser, so it was read against `runtime.js` (`specs/port-map.md`), and `test/gameplay.test.mjs` pins the score tables, the optima (260 F for the skin, 165 F for the core), two totals worked by hand and the open door's 3 C and 1 C a second; the browser game replayed above exercises the door.

**The package's own tests.** Twelve scripts, `archaeology/tests/m1` to `m12`, run unmodified against the package's own `src/` in a rebuilt copy of the package's layout (`test/package.test.mjs`): M2 to M10 pass; **M1 stops at T03**, where its
recorded fraction differs from this machine's in the last digit (the original's and the package's port agree with each other); **M12 passes 16 of 18** (its R17 and R18 look for text that the package's README no longer has,
although its recorded results say 18/18); **M11 is not run** (it reads a folder of the package author's machine and builds paths from a URL in a way that does not work on Windows). M1 and M12 fail the same way in the package's own layout.

**The page** was driven in headless Chrome (a Chromium-based browser) at 1280 by 800 and in a 390 by 844 phone window at twice the pixel ratio: Casual and Hardcore, English and Italian, **°F and °C** (the button, the `U` key, the
set point stepping 10 °C in Celsius, the preference remembered), buying, peeking, opening the door, the probe, the oven light, the skip, serving, saving, reloading and Resuming, the credits. No error reached the console. The screenshots
in `screenshots/` are from these runs. Hardcore (its skip is disabled, its modifier is 20; a raw turkey served at once scores -998 × 1.03 × 20 = -20,559), Italian with Celsius, saving, reloading and Resuming (the preferences and the cooking state came back) were run on the new model too.

## Open points

1. **The door and the one-second scheduler are read, not run.** `ui.js` needs CreateJS and a browser; the score and the market are now run under stubs. The market's turkey weights are **fixed** in the port (10.10 to 18.50 lb) where the original draws them at random (10.10 to 22.99 lb).
2. **The death is not ported.** The original shows a house-fire screen if the oven is set above 1,100 F or a burning turkey is served; the port has no such screen (it clamps the oven at 1,100 F and scores a burning turkey like a burnt one). The package had none either.
3. **The units are new.** Nothing in the original has Celsius; the set-point steps (10 °C from where the oven is, 50 to 590 °C) are this collection's choice. The oven's "OFF" is 125 °F in Fahrenheit and 50 °C in Celsius.
4. **Pictures, sounds and layout are the package's, not the original's, and were not compared with it.** Presentation problems that were seen and **fixed here** (`docs/development/CHANGES.md`): in the market the Extras panel ran to the right edge of the canvas and some item names were cut by the Buy buttons (the panels now leave a margin and a long name takes two lines); the strip of owned items sat over the header text on a phone and behind the controls in landscape (it is now in the top bar beside the title); with the door open the action button still read "Open" (it now reads "Close"). **Left as they are:** the "Last probe" chip overlaps the kitchen window, which is decoration; the owned-item icons are small on a phone; the market's item names are English in the Italian page; the body's temperature meter turns red at the core's thresholds.
5. **Engines.** Another browser engine can round the model's `Math.pow`, `Math.exp` and `Math.sin` one unit in the last place apart; it makes no visible difference, but it means a recorded run is reproduced to 1e-12, not bit for bit, across engines.
6. **Not tried:** Firefox, Safari, a real phone, the sound (the original's files and the three synthesized cues were not listened to; that they are requested, found and played in the right places was checked in Chrome's network log), a game left running for a long time, and the package's M11.
7. **The package's `replayActionLog` does not reproduce the ticks of a live game exactly.** The page does not use it for saving.
8. **Old saves.** A save made by the package's earlier model cannot be resumed on this one (the thermal state has a different shape); the page uses new storage keys, so an old save is simply not offered.
9. **Dates.** The clone of the original was made on 18 October 2026; its other branches were listed, not read; the author's mirror (`fernjager.net`) was not opened.
