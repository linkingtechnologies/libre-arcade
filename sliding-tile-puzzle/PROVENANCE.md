# Provenance

| Layer | Source | Exact revision | License | Treatment |
|---|---|---|---|---|
| Rules, shuffle algorithm, image geometry, background color, tile bevel | Sliding Tile Puzzle, one of three games in Jonathan Hulka's **Virtual Toybox Puzzle Collection 2010.08.11**, implemented by `SliderHandler.java` and `PuzzleCanvas.java` | `puzzlegames.jar`, 7,230,213 bytes, SHA-256 `6d513d9a07c700a16663e0e0fd4678bae8bce7bd38eeffcbe4c7e33398d6cb27` | GPL-3.0-or-later (verified in the class headers, see below) | Reimplementation in JavaScript (`src/game.js`), function by function; the mapping is in `specs/port-map.md` |
| Original source, an earlier snapshot | `puzzles20100726.zip` | 2,723,158 bytes, SHA-256 `9af3130acab786b189fb784c5c189c4ddb4c5a932b993db185da9a00e8924818` | GPL-3.0-or-later | Preserved unchanged, three weeks older than the jar above |
| Original source, a later tree | `libre-jig-master.zip`, internal file dates through 2012-03-04 | 7,280,538 bytes, SHA-256 `05a17599b365fac24ec3bb77c4123f44a96d527b06d4eaec8ea7206c7d6aefc3` | GPL-3.0-or-later | Preserved unchanged. Contains the jigsaw line's later evolution, not this game's; kept because it shipped alongside the other two archives |
| Ten photographs and their thumbnails | the jar's `pics/` directory | — | CC BY-SA 3.0 US (JS Nature Photos) | Extracted unchanged into `public/assets/photos/`; verified byte-identical below |
| Browser adaptation: DOM interface, English/Italian strings, keyboard accessibility, the classic-script bundle | this repository (2026) | — | GPL-3.0-or-later | New work |

## The same three archives as Libre Jigsaw

This game and [`../libre-jigsaw/`](../libre-jigsaw/) preserve the identical three files: same names, same byte counts, same SHA-256. Both are correct: `puzzlegames.jar` is the 2010.08.11 release of the whole Virtual Toybox Puzzle Collection, which bundled all three of its games (jigsaw, sliding tile, and the spinning-hex game named in `specs/LINEAGE.md` in the sibling project) in one archive, so a game that comes from that collection legitimately needs the whole thing. Each game folder in this collection is independent (per the root `AGENTS.md`), so each keeps its own copy rather than pointing at the other's `reference/`; the cost is roughly 19 MB duplicated on disk.

## The license, and what kind of evidence we have

The evidence is the same as for Libre Jigsaw and comes from the same jar: the header of `SliderHandler.java`, read directly, states "GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version." Checked again for this game specifically, since a license grant applies to the file it is written in, not to the archive as a whole.

## What was checked independently, when the game joined the collection

- **The GPL "or later" header** in `SliderHandler.java`, read directly inside `puzzlegames.jar`.
- **The three archives' checksums**, against `reference/SHA256SUMS.txt`: all match, and are the same three already verified for Libre Jigsaw.
- **The shuffle algorithm, executed.** `test/PrintSliderMix.java` loads the real `SliderHandler` class straight out of `puzzlegames.jar` and uses reflection to set its private `random`, `tileCount`, `tilesAcross` and `missingTile` fields and invoke its private `mix()` method directly, no recompilation of the original class needed. Compiled with `javac --release 8` and run under Java 1.8.0_503, it reproduced the JavaScript port's output exactly across all 9 scenarios (3 grid sizes x 3 seeds), using the same Java `java.util.Random` bit sequence on both sides. This is the collection's strongest evidence tier: the actual original code, still executable, checked directly, not from a stored log someone else produced.
- **The directional-bias bug, read in source.** `SliderHandler.java` line 143/150 reads `random.nextInt(1)*2 - 1`. `Random.nextInt(1)` can only return 0, so this expression is always `-1`; the port's `randomInt(rng, 1) * 2 - 1` reproduces the same always-`-1` behavior rather than the presumably-intended coin flip. Confirmed both by reading the line directly and by the shuffle oracle match above, which would not hold across 9 independent scenarios if this one expression diverged.
- **The background color formula, executed.** `test/PrintBackgroundColors.java` calls the real `java.awt.Color.RGBtoHSB()`/`getHSBColor()` with the same rotate-hue-180°-full-saturation formula read directly in `PuzzleCanvas.setMeanColor()`. All 11 recorded mean colors (the 10 photos' values from `pics.xml`, plus the neutral default) match the JavaScript port exactly.
- **The 10 mean RGB values themselves**, read directly in the jar's own `pics.xml`, matching what the delivered test used rather than trusting it.
- **The ten photographs and their ten thumbnails**, all twenty files, byte for byte against `puzzlegames.jar`'s `pics/` directory. All twenty matched, and are the same files already verified for Libre Jigsaw (the two games share the same historical gallery).
- **The centered-square-in-rectangular-photo behavior**, confirmed live in the browser: selecting a landscape photograph left visible strips of the original image outside the puzzle's square region, on both sides.
- **The test suite**: all 5 delivered checks pass after being moved off a live Java dependency (below), plus 3 new ones.

## What changed for `npm test`

The delivered `mix-parity.cjs` and `background-parity.cjs` compiled and ran the two Java harnesses live, on every test run, which makes `npm test` depend on a JDK being installed, unlike every other Node-based game in this collection. Both harnesses were run here, confirmed against the real jar as described above, and their output stored in `test/fixtures/mix-oracle.json` and `test/fixtures/background-oracle.json`. `npm test` now compares the JavaScript port against those stored fixtures; regenerating them by re-running the two `.java` harnesses (still preserved in `test/`) is documented in `AGENTS.md` for whenever `src/game.js`'s shuffle or color math changes.

## What was not verified

- That the preserved archives are byte-identical to whatever a canonical upstream host might offer today. No canonical repository is named in the delivered documents for this specific game; see Libre Jigsaw's `PROVENANCE.md` for the Launchpad PPA found for the sibling jigsaw project, which likely covers this game too since they shipped in the same collection, but that was not re-confirmed here.
- The tile bevel (`PuzzleCanvas.buildTileImage()`'s one-pixel highlight/shadow) pixel by pixel. The general construction was confirmed to exist in source; the exact pixel math was not independently re-derived.
- A screen-reader spot check and real touch-device testing.

## What was not ported, and why

- **No timer, score, move counter or hints.** None are part of the recovered 2010 behavior; none were added.
- **The other two Virtual Toybox games.** Only Sliding Tile Puzzle is in this repository; Libre Jigsaw is a separate restoration in this same collection, and Spinning Tile Puzzle, the third game, is not yet restored.
