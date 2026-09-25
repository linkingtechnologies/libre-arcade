# Provenance

| Layer | Source | Exact revision | License | Treatment |
|---|---|---|---|---|
| Piece catalog: 27 shapes, their cells and the two rotation origins | `src/gameObjects/Shape.cpp` of OGLBricks 0.2 by Alexey Markarov (SourceForge project `oglbricks`, owner display name `argon-od`) | extracted into `specs/original-shapes.json` and `specs/original-spatial-contract.json` | MIT | Data extraction, transcribed into `public/js/shapes.js`; `test/site.test.mjs` and `test/engine.test.mjs` compare every shape and every quarter turn against the extraction |
| Rules: field, spawn search, rotation without wall kick, clearing, scoring, speed progression | `GameEngine.cpp`, `GameObject.cpp`, `Plane.cpp` of the same release | read during the M0.x audit; the formulas are quoted in `specs/AUDIT.md` | MIT | Reimplemented in `public/js/engine.js` |
| Original source and Windows archives | `oglbricks_src_0-1.7z`, `oglbricks_src_0-1-1.7z`, `oglbricks_src_0-2.7z`, `oglbricks_0-2.7z` | SHA-256 recorded in `reference/MANIFEST.sha256`, upstream locations in `reference/SOURCES.md` | MIT for the code; the Windows build also carries Qt 4 and Assimp | **Not in this repository**, by decision. See "Provenance by address, not by copy" below |
| Original 3DS models, icons, fonts and any original audio | the Windows archive | — | not established | Excluded. The web build draws with Canvas primitives and system fonts |
| Browser adaptation: interface, Canvas rendering, English and Italian strings, touch controls, JSON saves, seven synthesized Web Audio cues | this repository (2026) | — | GPL-3.0-or-later | New work. No sample from the original is used |

## The original, as the project itself states it

The SourceForge page for `oglbricks`, fetched on 25 September 2026, gives: title "OGLBricks", owner `argon-od`, license "MIT License", registered 25 January 2013, last updated 30 May 2013, development status Beta, written in C++ over Qt and OpenGL 1.1, interface in English and Russian, one downloadable file `oglbricks_0-2.7z` of 6.9 MB. Its own summary calls it a "Simple falling-blocks game" with a customizable field, shape options and save/load, needing no installation.

Note the two dates. The MIT notice preserved in `reference/OGLBricks-MIT-LICENSE.txt` reads "Copyright (c) 2012 Alexey Markarov", while the project was published in 2013. The 2012 is the author's copyright year for the code; 2013 is when the releases appeared, which is the year this collection indexes the game under.

## The license, and what kind of evidence we have

MIT, and the evidence here is weaker than this collection usually accepts, so it is worth being exact about it:

1. `reference/OGLBricks-MIT-LICENSE.txt` reproduces the upstream notice, naming Alexey Markarov and 2012.
2. The SourceForge project page states "MIT License" (fetched 25 September 2026, above).
3. The M0.x audit that preceded the port states that it verified `src/resources/license.txt` and the C++ headers inside the original archives.

Point 3 is the strongest kind of evidence, but it is somebody else's reading: the archives are not in this repository, so it could not be repeated here. Points 1 and 2 were checked directly. MIT carries no "or later" question, so the version ambiguity that this collection normally has to resolve does not arise.

The port itself is GPL-3.0-or-later, the collection default. MIT material can be carried into a GPL-3.0 work as long as the notice travels with it, which is why `THIRD_PARTY_NOTICES.md` keeps the attribution for the shape catalog specifically.

## Provenance by address, not by copy

Every other ported game here keeps a frozen copy of what it was ported from. This one keeps the address instead. `reference/` holds the MIT notice, `MANIFEST.sha256` with the SHA-256 of the four audited archives, and `SOURCES.md` with the upstream locations they came from. The archives themselves are deliberately not committed: the Windows build carries Qt 4 and Assimp runtime files and historical assets whose redistribution terms were never established, and the audit chose not to publish any of the four rather than sort them one at a time.

That leaves verification possible but not local. Anyone can fetch the files from the two SourceForge folders and check them against the manifest; nobody can re-derive `specs/original-shapes.json` from `Shape.cpp` without doing that first. The extraction is therefore trusted where, elsewhere in this collection, it would be reproducible from the repository alone.

Both upstream folders were checked on 25 September 2026 and hold exactly the four archives the manifest names, under the same names:

| Archive | Folder | Date | Size shown |
|---|---|---|---|
| `oglbricks_src_0-1.7z` | [`files/src/`](https://sourceforge.net/projects/oglbricks/files/src/) | 2013-01-25 | 1.1 MB |
| `oglbricks_src_0-1-1.7z` | `files/src/` | 2013-01-29 | 1.1 MB |
| `oglbricks_src_0-2.7z` | `files/src/` | 2013-02-14 | 1.4 MB |
| `oglbricks_0-2.7z` | [`files/win32/`](https://sourceforge.net/projects/oglbricks/files/win32/) | 2013-02-14 | 6.9 MB |

The `win32` folder also holds Windows builds of 0.1 and 0.1.1, dated the same days as their sources. Those dates are the release history: 0.1 on the day the project was registered, 0.1.1 four days later, 0.2 three weeks after that, and then nothing until the project's last update on 30 May 2013. Nothing was downloaded, so the recorded SHA-256 values remain unchecked against these files.

## What was checked independently, when the game joined the collection

- **The SourceForge project page and both file folders**, as quoted above and in the table below. They confirm the MIT license, the author, the three-release history with its dates, and they correct the "2012 game" shorthand the delivered documents use.
- **The tests**: 38 Node tests pass after the layout change, including the one that compares all 27 shapes and all four of their turn states against the source-derived spatial contract.
- **Ordinary HTTP delivery**, which the audit could never test: its Chromium refused to navigate to localhost, so every browser check from M2 to M6 injected the code into a blank page instead. Here `public/` was served over HTTP and the page was driven in a real headless Chrome at 1280 x 800 and in the pane at 375 x 812. All six files return 200 with the right content type, the game plays, the menu, settings and help dialogs open, the touch controls are present, and nothing scrolls the page in either axis.
- **Persistence at a real origin**, also listed as uncertified: after several minutes of play the tab was reloaded and the game came back with its board intact, from a single versioned key, `libre-arcade-oglbricks-save-m2`.
- **The defaults against the documented original**: the settings dialog opens on a 20 x 20 field, speed 1, automatic fall on, piece sizes 1 to 4 enabled and 5 off, which is what the audit records as the original's defaults.

## What was not verified

- Anything against the original program. OGLBricks is a Windows Qt/OpenGL binary; it was not run here, and it was never run by the port team either. Every behavioral statement about the original in this folder comes from reading its C++ or from what the user reported while running it themselves.
- The contents of the four archives behind `reference/MANIFEST.sha256`. Their upstream locations were confirmed, but nothing was downloaded, so the hashes themselves are unchecked.
- Real audio on speakers, and a physical phone.
- The score discrepancy, which is still open: the C++ formula gives 40 points for a two-row clear on a width-10 field at speed 1, while the native session reported 10. The port follows the formula and does not quietly adopt the observed number.

## What was not ported, and why

- **The `.sg` save format and `settings.bin`.** The browser keeps its own versioned JSON. Reading the Qt binary format was declared out of scope.
- **Qt's random generator.** `qrand()` is replaced by xorshift32, so a seed replays a browser game, never an original one. The original's random piece colors are not reproduced either.
- **The OpenGL presentation**, the end-of-turn animations and Qt's event timing. The port models the logical outcome, with a 300 ms lock delay, and says so rather than claiming frame parity.
- **`InvalidType`.** When only one piece category is enabled the original C++ can produce an invalid piece; the port repeats the available shape instead. This is a deliberate safety exception, not original behavior.
