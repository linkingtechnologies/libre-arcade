# Provenance

Bomber is a **ported** game: the rules, the random generator and the sound data are a JavaScript port of the Java ME game in `GameCanvasBomber.java`, and the drawing, input, languages and dialogs are new code. The original source is preserved unmodified in [`reference/bomber-1.0/`](reference/bomber-1.0/SOURCE.md); the mapping and the evidence are in [`specs/port-map.md`](specs/port-map.md).

| Layer | Source | Exact revision | Licence | Treatment |
|---|---|---|---|---|
| Game rules, city generation, sounds | `GameCanvasBomber.java` and `Bomber.java`, Juan Jose Luna Espinosa, "Copyright (C) 2007" | `Bomber.zip`, SHA-256 `274c78e5b4060aaab52b6fc336fc16245566b9c0b66bde7532e0738f3840e560`; `GameCanvasBomber.java` SHA-256 `042eb5438630a5777b0a239e2e7dd2ee2346a838c2c139351b2ad19dd3bf3bf7` | GPL-3.0-only | Preserved unmodified; ported to `public/src/game-state.js`, `rng.js` and `audio.js` |
| The four PNG resources (plane, bomb, buildings, loading screen) | same archive | same | not established | Not redistributed; listed with their SHA-256 in `reference/bomber-1.0/ARCHIVE_SHA256.txt`. The browser game draws its own |
| Compiled `Bomber.jar` and `.class` files | same archive | same | the source's | Not redistributed |
| Browser interface (Canvas drawing, keyboard, pointer and touch input, English and Italian text, credits dialog, Web Audio) | the restoration package delivered for Libre Arcade, integrated here | package "Initial Libre Arcade release" | GPL-3.0-only | New code, a derivative of the original's rules, so it cannot claim a wider licence |
| Java oracle (harness, MIDP stand-ins, driver, recorded transcript) | this repository | | GPL-3.0-only | New code, see below |

## Licence: GPL-3.0-only, read from the source header

The headers of both Java files say the program may be redistributed under "the Free Software Foundation, version 3 of the License". They do not add "or (at your option) any later version", and `test/production.test.mjs` checks that they do not. So the licence stays GPL-3.0-only, as the restoration package also said. The evidence is a licence header read in the preserved source, not a licence file alone and not a summary.

**A label that disagrees.** The SourceForge project page that published the archive lists the licence as "GNU General Public License version 2.0 (GPLv2)". The files say version 3, in both headers and in the `GPL.txt` that ships with them. The licence the author wrote into the source is the grant that binds the code, and the project label may be a default chosen when the project was registered; this record follows the files. If it matters to you, the author is the one who can say which was meant.

## What was checked independently

- **The original source.** The package's `reference/Bomber.zip` is byte for byte the file SourceForge serves as `Bomber.zip` (downloaded on 11 October 2026, 33,120 bytes, SHA-256 `274c78e5b4060aaab52b6fc336fc16245566b9c0b66bde7532e0738f3840e560`, the value the package's own notes give). Its source files are preserved unmodified with checksums; the compiled jar, classes and the PNG resources are not.
- **The original loop was run, not only read.** `GameCanvasBomber.java` is compiled unmodified, with stand-ins for the MIDP classes and a local `Thread` class that makes its sleeps virtual (`test/java-oracle/`), and its loop runs under seeded games. After every iteration the original's state (score, landings, plane and bomb, the city's heights, caps and colours, the plane frame), the tones it played and the milliseconds it waited are compared with the port's. 750,000 iterations were recorded: 1,540 games, 1,290 crashes, 93 landings (two in one game at most), 37,474 bomb impacts. The port agrees after every iteration.
- **The compiled original.** The archive's `classes/GameCanvasBomber.class` (18 December 2008) was run through the same oracle after redirecting its `java.lang.Thread` reference in memory: the same 750,000 iterations, the same totals, the port agrees after every one. So the binary of 18 December and the source of 21 December behave identically on this sample. The class is not redistributed here; how to repeat the run is in [`specs/port-map.md`](specs/port-map.md).
- **The random generator.** `rng.js` reproduces `java.util.Random.nextInt` for 7 seeds and 1,000 bounds each (1 to 100, all powers of two among them).
- **Coverage.** The recorded transcript exercises 99.2% of the lines and 86% of the branches of `game-state.js` and every line of `rng.js` (`node --test --experimental-test-coverage test/java-oracle.test.mjs`).
- **What a landing needs.** From the original's own traces (138 landings in 80 further seeded games): a landing happened only when every one of the first 25 buildings had been levelled to zero or below, which is what its collision test implies at the last column. Building heights can also go to -1, because the original's impact loop does not re-check the height; the port keeps that.

## What the package claimed that could not be checked

The package's behavioural notes (`docs/development/behavioral-oracle.md`) list the original's rules in prose and its single test checks the port against them, not against the original. The target screen "240×320" is the package's inference: the SourceForge page says only that the game was "tested on Nokia 6234 mobile phone", and the original reads the size of whatever device runs it and uses it only to fill the background and place the title text.

## The SourceForge page

The package said the archive was the SourceForge release 1.0. The project page (<https://sourceforge.net/projects/bomberj2me/>, read on 11 October 2026) supports it: the project is called "Bomber", was registered on 2008-12-21 and is "Brought to you by: yomboprime"; its Files page lists `Bomber.zip`, 33.1 kB, released 2008-12-22 21:11:50 UTC, under a path that reads "Bomber 1.0". The package's zip is 33,120 bytes and its newest entry is from 21 December 2008. The page gives no checksum, so the file was downloaded and compared: it is byte for byte identical to the package's zip. The Bomber page does not give the account's real name, but other pages of the same account do. Two other SourceForge projects of the same account confirm that `yomboprime` is Juan José Luna Espinosa: the Files page of Colorator ("Brought to you by: yomboprime") shows a `README.txt` that reads "Copyright (C) 2010 Juan Jose Luna Espinosa", and the discussion forum of Batiscafo (also "Brought to you by: yomboprime") has a post, "version 1.0" of 18 January 2014, whose author is displayed as "Juan José Luna Espinosa" with a profile link to `yomboprime`. Both pages were read on 11 October 2026. The page's description also calls the game "based on a Spectrum 48k classic original game".
