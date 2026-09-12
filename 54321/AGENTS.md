# AGENTS.md — 54321 preservation project

This repository is a software-archaeology project first and a browser restoration second.

## Non-negotiable preservation rules

1. Never edit files under `reference/54321-1.0.2001.11.16/`.
2. Keep the exact uploaded archive under `reference/original-archive/` and retain its checksum manifest.
3. Do not add a repository-wide GPL-3.0 license. The original material in
   `reference/` (and the copied original artwork) is `LicenseRef-NKlein-Universal-NonExclusive`,
   not GPL — see `PROVENANCE.md` and `REUSE.toml`. Only this repository's own
   browser-shell/port code is GPL-3.0-or-later.
4. Do not claim original assets as newly authored, or relicense them as
   anything other than `LicenseRef-NKlein-Universal-NonExclusive`.
5. Every gameplay behavior called faithful must be traceable to original source/data/help or observation of an original executable.
6. Classify changes as PRESERVED, FAITHFUL PORT, RECONSTRUCTED or ENHANCED.
7. Prefer Canvas 2D. 54321 has logical 3D/4D spaces, not a polygonal 3D engine.
8. No application framework and no server-side game logic.
9. Keep the UI responsive and avoid page-level scrolling.
10. Add regression tests for rules, topology, generation, state transitions and preserved runtime assets.

## Porting record

- Milestone 1: Flip-Flop.
- Milestone 2: Bomb Squad.
- Milestone 3: Maze Runner.
- Milestone 4: Peg Jumper.
- Milestone 5: Tile Slider; all five advertised games available in-browser.
- Milestone 6: production pass; Maze dimensional help, IT/EN, reconstructed source-generated sound, runtime-asset integrity tests and release checklist.
- Milestone 7: dimensional help generalized to all five advertised games.
- Milestone 8: final EN/IT string audit and localized outcome overlays; 58-test suite.
- Final packaging pass: detailed archaeology dossier, repository cleanup and `.gitignore`.

## Reconstruction policy

Mobile gestures, browser-native menus/help, system fonts, localization, accessibility additions, optional aids and responsive relayouts are reconstructions. Document them and never present them as original 2001 behavior.

Dimensional help must remain optional and disabled by default. It may expose only geometry or legal current actions already implied by the rules. It must never become a solver, reveal hidden Bomb Squad contents, or expose a route to a goal/solution.

## Remaining archaeology targets

1. ~~Resolve the historical custom-license/GPLv3 compatibility question.~~
   Resolved — see `PROVENANCE.md` and `docs/LICENSE-RESEARCH.md`. The
   original material keeps its own `LicenseRef-NKlein-Universal-NonExclusive`;
   it was never relicensed GPL.
2. Identify the exact Blue Vinyl font and its 2001 terms.
3. Reconstruct the original main-menu/help presentation only if screen-level parity is desired.
4. Fully reproduce the hidden Life easter-egg activation sequence only if faithful secret-flow parity is desired.
