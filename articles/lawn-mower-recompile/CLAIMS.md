# Where each claim of the Medium article comes from

This file is about `ARTICLE_FOR_MEDIUM.md` of the submission package (`Lawn_Mower_Level_Up_Submission_Package.zip`, SHA-256 `8ab5ddef…ac73`), which is not in the repository.
`ARTICLE.md` in this folder is an earlier draft and is kept only for reference.

Checked on 18 October 2026. **Run** means measured or executed for this check, on the repository as it is; **doc** means stated in a document of the repository or of the first
package and not run again; **not found** means there is no evidence for it in the repository.

| Claim | Status | Evidence |
|---|---|---|
| ROM 24,592 bytes: 16-byte header, 16 KiB PRG, 8 KiB CHR, mapper 0; `Lawn Mower v1.1 30.05.11` | run | iNES header and strings of `lawn-mower/reference/competition/Lawn_Mower.nes` |
| Ten 95-byte level records at CHR `$1000`, ending at `$13B5` | run | 10 × 95 = 950 = `$3B6`; the records are compared with the ROM's bytes by `test/rom-data.test.js` |
| Figure 1 (the offsets of the header, PRG, CHR and the inset) | run | `$0000–$000F`, `$0010–$400F`, `$4010–$600F`, `$1000–$13B5`, `$13B6–$1FFF`: all consistent with the file |
| The competition ROM and the later 1.12 build have identical CHR and differ in thousands of PRG bytes | run | CHR equal; 7,728 of 16,384 PRG bytes differ (competition vs the author's v1.12 build) |
| The assembler used first for Lawn Mower gave a different binary | run | `lawn-mower/tools/assemble.mjs` differs from the author's v1.12 build in 7,013 bytes |
| With Lan Master's assembler (the NESASM zero-page rule) the source gives the author's v1.12 ROM, zero bytes different | run | `lan-master/tools/assemble.mjs` on `reference/source-v1.12/`: 0 of 24,592 bytes, SHA-256 `181ef3ff1769a85ae98736e02809e65e5d758b453ebb43ec4b9fe60c93ad224c`; recorded in `lawn-mower/PROVENANCE.md` (**not yet committed when this was written**) |
| Movement 12:4 fixed point; speed 20; boost +2 below 48; fuel 232; flowers 38; stones 77 | run | `lawn-mower/public/src/constants.js`, `kernel.js` |
| Earlier release candidates showed black blocks on the messages (wrong pattern bank), a flashing black band on the title, title lettering sliced by the raster splits | doc | the first package's changelog, RC2 and RC5: `lawn-mower/docs/development/PACKAGE-CHANGELOG.md` |
| Sprite priority and eight to a line; the fade through the palette table; the frame counter counting while the display is off | doc | `lawn-mower/specs/port-map.md`, "What the oracle found" |
| "By RC6 the port was playable and 87 tests passed" | doc | the first package's `audit/RC6_TEST_RESULTS.txt` (87 tests, 87 pass); **not rerun here**. The repository's own suite today is a different one: 86 tests |
| The oracle's design: 6502 with cycle counts, memory map, controller reads, interrupts, PPU state, log of register writes; compared: variables, video memory, palette, sprites, the sound chip's input bytes, the picture | doc | `specs/port-map.md`, `PROVENANCE.md` |
| About 455,000 frames per program, three programs (two ROMs and the source assembled here); thirteen deliberate faults introduced in the port, each seen | doc, and partly run | the long run of 12 October is in `PROVENANCE.md` and **was not repeated**. Run on 18 October: `npm test` in `lawn-mower/`, 86 of 86 pass in 3 minutes, which includes the short runs against the three programs and the thirteen breaks (`test/oracle-sensitivity.test.js`) |
| The second pass removed `render-core.js`, `canvas-renderer.js`, `ppu-timing.js`; replaced 146 of 170 lines of `app.js`; changed 144 and added 366 lines of `kernel.js`; about 78% of the kernel's lines survive; the first package's tests were not kept | run | `diff` of the first package's files (from `Lawn_Mower_M9_RC6.zip`) against `lawn-mower/public/`: `app.js` 24 of 170 lines kept; `kernel.js` 521 of 665 kept (78%), 144 removed, 366 added; the files listed are gone, `display.js`, `ppu.js`, `session.js` are new |
| The pacing skip depends on X, which the fuel-can search leaves nonzero | doc | `specs/port-map.md` ("The pacing") |
| The pad is sampled in some loops and a press is new against the previous read; the title-screen cheat was missing in the first port | doc | `specs/port-map.md` ("The pad", "The cheat") |
| The random generator (the three lines of code), seeded on a cold reset, consumed on the title screen and by cuttings and effects | run | `public/src/rng.js`; call sites in `kernel.js` (title, cut-tile variants, grass sprite, camera shake, fuel can position) |
| Fifth lawn: the author's v1.12 build keeps the display off 10 NMIs on some entries, 9 on others; the port models 9; the assembler layout is a hypothesis, not measured | doc | `PROVENANCE.md` (open points) |
| The integration followed v1.12 by default, with the switch `checkPadClearsDirection`, and it was not chosen explicitly | doc | `AGENTS.md`, `PROVENANCE.md` |
| NESRecomp: PolyForm Noncommercial licence; the command line alone does not give a playable game; NES Recompiled is MIT; neither was run on Lawn Mower | run | the repositories' pages and LICENSE read on 18 October 2026 (documentation only; nothing was executed) |
| The listing of `cutStone`, and what `fuelSubtract` does (carry subtraction clamped at zero; warning when the fuel crosses 58) | run | `reference/source-v1.12/game.asm` lines 1879–1885 and 1904–1923 |
| The stone experiment: both ROMs, 233 fuel values, penalty 77 and 60, 932 of 932 agree with the port's kernel; the C works on `$CB` and a carry | run | `lawn-mower/tools/static-translation/experiment.py`, run on 18 October 2026 on the repository (932 of 932); the results are kept in `results/`, byte for byte the same on a second run and the same as the first run on a copy of the sources |
| The experiment is "preserved in a separate M11 archive, not yet at a permanent public URL" | **out of date** | it is published: committed in `ab8c5ee56fe9b07c299f203bd6962f3a49fbc95d` and on GitHub (checked 18 October 2026): https://github.com/linkingtechnologies/libre-arcade/tree/ab8c5ee56fe9b07c299f203bd6962f3a49fbc95d/lawn-mower/tools/static-translation (permalink to that commit), or `…/tree/main/lawn-mower/tools/static-translation` |
| Concentration Room: 174 RAM fields per iteration, 64 scenarios, 128 games, 310,756 iterations, 119,426 frames compared; sound not compared | doc | `concentration-room/PROVENANCE.md`, `specs/port-map.md`, `CHANGELOG.md`; not rerun |
| Concentration Room: 30 faults deliberately introduced in the port, 28 caught by the oracle (25 at once by the six quick scenarios, three needing others), two never caught (a repeat interval of 4 frames instead of 3; a tie that wins a Vs. CPU stage) | doc | `concentration-room/specs/port-map.md` ("28 of the 30 were caught"). It was done once during the integration and **the script is not kept**, so unlike Lawn Mower's it is not a standing test. (An earlier version of this file said no such test was found: that was wrong, it is in the port map.) |
| `shuffle.py -r` reordered the direction handlers; input during the CPU's turn; state left after a game; two music notes | doc | `concentration-room/CHANGELOG.md` |

## Wording to change in the article

- "three ROM variants" → three programs: the competition ROM, the author's v1.12 build and the v1.12 source assembled here.
- "thirteen deliberate changes" → thirteen deliberate faults introduced in the port.
- "I have not rerun that full oracle suite" → the short suite (86 tests, with the oracle against the three programs and the thirteen faults) passes on 18 October 2026; the long run of 12 October (about 455,000 frames per program) was not repeated. Do not confuse the 86 with the 87 of RC6.
- "I investigated NESRecomp and NES Recompiled" → I read their documentation; I did not run them.
- "Before attempting a whole-game recompilation" → nothing was attempted; "to see what a static translation keeps".
- The link to the assembler: `lan-master/tools/assemble.mjs`. The provenance note cited for it must be committed before the article is published.
- The sentence about the M11 archive: point to `lawn-mower/tools/static-translation/` once it is committed.

- The link "Shiru's competition ROM" (PDRoms): **checked, matches.** The page serves `Lawn_Mower_(NANESCC_2011)_(Nintendo_Entertainment_System).zip`, 353,308 bytes, SHA-256 `de7346d23e34130e84f0dafdc71be39a36e5e986034a8b35625194b9bed45a1d`, byte for byte the competition archive in the repository (so the ROM in it, SHA-256 `942f36376246dbdff99a0b94aad930b2cccf1f534e5390468ac9c0d50752d7dd`, is the one on that page). Checked on 18 October 2026 by fetching the file into a browser page and hashing it; it was not saved. Wording that is true: "a copy of the competition entry, hosted on PDRoms since June 2011, byte for byte the file I used". PDRoms is a third-party host, not the author's site, so "recovered from Shiru" should not be implied.
