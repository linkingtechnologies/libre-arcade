# What was changed in the package's page and modules

The page and its modules in `public/` started as `game/src/` of the package `turkey-cooking-simulator-complete-rc1.zip`, which is kept unchanged in
`package/game/src/`. The package ports the original's commit `56bcde6` (06:50 on 1 December 2013); the game follows the later commit `13afa12` (23:25 the same
day), so the thermal model, the score and the door were changed, and the units were added. The reasons are in `../../specs/port-map.md` and `../../reference/SOURCE.md`.

| File | Package's SHA-256 | Now | Lines (added or changed, removed) |
|---|---|---|---|
| `css/app.css` | `3cb9bc46f287ec1438edc6d142d607405ab6ba1c4b5656e193c5d08f149047a5` | unchanged | |
| `js/game-session.js` | `b87e9dbaf48722a3ac24429a2c24f1f92b7f0962d33d26b02fa58ee06bfcae5f` | unchanged | |
| `js/thermal-model.js` | `e92db5fab87c151c36177d705fb577128f0eabb627d178916ad13210d43a7805` | `42cccb13daa72c9c3e8c58f5e5c698cc723c461d647c218755e09f2891ce5979` | rewritten (below) |
| `js/runtime.js` | `7acba3c2495a4ab5fc3e5a4320c8e0a2089e13cfa0baf15440c3ed14e8189dbe` | `b02342807bad4434d83c601f473600fb631d5c59e367d960e5a23a5e9073f37a` | 24 |
| `js/gameplay-state.js` | `426cd0198c6226f1f262da991b18f587fa5b32f35a8a2b2740f01e348130a4e3` | `f3d42f88039cd1bfdd6b43e65def96aa6d67d5522fe2edc317bd403461cf1aa6` | 19 |
| `js/app.js` | `5ece119357d5e9d8b2b96f045a209994857e2a3f8bd287650978ba7c106e9609` | `f0cdf73b52c1483350de1f1c9827109b664fa83ee78bb2d5d751bf19ad0f6ffb` | 81 |
| `js/ui-shell.js` | `1a4dffe82c2f56c71fc9cf085da63954b440112c737f631c6161277944918da8` | `909c39e5630d400481721dbb45b13e03e1da21bfcfe12801ed20d77bede0664a` | 22 |
| `index.html` | `efe599da0c32c4c424c0a621e7527b50264abe9c7bafbadc519ab23707303ed4` | `a5cc6d6990a3b0e026d146d5f65465b0a920c80fbfef00d2c1af0363573216ca` | 2 |

By file:

- `thermal-model.js`: the model of `13afa12` instead of the package's analytic series: a sphere sampled at 20 radial points, advanced each second by ten explicit
  finite-difference steps of 0.1 s with the oven's air as a convective boundary; density 700 and specific heat 2810 (not 1050 and 2000); the skin, body and core read
  points 19, 10 and 1; each layer keeps its highest temperature; the cook-state ranges differ between skin and body and the core, and the fractions are different; no 80-second
  re-anchoring and no steady timer. The classes keep the package's names and the state the page reads (`getTurkeyState()`: `tempC`, `waterLost`, `condition`, plus `highestC`; `oven.rawTempC`,
  `oven.globalTime`); the saved thermal state is schema 3 (the 20 points and the layers). The package's functions for the roots of the series are gone.
- `runtime.js`: `RuntimeClock.tick()` is the one place that advances a second (the three call sites of the package's `secondTick` use it); when the door is fully open it first takes 1 C off the
  oven's air (never below 20 C), as `OvenUI.secondTick` does in the original; opening the door fully takes 3 C off at once (`OvenInteractionController.fullOpenOrClose`), as the original's `handlePress` does.
- `gameplay-state.js`: the score of `13afa12`: the skin table's raw is -1000 (was 0), the core has a table of its own and uses it (slightly cooked 600, overcooked 750; the package scored the
  core with the skin's table), the skin is scored by the highest temperature it reached and with the 260 F optimum (the package scored the skin by its current temperature with the 165 F one).
- `app.js`: the units (see below), the save key `...session.v3` (a save of the earlier model cannot be resumed), the result line "Core" without the asterisk; layout fixes: the market's three panels leave a right margin (widths 372, 248, 248) and an item name that does not fit takes two lines, the strip of owned items is drawn in the top bar beside the title (it sat over the header text on a phone and behind the controls in landscape), and the door's action button reads "Close" while the door is open (`doorActionLabel`); **the original's sounds**: `playSound`, `doorSound` and `syncMusic` play the twelve files of `public/sounds/` (the click for the buttons, the buzz for errors, the purchase, the ding for serving, the double beep for the alarm, the shop entrance when a game starts, the four oven-door sounds for peek and full open or close, *Turkey in the Straw* on the title, help, credits and result, *Waterford* in the market, nothing in the kitchen) in place of the package's synthesized beeps; the probe, save and light cues stay synthesized; the credits screen names the original's authors, the sounds' licence and the commit.
- `ui-shell.js`: a `closeDoor` label ("Close", "Chiudi"), the credits text (authors, sounds' licence); the grades follow the final dialogue thresholds (1800, 1400, 1000), the controls line and the guide text mention `U` and 165 F (74 C).
- `index.html`: an empty favicon link (the page asked the server for `favicon.ico` and got a 404) and the collection's visit counter before `</body>`.

**Units (new, not in the original).** `app.js` keeps temperatures in Fahrenheit in the page, as the original shows them, and writes them in the chosen units: `fmtF` for a temperature, `fmtSet` for the oven's set point, `stepLabel`
for the buttons. A button in the top bar and the `U` key switch between °F and °C, and the choice is saved with the language and the sound (`preferences.v1`). In Fahrenheit the oven moves by 25 F
between 125 F (OFF) and 1100 F, as the original; in Celsius by 10 C from where it is, between 50 C and 590 C. The model never sees the units.

Not taken from the package's `game/`: its `package.json` (a new one has the collection's scripts), `README.md`, `LICENSE` (the collection's full GPL v3 text) and `THIRD_PARTY_NOTICES.md`.
`HOW_TO_PLAY.md` is the package's, with the door, the score and the units added. All are kept, unmodified, in `package/game/`.
