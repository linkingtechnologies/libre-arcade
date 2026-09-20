# AGENTS.md

- `public/js/physics.js` and `public/data/playfield.js` are the validated engine baseline; `MANIFEST-SHA256.txt` records their hashes. Do not edit them for style or lint. Change them only together with the affected regression tests and native-oracle comparisons, and never tune them toward the historical full-game score (45). Keep the diagnostic boundary in `specs/PARITY.md` and `ARCHAEOLOGY.md` visible.
- `reference/` is frozen archaeological evidence. Never modify its files in place. Regenerate oracle output only in a disposable copy, using a locally downloaded and hash-verified original JAR.
- Never commit the original JAR (`comet-pinball-1.1.0-b480.jar`), in Git, Git LFS or a release. Its bundled libraries and Nueva Std Cond font atlases are not cleared for redistribution (`JAR-LICENSE-REVIEW.md`). `.gitignore` excludes `reference/releases/*.jar` and `tests/credits-libre-arcade-license.js` guards it.
- `public/` is the single copy of the runtime. The legal notices in it (`LICENSE`, `NOTICE`, `ASSETS_LICENSE`, `MUSIC-CREDITS.md`) are duplicated from the project root so a standalone deployment carries them; edit both together (a test fails if they drift).
- License: this port is Apache-2.0 (upstream is Apache-2.0), unlike the collection's GPL-3.0-or-later default. Keep `LICENSE` and `NOTICE`, and keep the CC0 music attribution in `MUSIC-CREDITS.md`.
- The tests are CommonJS scripts. This folder's `package.json` deliberately has no `"type": "module"`.
- No runtime frameworks or bundler; Canvas 2D and Web Audio, client-side only.
- Do not describe the game as a certified 1.0. Full three-ball parity with the native engine, entry into the launch lane from above, states embedded in a wall and real-device acceptance are open (`TESTING.md`, `reports/M13.12-OPEN-ISSUES.md`).
- `npm run check` (lint plus the Node tests) must pass before packaging.
