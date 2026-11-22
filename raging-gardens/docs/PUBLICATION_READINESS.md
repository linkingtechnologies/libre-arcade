# Publication readiness assessment

Assessed 22 November 2026, against the acceptance criterion: *Raging Gardens runs as a faithful, complete,
responsive browser game with all original mechanics preserved and every distributed asset legally cleared.*

## Verdict

**Ready to publish as a restoration with replacement artwork and sound effects. Not ready to be described
as having the original's look or sound**, and that part cannot be fixed without the artist's permission.
There is no unresolved legal blocker for what is shipped; one legal blocker remains for what is not (the
original artwork), and it is left open on purpose.

## Criterion by criterion

| Criterion | Status | Evidence |
|---|---|---|
| Complete, runnable from static files | Met | `public/` runs on any static server; no PHP, Facebook or CDN; `npm run build` copies it to `game/`; both pass the browser smoke test |
| All original mechanics preserved | Met for what was exercised; see limits | 19 recorded games of the original (171,000 frames): the port reproduces every frame, the final score and the sounds; hand-worked checks in `tests/mechanics.test.mjs` |
| Responsive | Met, checked in an emulated phone only | the pane size (about 800 x 600), 375 x 812 (touch bar), 812 x 375; no page scroll; no overflow after one fix |
| Every distributed asset legally cleared | Met | `public/assets/PROVENANCE.json`: 14 files, SHA-256, licence and evidence for each; `npm run gate` fails closed (8 tests make it fail) |
| Faithful visual style and audio | **Not met, by necessity** | The artwork is all rights reserved; the sound effects are unverifiable. New pictures with the original's sizes, hit boxes, depth order and animation speeds, new synthesised effects, the original music. Differences documented in `DIFFERENCES.md`; the replacements are not presented as historical |

## Deliverables of the brief

| | |
|---|---|
| 1. Archaeological audit | `docs/ARCHAEOLOGICAL_AUDIT.md`, `SOFTWARE_ARCHAEOLOGY.md` |
| 2. Complete runnable HTML5 game | `public/` |
| 3. Preserved original source and checksums | `reference/original/`, `reference/facebook-adaptation/` (45 files, code and MIT libraries), `reference/SOURCES.json` (210 files, hashes, commits, URLs), `scripts/fetch-original.mjs` (re-creates and verifies everything, including the files not kept) |
| 4. Dependency audit | `docs/DEPENDENCY_AUDIT.md` |
| 5. Asset and licence inventory | `docs/ASSET_LICENSE_INVENTORY.md`, `public/assets/PROVENANCE.json`, `THIRD_PARTY_NOTICES.md` |
| 6. Original-versus-restored differences | `docs/DIFFERENCES.md` |
| 7. Automated tests | 45 under `npm test` (logic against the original, mechanics, the gate); `tools/e2e` (14 browser checks); `tools/oracle` (re-record the original) |
| 8. Browser compatibility report | `docs/BROWSER_COMPATIBILITY.md` (Chromium only; the rest unverified, said so) |
| 9. README, credits, attribution | `README.md`, `CREDITS.md`, `public/CREDITS.md`, in-game credits (English and Italian) |
| 10. GPLv3 for new code, original notices kept | `LICENSE`, SPDX tags, `THIRD_PARTY_NOTICES.md` (MIT of Petar Petrov, javascript-astar, CC BY 3.0 heap, CC0 music) |
| 11. Production ZIP | `npm run package` writes `release/raging-gardens-1.0.0.zip` and its `.sha256`; refuses to run if the gate fails. `release/` is git-ignored; rebuild it from a clean checkout |
| 12. This assessment | here |

## Known limits and open points

1. **Artwork.** To restore the original pictures, get written permission from Stremena Tuzsuzova
   (stremena.com) to redistribute them under a free licence, record it in `reference/SOURCES.json` and
   `public/assets/PROVENANCE.json`, and swap the sprite sheets. Nothing else changes.
2. **Sound effects, not heard.** They were written to match the moments of the original, and checked to run
   without errors in headless Chromium, but not listened to. Someone should play the game once with sound
   on and judge them. The music file is the original CC0 file.
3. **Pushing** was thinly covered at first and is now covered at length: six `hunter` games give the player a stock of
   carrots and chase rivals (158 Q presses, 49 enemies pushed, 17 totems across the 19 games), all identical. Still
   not covered: pushes in situations only a human would set up.
4. **Scripted players, not people.** A human plays in ways the four bots do not (for example holding Z
   through several overlaps at once). The oracle can record any key sequence given to it; a few hand-played
   recordings would be a fair addition.
5. **Browsers.** Chromium (Edge 157, headless) only. Firefox, Safari and real phones are untested; touch
   was tested with synthetic pointer events and a phone-sized viewport.
6. **Second game in one page session.** The original's shared carrot-position memory is reset per game here;
   this difference was read from the source and not run (`DIFFERENCES.md`).
7. **Legal reading is mine, not a lawyer's.** The two points that rest on inference rather than on a
   licence text: that the unspecified Freesound-derived effects cannot be cleared (a conservative reading),
   and that the "Dvubuz Games" header is the author's own label.
8. **Nothing committed.** The work is in the working tree; `git add raging-gardens index.html README.md`
   (and `.claude/launch.json` is git-ignored) is the user's to run.
