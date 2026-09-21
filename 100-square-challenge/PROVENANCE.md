# Provenance

| Layer | Source | Exact revision | License | Treatment |
|---|---|---|---|---|
| Rules and behavior of the puzzle | 100-Square Challenge inside TAJJAVA v0.1 by Jasen Borisov (SourceForge project `tajjava`, owner `tajjada`) | `TAJJAVA.jar`, 10,089 bytes, SHA-256 `88c883fb76e6535eeceb5b627c4bbe6ec56237551e06609715de11f6cc542842`, class files dated 17 and 18 March 2011 | AGPL-3.0-or-later (verified in the source headers, see below) | Clean reimplementation in JavaScript (`public/src/`), **not** a copy of the Java; behavior checked against the original classes (`specs/port-map.md`) |
| Original Java source and release documents | same release | `src.zip` (8,028 bytes, SHA-256 `c93294370d68e91e452f90201e5ea4dc94d506a2cc74703795dc990b87ba8548`), `README.txt` and `HELP.txt` (Russian and English) | AGPL-3.0-or-later | Preserved unchanged in `reference/tajjava-v0.1/` |
| Later, incomplete snapshot | SourceForge project `squarechallenge`, code snapshot `81e4fa396daf8dfd93ffe4bd1628e04adc79ac44` | 9,154 bytes, SHA-256 `cd7ce175d46073eed98be272e5a0e2033fe0fe2f2752e3e53a052ff4d24b01a3`; six Java files dated 28 May 2011 | GPL-3.0-or-later (headers) | Preserved unchanged in `reference/squarechallenge-incomplete/`, for genealogical comparison only. It holds a menu and configuration shell, not the game engine, and the port does not derive from it |
| Oracle log | Observations of the original JAR from the audit that preceded the port | `test/fixtures/oracle_original_jar.txt` (15 scenarios) | measurements of the original | Used by the tests and independently re-run when the game was integrated (below) |
| Witness paths | Mathematical analysis, not the Java game | `test/fixtures/hamiltonian_witnesses.csv` (15 complete 100-square paths, one for each start-square symmetry class) and `blocked_path.csv` (a valid 24-square path that runs out of moves) | this repository | Test fixtures only; the game never uses them as hints |
| Browser adaptation: logic, DOM UI, English/Italian strings, optional Web Audio tones, first-play dialog | this repository (2026) | — | AGPL-3.0-or-later | New work |

`specs/PROVENANCE.md` is the delivered scope note and is kept as written. In particular it records that the URL of each individual archive was not supplied, so the SourceForge project pages are context and not verified download URLs.

## The license, and what kind of evidence we have

The original code is the GNU Affero General Public License **version 3 or, at the recipient's option, any later version**. This was checked directly in the preserved source: each of the 6 Java files in `src.zip` carries the AGPL header with the wording "either version 3 of the License, or (at your option) any later version". The archive's own `README.txt` says only "GNU Affero General Public License" without a version, so the headers are the evidence for the version. The later snapshot's 6 Java files carry the same wording for the ordinary GPL (version 3 or later), which is why the two projects are kept apart: the GPL header of the snapshot does not relicense the AGPL original, and the port follows the AGPL one.

### Why the adaptation is AGPL

The rest of the collection ships its own ported code as GPL-3.0-or-later. This game keeps the license it was delivered with, AGPL-3.0-or-later, which is the license of the original it adapts. AGPL-3.0 and GPL-3.0 code can be combined and distributed in the same collection, and the collection's root `README.md` says so for this folder. The AGPL's network clause asks that users interacting with the program over a network can get its corresponding source: the deployed page ships readable, unminified modules, the complete AGPL text (`public/licenses/AGPL-3.0.txt`) and `public/SOURCE.md`, and links to them from its Credits dialog. Keep those in `public/` if the game is deployed on its own.

## What was checked independently

- **The license headers**, as above (12 Java files read).
- **The SourceForge project pages**, fetched on 21 September 2026. `tajjava`: "This project is now inactive. It has been split into separate projects for each of the games", license "Affero GNU Public License", owner `tajjada`, created 27 February 2011, last updated 21 May 2013, one downloadable file, `TAJJAVA.jar`, 10.1 kB (consistent with the 10,089 bytes preserved here). It names the separate projects Logisticks, korab2J, TeleMaze, 100-Square Challenge and libTAJJADA. `squarechallenge`: "a single-player puzzle game, where the goal is to fill a grid with numbers by moving in 'L' shapes", license GPLv3, registered 15 May 2011, last update 21 May 2013, status "Planning", no downloadable releases, source only. A page fetch is a snapshot and does not show what the projects contain today beyond what those pages state.
- **The original's behavior.** The original classes from `TAJJAVA.jar` were run headless under Java 1.8.0_503, driving the real `Square.mouseClicked` and `GameSessionPanel.actionPerformed` code paths with the harness in `tools/oracle/`. All 15 scenarios T01 to T15 gave exactly the states recorded in `test/fixtures/oracle_original_jar.txt`, including the four defects the browser version corrects. This re-run is stored in `tools/oracle/rerun-output.txt`.
- **The reading of the source** agrees with those observations: the Undo button guards itself with `plsq != lastsq`, a comparison of object references, and `Square.mouseClicked` starts with `if (gended) reset()`.
- **The checksums** of the five preserved reference files (`SHA256SUMS.txt`) matched, and the delivered Node tests (13) pass unchanged in the new layout.

## What was not re-verified

- That the preserved `TAJJAVA.jar` is byte-identical to the file offered on SourceForge. The page shows its size only, and the individual download URL was never supplied.
- The other projects the `tajjava` page names (Logisticks, korab2J, TeleMaze, libTAJJADA). Nothing here depends on them.
- The two Python browser tests: `test/browser_smoke.py` needs Playwright and Chromium, which were not available (`test/http_smoke.py` was run and passes).
- Real audio output. The sound tests use a deterministic Web Audio double; nothing checks speakers.
- Anything on a physical phone or on the final hosted address (`specs/QA.md`).

## What was not ported, and why

- **The Russian interface.** The original ships English and Russian strings; the browser version offers English and Italian.
- **The Swing look and window handling.** Replaced by a responsive page with mouse, touch and keyboard.
- **The other games of the TAJJAVA project.** Only one was ever finished in v0.1.
- **Scoring, hints, levels, timer, random boards, solver.** The original has none; none were added.

## Open acceptance items

Publishing still needs one look on the deployed URL in a normal browser: first render, a valid move, Undo, New game, EN/IT, a phone view and the sound button with real audio (`specs/QA.md`).
