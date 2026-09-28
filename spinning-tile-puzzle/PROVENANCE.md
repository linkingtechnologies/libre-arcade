# Provenance

| Layer | Source | Exact revision | License | Treatment |
|---|---|---|---|---|
| Rules, geometry, shuffle, spin mechanics, background color | Spinning Tile Puzzle, one of three games in Jonathan Hulka's **Virtual Toybox Puzzle Collection 2010.08.11**, implemented by `SpinnerHandler.java` and `hulka/tilemanager/HexSpinnerManager.java` | `puzzlegames.jar`, 7,230,213 bytes, SHA-256 `6d513d9a07c700a16663e0e0fd4678bae8bce7bd38eeffcbe4c7e33398d6cb27` | GPL-3.0-or-later (verified in the class headers, see below) | Reimplementation in JavaScript (`src/game.js`), function by function; the mapping is in `specs/port-map.md` |
| Original source, an earlier snapshot | `puzzles20100726.zip` | 2,723,158 bytes, SHA-256 `9af3130acab786b189fb784c5c189c4ddb4c5a932b993db185da9a00e8924818` | GPL-3.0-or-later | Preserved unchanged, three weeks older than the jar above |
| Original source, a later tree | `libre-jig-master.zip`, internal file dates through 2012-03-04 | 7,280,538 bytes, SHA-256 `05a17599b365fac24ec3bb77c4123f44a96d527b06d4eaec8ea7206c7d6aefc3` | GPL-3.0-or-later | Preserved unchanged. Contains the jigsaw line's later evolution, not this game's; kept because it shipped alongside the other two archives |
| Ten photographs and their thumbnails | the jar's `pics/` directory | — | CC BY-SA 3.0 US (JS Nature Photos) | Extracted unchanged into `public/assets/photos/`; verified byte-identical below |
| Clockwise/counter-clockwise rotation cursor artwork | the jar's `images/cwcursor.png` and `images/ccwcursor.png` | — | GPL-3.0-or-later (part of the original program) | Extracted unchanged into `public/assets/icons/`; verified byte-identical below |
| Browser adaptation: DOM interface, English/Italian strings, keyboard accessibility, the classic-script bundle | this repository (2026) | — | GPL-3.0-or-later | New work |

## The third and last Virtual Toybox game

Libre Jigsaw's own `specs/LINEAGE.md` names this game as the third piece of Jonathan Hulka's Virtual Toybox Puzzle Collection, alongside Libre Jigsaw and Sliding Tile Puzzle, both already in this collection. All three share the identical three preserved archives (same names, same byte counts, same SHA-256), because `puzzlegames.jar` bundles the whole 2010.08.11 release, not one game at a time. Each game folder here keeps its own copy, per the root `AGENTS.md`'s independence rule, at the usual cost of roughly 19 MB duplicated three times over.

## The license, and what kind of evidence we have

The same evidence class as its two siblings, from the same jar: the header of `SpinnerHandler.java`, read directly, states "GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version."

## What was checked independently, when the game joined the collection

- **The GPL "or later" header** in `SpinnerHandler.java`, read directly inside `puzzlegames.jar`.
- **The three archives' checksums**, against `reference/SHA256SUMS.txt`: all match, and are the same three already verified for Libre Jigsaw and Sliding Tile Puzzle.
- **The geometry, executed.** `test/PrintSpinnerOracle.java` (mode `geom`) constructs the real `HexSpinnerManager` from `puzzlegames.jar` and prints its tile-count, spacing and offset descriptors, plus every tile and vertex position. Compiled with `javac --release 8` and run under Java 1.8.0_503, it reproduced the JavaScript port's output exactly across 4 board sizes: the descriptor, all 7 tile positions and all 6 vertex positions matched in every case.
- **The shuffle, executed.** `test/PrintSpinnerOracle.java` (mode `mix`) loads the real `SpinnerHandler` class and reaches its private `random` field and private `mix()` method through reflection, the same technique used for Sliding Tile Puzzle. Run against 3 seeds, it matched the port's output exactly. A useful side finding: `mix()` never reads board width or height, only tile count, so its result is identical across every board size; this was confirmed by running it at all four board sizes per seed and getting the same answer each time, and only one board size per seed needed to be kept in the stored fixture.
- **The spin mechanics, executed.** `test/PrintSpinnerOracle.java` (mode `spin`) calls the real `HexSpinnerManager.spin()` directly (a public method, no reflection needed) for every one of the 6 vertices in both directions, starting from the solved state. All 12 scenarios matched the port's resulting tile arrangement and its list of changed tile indices exactly.
- **The invalid-vertex quirk, read in source.** `SpinnerHandler.mix()` shuffles an array of 7 indices (0 through 6) and calls `spin()` on each one, but `HexSpinnerManager.spin()` guards itself with `if(flatIndex>=0&&flatIndex<6)`, so index 6 is silently a no-op roughly one time in seven per pass. Confirmed directly in both classes' source, and confirmed indirectly by the shuffle oracle match above, which depends on the port reproducing exactly this rate of wasted attempts.
- **The ten photographs, their ten thumbnails, and the two cursor icons**: 22 files total, byte for byte against `puzzlegames.jar`'s `pics/` and `images/` directories. All 22 matched; the photographs and thumbnails are the same files already verified for Libre Jigsaw and Sliding Tile Puzzle, and the two cursor icons are new to this game.
- **144,000 spins**, 600 sessions of 120 random spins each followed by their exact reverse, every one restoring the solved state, checked in `test/spin-stress.cjs`.
- **The test suite**: all 5 delivered checks pass after being moved off a live Java dependency (below), plus 2 new ones.

## What changed for `npm test`

The delivered `spinner-parity.cjs` compiled and ran the Java oracle live, on every test run, the same issue found in the two sibling games. It was run here, confirmed against the real jar as described above, and its output stored in `test/fixtures/geometry-oracle.json`, `mix-oracle.json` and `spin-oracle.json`. `npm test` now compares the JavaScript port against those stored fixtures; regenerating them by re-running `test/PrintSpinnerOracle.java` (still preserved in `test/`) is documented in `AGENTS.md`.

## What was not verified

- That the preserved archives are byte-identical to whatever a canonical upstream host might offer today; see Libre Jigsaw's `PROVENANCE.md` for the Launchpad PPA found for that sibling project, which was not re-confirmed to cover this game specifically.
- A screen-reader spot check and real touch-device testing.

## What was not ported, and why

- **No timer, score, move counter, hints or save/load.** None are part of the recovered 2010 behavior.
- **The other two Virtual Toybox games**, both already restored separately in this collection: Libre Jigsaw and Sliding Tile Puzzle.
