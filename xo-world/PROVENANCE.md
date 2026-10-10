# Provenance

XO World is a **ported** game: the rules and the computer player are a JavaScript port of the Java applet in `xoworld.java`, and everything the player sees (board drawing, input, languages, help) is new code. The original source is preserved unmodified in [`reference/javagames-1.0/`](reference/javagames-1.0/SOURCE.md); the function-level mapping and the evidence for each part are in [`specs/port-map.md`](specs/port-map.md).

| Layer | Source | Exact revision | Licence | Treatment |
|---|---|---|---|---|
| Game rules and computer player | `xoworld.java`, JavaGames 1.0, Milan Babuskov, "Copyright 2000-2007" | `javagames-1.0.tgz`, SHA-256 `259893181e230ce3cb006ea9dcd629cc16ba501d85e1a251ebb547a91056835d`, dated 7 February 2007; `xoworld.java` SHA-256 `58ab426a470dd1c5933a14098667d8fdc8c7b800100c4e2db3b69beaa304f762` | GPL-2.0-or-later | Preserved unmodified in `reference/javagames-1.0/`; ported to `src/xoworld-engine.js` and `src/game-model.js` |
| The eight XO World images (empty square, X, O, last move, win, lose, turn, new game) | same archive | same | not established | Not redistributed; each is listed with its SHA-256 in `reference/javagames-1.0/ARCHIVE_SHA256.txt`. The browser game draws its own |
| Browser interface (Canvas drawing, mouse, touch and keyboard input, English and Italian text, help and credits dialog), build tool, tests | the restoration package delivered for Libre Arcade, integrated here | package 1.0.0-rc.1 (its own milestone label M8) | GPL-3.0-or-later | New code. The engine and model sources inside it are byte-identical to the ones the package recorded as certified (checked by `test/bundle.test.js`) |
| Java oracle (harness, driver, recorded transcript) | this repository | | GPL-3.0-or-later | New code, see below |

## Licence: GPL-3.0-or-later, read from the source header

The header of `xoworld.java` (lines 1 to 19) says the file is part of JavaGames and may be redistributed under "version 2 of the License, or (at your option) any later version" of the GNU General Public License. That is the evidence: a licence header read in the source of a SHA-256-verified archive, not a licence file alone and not a distributor's summary. It allows the port to be offered under GPL version 3 or later.

The restoration package declared its licence as "GNU General Public License, version 3" with no "or later". This integration states **GPL-3.0-or-later** (as `package.json` and the notices do), the same choice the collection makes for its other ports of GPL-2.0-or-later sources. If you would rather offer the port as GPL-3.0-only, the upstream grant allows that too; change `package.json` and `THIRD_PARTY_NOTICES.md` together.

The archive's `README` says only that the games are released "under GPL license" and points to `COPYING`, which is the GPL version 2 text of 1991. The "or later" wording comes from the header, not from there.

## What was checked independently

- **The original source.** The archive was found next to the package; its SHA-256 equals the one the package's `docs/development/behavioral-oracle-m2.md` gives for its baseline. `reference/javagames-1.0/CHECKSUMS.txt` and `ARCHIVE_SHA256.txt` record the preserved files and all 63 files of the archive; `test/package-contract.test.js` re-checks them.
- **The original was run, not only read.** `xoworld.java` was compiled unmodified and driven through its own `mouseUp()` and `igraj()` by `tools/java-oracle.js`. The 22 expected moves of the package's behavioural oracle were each re-derived from the original and agree. Then 2,000 seeded games (27,287 clicks, 5,690 of them answered by the original's random fallback) were played against the original and the port in lockstep, with every reply, board, move counter and game status compared. The recorded transcript exercises every line and 98.9% of the branches of the ported engine. The same lockstep run also agrees on Java 21 and on the compiled `xoworld.class` of 2007 (300 games each). The details and the limits are in [`specs/port-map.md`](specs/port-map.md).
- **The engine is the one the package certified.** `src/xoworld-engine.js` and `src/game-model.js` have the SHA-256 values the package recorded at its third milestone, and the committed browser bundle is exactly what `tools/build-browser.js` builds from them.

## What the package claimed that could not be checked

The package's documents refer to files that were not in it: `qa/XOM2OracleHarness.java`, `results/m2-oracle-run.txt` and `historical-bugs.md`. Its 22 expected values therefore had to be taken on trust until the original was run here, which is why the oracle above was built. The captured logs in `docs/development/results/` come from the packaging environment (paths such as `/mnt/data`) and are kept unmodified as history, not as evidence for this integration. The package also said that real-browser screenshots could not be taken in its environment; they were taken here (see `screenshots/`).
