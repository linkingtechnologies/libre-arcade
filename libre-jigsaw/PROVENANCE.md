# Provenance

| Layer | Source | Exact revision | License | Treatment |
|---|---|---|---|---|
| Square and hexagonal cut geometry, snapping, layers, save format, completion | **Virtual Toybox Puzzle Collection** and its later evolution **Libre Jigsaw**, by Jonathan Hulka | two generations, see below | GPL-3.0-or-later (verified in the Java source headers of both) | Reimplementation in JavaScript (`src/*.js`), function by function; the mapping is in `specs/port-map.md` |
| Earlier generation: 2010 square cutter (`SquareJigsawManager.buildEdge`), 2010 hex cutter, three-layer/multi-select model | `puzzlegames.jar`, internal file date 2010-08-11 | 7,230,213 bytes, SHA-256 `6d513d9a07c700a16663e0e0fd4678bae8bce7bd38eeffcbe4c7e33398d6cb27` | GPL-3.0-or-later | Preserved unchanged in `reference/`. Ships both `.java` sources and compiled `.class` files, which is what let the layout oracle below run against real bytecode |
| Same generation, an earlier source snapshot | `puzzles20100726.zip` | 2,723,158 bytes, SHA-256 `9af3130acab786b189fb784c5c189c4ddb4c5a932b993db185da9a00e8924818` | GPL-3.0-or-later | Preserved unchanged, three weeks older than the JAR above |
| Later generation: `JigsawCutter`-based square and hex cutters, `finishGame()` completion, the 2011-02-08 snap-policy change | `libre-jig-master.zip`, internal file dates through 2012-03-04 | 7,280,538 bytes, SHA-256 `05a17599b365fac24ec3bb77c4123f44a96d527b06d4eaec8ea7206c7d6aefc3` | GPL-3.0-or-later | Preserved unchanged. Its own `src/changelog` is dated day by day back to 2010-08-11 |
| Ten photographs and their thumbnails | the 2010 JAR's `pics/` directory | — | CC BY-SA 3.0 US (JS Nature Photos) | Extracted unchanged into `public/assets/photos/`; verified byte-identical below |
| Browser adaptation: DOM interface, English/Italian strings, touch-equivalent area selector, browser-native `.ljf` JSON, the classic-script bundle | this repository (2026) | — | GPL-3.0-or-later | New work |

## The license, and what kind of evidence we have

Both generations carry the same header, read directly in the preserved sources: "GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version." Checked in `hulka/tilemanager/SquareJigsawManager.java` inside `puzzlegames.jar` (2010) and in `hulka/tilemanager/JigsawCutter.java` inside `libre-jig-master.zip` (2011-2012). This is the strongest evidence the collection recognizes: the author's own statement inside the work, present in both generations three years apart.

## What was checked independently, when the game joined the collection

- **The GPL "or later" header**, quoted above, in both archives.
- **The three preserved archives' checksums**, against `reference/SHA256SUMS.txt`: all three match. A Node script, `test/reference-integrity.mjs`, now keeps this check running as part of `npm test` rather than as a one-off.
- **The historical layout oracle, executed.** `test/Print2010Layout.java` calls the real `SquareTileManager.getBestFit`, `HexTileManager.getBestFit`, `SquareJigsawManager` and `HexJigsawManager` straight out of `puzzlegames.jar`. Compiled with `javac --release 8` and run under Java 1.8.0_503, it reproduced all 32 recorded scenarios in `test/oracle-layout-2010.csv` exactly, across four board sizes and four piece counts, for both square and hex cuts. This is the collection's strongest evidence tier: the actual original code, still executable, checked against a fresh run rather than trusted from a stored log.
- **The square-cutter tuning constants**, read directly in both generations: 2010's `SquareJigsawManager.java` has `bubbleMinFactor=0.30`, `bubbleMaxFactor=0.40`, `bubbleStemFactor=0.30`, `controlPointVarianceFactor=0.10`, `cornerVarianceFactor=0.20`; the later `JigsawCutter`-based `SquareJigsawManager.java` has `0.30 / 0.40 / — / 0.05 / 0.12`, the stem factor gone and the two variance factors roughly halved. Exactly what `specs/GEOMETRY_2010_2012.md` (in `test/`) reports.
- **The hex-cutter tuning constants**, read in the 2010 `HexJigsawManager.java`: `0.20 / 0.25 / 0.05 / 0.10`, matching the "historically equivalent" claim in `specs/ARCHAEOLOGY.md`.
- **The 2011-02-08 snap-policy change**, read in `libre-jig-master.zip`'s own `src/changelog`: "2011 02 08 - Jon ... JigsawHandler: Changed tile snap algorithm: Positions are now adjusted to the largest on-board connected group." Quoted exactly, with the surrounding dated entries confirming it is the most recent change as of that archive ("New changes above this line").
- **The ten photographs and their ten thumbnails**, all twenty files, byte for byte against the copies inside `puzzlegames.jar`'s `pics/` directory. All twenty matched.
- **The upstream project's continued existence**, on a channel the delivered documents do not mention: a Launchpad PPA, `ppa:jon-hulka/libre-jigsaw` (fetched 27 September 2026), whose package `libre-jigsaw` is versioned `2012.09.09` and was uploaded 3 February 2013. The delivered `specs/ARCHAEOLOGY.md` says the preserved source tree's internal metadata "continues into March 2012"; the PPA's package version suggests the project was still being packaged in September 2012, six months later. Nothing was downloaded from the PPA and its version string is not proof of a specific release date, only of packaging activity naming that date; it is offered as corroboration, not as a fourth archive.
- **The test suite**: all 12 delivered smoke checks pass unchanged, now run together as `npm test` (`test/run-all.mjs`), plus the reference-integrity check above.
- **The bundle.** `public/app.bundle.js`, the classic script the page actually loads, regenerates byte for byte from `src/*.js` via `scripts/build-bundle.py` (moved from `test/`, where it was delivered, since it is a build step and not a check). Its one bug, corrupting the file's em dash under a non-UTF-8 default encoding on Windows, was in the script's own file I/O, not in the generated content; it is fixed.

## What was not verified

- That `puzzlegames.jar`, `puzzles20100726.zip` and `libre-jig-master.zip` are byte-identical to whatever a canonical upstream host might offer today. No canonical repository is named in the delivered documents; the Launchpad PPA found independently distributes compiled Ubuntu packages, not the matching source archives, so it could not be used to confirm them.
- Full manual play-through parity on a real device (`specs/PRODUCTION_CHECKLIST.md`, items still open there).
- A screen-reader spot check.

## What was not ported, and why

- **`Sliding Tile Puzzle` and `Spinning Tile Puzzle`**, the other two games in the original Virtual Toybox collection. Deliberately out of scope; see `specs/LINEAGE.md`.
- **The Java `.ljf` binary/text save format.** Detected and rejected with a clear message rather than misread. The browser format is a new, self-contained JSON with its own version field.
- **Java's `java.util.Random`.** The original constructs an unseeded generator per game; the port uses a seeded PRNG so its own tests can be exact, which is a restoration aid, not a reproduction of the original's number sequence.
