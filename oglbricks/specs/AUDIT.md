# Audit trail of the port, M0.17 to M6

The browser version was built in an archaeological pass (M0.x) followed by six milestones, between 23 and 24 September 2026. Each delivered its own QA document and, in most cases, a file of raw test output: 19 files, about 460 KB. This document replaces them. Nothing here is new material.

What survives beside it: `port-map.md`, and the two extractions the tests actually compare against, `original-shapes.json` and `original-spatial-contract.json`.

## M0.17, closing the archaeology

The user supplied four archives: OGLBricks source 0.1, 0.1.1 and 0.2, and the Windows 0.2 build. Their SHA-256 values are in `../reference/MANIFEST.sha256`; none of the four is in this repository.

What the reading of the C++ established:

- Three releases, 26 piece types in 0.1 and 27 in 0.1.1 and 0.2. The port follows 0.2.
- Sizes are **categories of fixed source-defined shapes**, not a shape editor: [1, 1, 2, 7, 16] types for sizes 1 to 5.
- Field width and height settable independently from 10 to 50. Defaults: 20 x 20, categories 1 to 4, speed 1, automatic fall on.
- The next piece type is drawn excluding the current one. Spawn searches from the centre column to the right, then to the left.
- Score `clearedLines² × fieldWidth × speed`; speed rises after `width × height × speed` accumulated rows. Two rotation origins, no wall kick.

What the audit deliberately refused to claim: that the isolated C++ experiments of M0.5 to M0.11 had found native bugs. They had suggested the game might stall when the last cleared row empties the field. The user then played that exact scenario on Windows and it continued normally. The hypothesis was retracted rather than written up as a defect.

### The twelve oracle scenarios

Eight were exercised by the user on Windows and reported back; four were never observed.

| | Scenario | Outcome |
|---|---|---|
| O01 | first exact piece | Open, no recording from a cold start |
| O02, O03, O06 | movement, rotation, fall | Observed after loading a real `.sg`; no timing or edge cases |
| O04, O05 | rotations against a wall or a block | Open, source-derived fixtures only |
| O07 | one row cleared, field emptied | Observed to continue, refuting the earlier stall hypothesis |
| O08 | two rows cleared at once | Continued, but **+10 points** reported on a width-10 field at speed 1, where the source formula gives +40. Unresolved |
| O09 | custom 10 x 15 field | Observed, playable |
| O10 | only the five-block category | Observed, several pieces, playable |
| O11 | save and load | An authentic `test.sg` loaded and play continued |
| O12 | game over | Open |

These are reports of someone else's session, not traces. The collection's verification hierarchy puts this port at level 3 for its rules, with the shape catalog at level 2 because the values are exact and mechanically compared.

## The milestones

| # | Added | Node tests | Its own main caveat |
|---|---|---|---|
| M1 | The rules engine: field, 27 shapes, four precomputed turn states each, spawn search, rotation without wall kick, accelerated descent, 300 ms lock, multi-row clearing, the source score formula, speed progression, game over, pause, seeded next-piece choice, JSON restore | 15 | xorshift32 instead of `qrand()`; a seed replays the browser build only |
| M2 | The interface: Canvas board and preview, score, speed and rows, settings dialog (10 to 50 per axis, categories, starting speed), keyboard and four touch buttons, English and Italian, save and load, no page scrolling | 18 | Headless Chromium in that environment timed out on even a trivial page, so no visual or touch check was possible |
| M3 | Hardened `Game.restore()` against malformed saves; 210 engine combinations (five field sizes x seven category sets x six seeds); all four rotations of all 27 shapes; HTML id and translation-key contracts; the Python HTTP asset smoke test | 27 | Same renderer problem. The 210 combinations run inside one test and were never presented as 210 browser tests |
| M4 | Toolbar reduced to New game, Pause, Menu, with Settings, How to play, Credits and language behind Menu; the Libre Arcade link moved to Credits alone; narrow portrait layout puts the board full width with a compact strip beneath; opening a dialog pauses, closing resumes only if it had been running | 32 | Playwright now worked, but by injecting the code into a blank page: navigation to localhost was blocked by policy |
| M5 | Autosave coalesced at 1.3 s and on page hide, remembered language, a localized warning when storage is blocked, and randomized invariants over 31 category masks x 3 field sizes x 250 actions | 34 | Browser storage in the tests was an in-memory stand-in, so persistence at a real origin stayed uncertified |
| M6 | Seven synthesized Web Audio cues, a permanent speaker button with `aria-pressed`, mute that silences notes already playing, the preference remembered | 39 | An `OfflineAudioContext` proved the signals exist and that muting yields exactly zero samples; it proves nothing about real speakers |

M2 to M6 all repeat the same two limits: the original was never run, and the score discrepancy of O08 stands.

## What the port keeps from the original rather than improving

- The next-type exclusion, so the same piece never comes twice in a row even when that is what you want.
- The spawn search order, centre then right then left, which decides where a piece appears on an odd-width field.
- Scoring that squares the cleared rows and multiplies by the full field width, so a wide field scores far more than a narrow one for the same play.
- No wall kick: a rotation that does not fit is simply refused.

## What was blocked then, and what happened since

Every browser check from M2 to M6 ran against injected code, because that environment's Chromium refused to navigate to a local HTTP URL. When the game joined the collection this was done properly: `public/` was served over HTTP and driven in an ordinary headless Chrome at 1280 x 800 and in a 375 x 812 pane. All six files return 200 with the right content type, the board plays, Menu, Settings and How to play open, the four touch buttons are present and the page does not scroll in either axis. Reloading after several minutes of play brought the board back from one versioned key, `libre-arcade-oglbricks-save-m2`, which closes the real-origin persistence gate too. The settings dialog opens on exactly the defaults the audit recorded for the original: 20 x 20, speed 1, automatic fall, sizes 1 to 4.

## Still open

1. The O08 score discrepancy: 10 points reported natively against 40 from the formula. Either it is reproduced on Windows, or it is written down as an accepted deviation.
2. O01, O04, O05 and O12, never observed.
3. The original `.sg` and `settings.bin` formats, out of scope by decision.
4. Real speakers and a physical phone.
5. The contents of the four archives behind `reference/MANIFEST.sha256`. They are not committed by decision; `../reference/SOURCES.md` gives their upstream folders, both confirmed to still hold them, and nothing was downloaded, so the hashes are unchecked. See `../PROVENANCE.md`.

## What this file replaced

Removed: `M0.17-AUDIT.md`, `M1-M2-STATUS.md`, `M3_RELEASE_CHECKLIST.md`, the six `QA_M*.md` documents, the eight `*_RESULTS.txt` files of raw runner output, and `m5-screenshots/`, five PNGs of emulated viewport sizes now superseded by the live browser check and by `../screenshots/`.

The runner output was reproducible with `npm run check`, or described code that no longer exists. The complete original set is in the delivered archive, `oglbricks.zip`, which is the record of what was handed over; this folder had never been committed, so nothing left the project's history.
