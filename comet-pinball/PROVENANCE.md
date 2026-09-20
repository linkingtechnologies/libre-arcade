# Provenance

| Layer | Source | Exact revision | License | Treatment |
|---|---|---|---|---|
| Game rules, table, physics constants, scoring | Comet Pinball by Patrick Haring and Christian Bürgi (Comet Engineering) | Release `1.1.0` (build 480, 2013); source frozen at upstream commit `2d0a2865ab7243a476f1f7a6eab4d23b267e2135` | Apache-2.0 | Clean-room JavaScript reimplementation in `public/js/physics.js` and `public/js/comet.js`, informed by reading the Java source and checked against native traces (`specs/port-map.md`, `specs/PARITY.md`) |
| Default table | upstream `src/game/desktop/playfields.xml` | same commit | Apache-2.0 | Lossless translation in `public/data/playfield.js`; the XML itself is kept untouched in `reference/table/playfields.xml` |
| Manual | upstream `doc/game_manual.pdf` | same release | Apache-2.0 (project license) | `reference/docs/manual.pdf`, byte-identical to upstream per the audit (Git blob SHA-1 `cc8e01e3276800ac777811b958ebf50004056732`) |
| Native measurements | Traces produced by running the original release with the Java programs in `tools/oracle/` | JAR `comet-pinball-1.1.0-b480.jar` | Measurements of the original | `reference/oracle/*.csv`, `reports/oracle-m8/`, `reports/oracle-m9/`, `reports/oracle-m10/`; frozen, checksummed in `reference/oracle/SHA256SUMS` |
| Original shaded JAR | SourceForge `comet-pinball/files/1.1.0/` | SHA-256 `84aa5e48c962439113d7e444881e3891c5a179b2306d49db42da9740d580a05f`, 7,816,773 bytes | Apache-2.0 for the authors' code; bundled libraries and image/font assets separately licensed or unverified | **Not redistributed.** Only its identity is recorded (`reference/SHA256SUMS`, `reference/releases/README.md`); `.gitignore` excludes `reference/releases/*.jar` |
| Background music | "Mechanical Night" loop from this collection's `mechanical-night-pinball/` | SHA-256 `5f6502426b13c1b9d2d462c15c6cc82e93756de4186c148d8e71e76b80f60b29` | CC0-1.0 | `public/assets/music/comet-loop.ogg` (byte-identical to the source loop) and `comet-loop.mp3` (a format conversion of the same recording); see `MUSIC-CREDITS.md` |
| Port code, Canvas artwork, synthesized effects, UI, English/Italian strings, camera, credits | this repository | — | Apache-2.0 | New work; the license choice follows the upstream project (see below) |

## What was checked independently

When the game joined the collection these were checked again rather than taken from the package's own documents:

- **Upstream license.** The GitHub `LICENSE` of `boskoop/comet-pinball` was read directly: Apache License 2.0, with the notice "Copyright 2012 Comet Engineering, Patrick Haring & Christian Bürgi". Apache-2.0 has no "or later" clause, so there is no such question to settle.
- **Upstream status.** The GitHub repository page shows the project as archived (14 October 2020, read-only) with 285 commits. That is a statement about the GitHub repository, not about the SourceForge release page, which was not checked.
- **Frozen commit.** `2d0a2865ab7243a476f1f7a6eab4d23b267e2135` exists upstream (subject "removed cobertura plugin since it's not supporting java 7"). Whether it is the last commit of the repository was not checked.
- **Music.** The SHA-256 of `mechanical-night-pinball/public/assets/music/mechanical-night-loop.ogg` equals that of `public/assets/music/comet-loop.ogg`, so the reuse claimed in `MUSIC-CREDITS.md` holds.
- **Package integrity.** All 229 entries of the delivered archive's own checksum list, the 209-entry `MANIFEST-SHA256.txt` and the public tree's checksums matched before any change. The only expected absentee was the excluded JAR.
- **Duplicate trees.** The delivered package carried the runtime twice (`projects/comet-pinball/` and `public/comet-pinball/`). Every runtime and legal file was byte-identical between the two, so merging them into the single `public/` copy lost nothing.

## What was not re-verified

- The JAR's SHA-256, size and SourceForge location are as recorded in the audit; the JAR was not downloaded again.
- The native oracle traces were not regenerated (that needs a JDK and the JAR). They are used as frozen fixtures.
- The third-party inventory of the JAR (`reference/audit/third-party-inventory.csv`, `JAR-LICENSE-REVIEW.md`) is the package's own review, "not a legal opinion" by its own wording.
- The two Python browser gates (`tools/browser-gate.py`, `tools/language-browser-gate.py`) need Playwright and Chromium and were not run after the layout change.

## Why the port is Apache-2.0

The rest of the collection ships its own ported code as GPL-3.0-or-later. This game keeps the license it was delivered with, Apache-2.0, which is also the license of the upstream code it reimplements and of the notices it must carry (`LICENSE`, `NOTICE`). Apache-2.0 code can be distributed inside a GPL-3.0 collection, and the collection's root `README.md` says so for this folder. The choice can be revisited by the game's author; nothing else in the collection depends on it.

## What was not carried over, and why

- **The original JAR.** It is a shaded JAR with 3,163 entries. It bundles third-party libraries whose complete notice set the package could not establish (Logback in particular is EPL-1.0 or LGPL-2.1), and two bitmap font atlases generated from the commercial typeface Nueva Std Cond with no redistribution grant found. `JAR-LICENSE-REVIEW.md` has the details and the conditions for reconsidering.
- **Other raster images in the JAR** (`data/libgdx.png`, `data/splash.png`, `data/metallkugel.jpg`, `data/fussball.png`): no per-file origin was established.
- **The original visual style and audio.** The release has no meaningful production audio; the browser game draws new Canvas artwork and synthesizes its effects.
- **Bit-for-bit Box2D behavior.** Isolated contacts are matched to the native traces; the full three-ball replay is not (`specs/PARITY.md`, `ARCHAEOLOGY.md`).
- **Features the 2013 game did not have** are presentation additions and are documented as such: multitouch controls, the follow-ball camera, a player-confirmed way to end a stuck ball, English/Italian UI and the music.

## Open acceptance items

Direct static-host delivery, complete three-ball play on real desktop and mobile browsers, simultaneous two-finger flipper control, audio resume, score persistence, entry into the launch lane from above and states embedded in a wall are still open (`TESTING.md`, `reports/M13.12-OPEN-ISSUES.md`). This is a playable first import, not a certified 1.0.
