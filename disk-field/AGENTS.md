# AGENTS.md

- `public/js/engine.mjs` and `public/js/levels.mjs` are byte-pinned by SHA-256 in `tests/m4-release-checks.mjs`. Do not edit them to satisfy lint or style; change them only together with that test, a regenerated `levels.mjs` (`tools/export_levels.py`) and a fresh oracle run (`tests/run-oracle.mjs`).
- Do not commit the original PyWeek archives, extracted historical sources, the font `MAKISUPA.TTF`, the music, or any WAV/OGG recording. `reference/` is metadata only; `/reference/archives/` and `/reference/extracted/` are gitignored on purpose. The public payload must stay free of every quarantined asset (see `archaeology/inventories/asset-license-audit.csv`); `tests/m2`, `m3` and `m5` fail if a name leaks into `public/`.
- Do not relabel the historical Python under `tools/oracle_compat/` or the 1.0 to 1.01 patch as GPL. They keep the upstream grant (see `PROVENANCE.md`). New port code is GPL-3.0-or-later.
- Baseline is Disk Field 1.01. Do not add gameplay, levels, cut features (crumble walls, blades, power-ups) or score/timer layers. Presentation, accessibility and robustness changes are fine if the oracle and solvability suites stay green.
- The simulation is a fixed 30 Hz tick with no elapsed-time term. Keep it decoupled from rendering.
- No runtime dependencies or bundler; Canvas 2D and Web Audio only. `npm run check` (lint plus tests) must pass before packaging.
- Human acceptance (17-level play-through, real touch and audio checks on phones) is still open; do not describe the game as fully signed off until `docs/PRODUCTION_CHECKLIST.md` is complete.
