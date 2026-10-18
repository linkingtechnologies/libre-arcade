# The software archaeology behind Turkey Cooking Simulator

This is the recovery story of this one game. The philosophy shared by every game in the collection (preserve the reasoning and not just the artifact, verify by execution rather than resemblance, record the evidence and its limits) is in the root [`SOFTWARE_ARCHAEOLOGY.md`](../SOFTWARE_ARCHAEOLOGY.md); the facts of this game are in [`PROVENANCE.md`](PROVENANCE.md), [`reference/SOURCE.md`](reference/SOURCE.md) and [`specs/port-map.md`](specs/port-map.md).

## A game that was still changing when its commit was taken

The original is a game-jam entry whose repository is named `game-off-2013`. Its history is dense on the last day: more than thirty commits on 1 December 2013, from the morning to 23:25, then a handful of changes over the following years and a rewrite of the door mechanics in 2022. A restoration has to choose one of those states and say which. The package chose the earliest of the day, commit `56bcde6` (06:50), whose thermal model is an analytic series for a sphere. By the evening that model had been replaced by a finite-difference scheme with other constants, and the cook ranges, the score and the oven door had been changed. The package's notes call the baseline "historical" and the port "faithful" and never mention the rest of the day. It was exact about the morning.

That was the first finding, and it came from the one step the package had not taken: cloning the repository and reading what comes after the commit it names. The game here follows the last commit of the day, `13afa12`.

## What the package had

A restoration package, `turkey-cooking-simulator-complete-rc1.zip`: a JavaScript port with a new page (a canvas drawn procedurally, English and Italian, saving, touch), twelve milestone reports with behavioural-oracle descriptions (summarised in `docs/development/MILESTONES.md`), test scripts and recorded results, and a reference folder with the baseline's blob IDs but none of its files. Its tests compare the port with `legacy-reference.js`, a hand transcription of the original `model.js` made by the package's authors, and with fixtures that script generated. They never ran the original, so what they check is the port's agreement with its authors' reading, which is Level 3 of the collection's hierarchy.

The original's thermal model is plain JavaScript, so a stronger check was available: run it. `reference/original/js/model.js` is the file as the repository has it (its git blob ID is the one recorded). It needs one global, one stub and a `console`, and it can be driven second by second next to the port.

## The oracle, twice

The first oracle was against the package's own baseline: the analytic model of `56bcde6` next to the package's port. It found no difference, so the package had done what it said, for the commit it named (`test/package-baseline-oracle.test.mjs` keeps a short version of it).

Then the game was moved to `13afa12`. The new `thermal-model.js` was written from the original's `model.js` keeping its order of arithmetic, and `test/model-oracle.test.mjs` ticks both with the same oven settings and compares the layers' temperatures, highest temperatures and cook conditions exactly after every second, together with the oven's air temperature, for ten turkeys and eleven schedules. Two practical points: the original's file is run as a sloppy-mode function body, not inside a `vm` context (global lookups there are about forty times slower), and the oven's door, which the original handles in `ui.js` by calling `setRawTemp` from outside the model, is driven from outside in the test too. It found no difference. The new model is also much cheaper than the old one (a few microseconds a tick, against milliseconds for the series with its three thousand roots), so the whole oracle runs in ten seconds.

## What else the comparison found

- **The score, the door and the death moved with the model.** The authors changed `screens.js` and `ui.js` the same day: a raw skin costs 1,000, the core has a table of its own (the package scored it with the skin's, a quirk it had preserved on purpose, which the authors fixed at 22:21), the skin counts by its highest temperature, the open door cools the oven. These were ported; the house-fire screen was not.
- **The package's own recorded oracle differs in the last digit.** Its M1 test compares a cook-condition fraction exactly against a number its authors' machine produced, and fails here, on the package's own layout, by one unit in the last place. The original and the package's port, run in one process, agree with each other. Between engines the same effect shows at 6e-14 in a water-lost accumulator.
- **One of the package's tests no longer passes on its own README.** M12's R17 and R18 look for text the README lost after the results were recorded as 18/18.
- **The package's copy of the original README is not the original.** It has the same text with links stripped and a section removed; the files kept here are the original's.
- **The market is deterministic.** The original draws five turkey weights at random; the port offers 10.10, 12.20, 14.30, 16.40 and 18.50 lb.
- **The package's replay of an action log does not put the ticks where the page did**, because the page adjusts the clock itself at two points that the log does not record.

## Celsius

The original shows Fahrenheit only. The units were added to the page, not to the model: the page keeps Fahrenheit set points and writes temperatures in the chosen unit, and in Celsius the oven moves by 10 °C from where it is. `docs/development/CHANGES.md` lists the lines.

## What was not verified against the original

The scheduler and the door are in `ui.js`, which needs CreateJS and a browser, and were read, not run (the door has hand-worked numbers in `test/gameplay.test.mjs` and a browser game replayed on the original). The score screen and the market were run: `screens.js` and the market statements of `main.js` execute under stubs for the browser pieces, and the port agrees with them (`test/original-screens.test.mjs`). The pictures and the sounds are new and were not compared with anything. The original's credits screen was read in the clone: its sounds are public domain or CC0, and it says nothing about the artwork's licence.

## Where this leaves the game

Production-ready as a port of the version the authors left on the night of 1 December 2013, with its limits stated: the death screen is missing, the market's weights are fixed, and the page is the package's, with the layout problems listed in `PROVENANCE.md`.
