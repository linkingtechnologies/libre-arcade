# For Science!

**[▶ Play here](https://linkingtechnologies.github.io/libre-arcade/for-science/public/index.html)**

A software-archaeology preservation and HTML5/JavaScript port of **For Science!**,
Juan J. Martínez's PyWeek 16 game from April 2013. See
[`SOFTWARE_ARCHAEOLOGY.md`](SOFTWARE_ARCHAEOLOGY.md) for the recovery story and
[`PROVENANCE.md`](PROVENANCE.md) for exactly what was and wasn't ported.

This repository deliberately separates **preserved upstream material** (`reference/`)
from **reconstructed browser code** (`public/`).

## Languages

The browser restoration supports **English and Italian**. English remains the historical fallback; on first visit an Italian browser locale selects Italian automatically. The choice can be changed under **Options → Language** and is stored locally when Web Storage is available. Localization is a browser-shell extension: `/reference` and gameplay rules remain untouched.

## Baselines

- `/reference/pyweek-final2` — PyWeek final release 2, preserved unchanged.
- `/reference/postcompo-1.0.1` — post-compo 1.0.1, preserved unchanged and used as
  the primary behavioral baseline.
- `/reference/archives` — byte-preserved source archives with SHA-256 checksums.

See `specs/legal-audit.md` and `specs/version-diff.md` before modifying anything.

## Browser release 1.1.0

The browser edition uses:

- HTML5 Canvas 2D;
- Web Audio;
- native ES modules;
- no framework;
- no backend;
- the original 640×480 logical coordinate system, responsively scaled to fit the
  viewport.

Release **1.1.0** is the production-ready static package. The gameplay/parity core
remains the audited 0.3 baseline. Release 1.0.0 added browser robustness, loading
and error handling, an in-game How to Play screen, safer preference persistence,
fullscreen synchronization, and production page metadata; 1.1.0 adds the bilingual
English/Italian browser shell without changing game rules.

See `specs/production-ready.md` for the exact boundary between faithful gameplay
and browser reconstruction.

### Run

```bash
npm run dev
```

Then open `http://localhost:8080/`. `npm run build` packages `public/` into
`game/` for deployment to any static web server; `npm start` builds and serves
that packaged output. Any other static HTTP(S) server pointed at `public/`
works too (`python3 -m http.server`, `npx serve`, `caddy file-server`, nginx,
GitHub Pages, ...) — ES modules and audio loading should not be tested through
`file://`. All runtime paths inside `public/` are relative, so the same tree
can be published as-is.

## Parity baseline

The gameplay parity baseline is **0.3**. It provides source-anchored visual/input
parity, exact Python 2.7 deterministic oracles across multiple seeds, Cocos edge
hit-testing semantics, one-click-per-rendered-frame gating, corrected meteor
orientation, the original explosion action quirk, the 1.0 second Cocos menu
transition, and byte-identical verification of every copied original asset.

For a deterministic manual parity run, append an integer seed without exposing any
debug UI, for example `?seed=123`.

See `specs/parity.md`, `specs/timing.md`, and `specs/visual-parity.md`.

## Tests

```bash
npm run check
```

`eslint` is the only npm dependency, used to lint `public/src/`, `main.js`,
`scripts/`, `test/`, and `tools/`; the regression/audit suite itself needs only
Node.js. The release suite contains **65 regression/audit checks**, plus
JavaScript syntax checking and a deterministic **1000-seed AI stress run**.
Checks include byte-preservation for both expanded reference trees,
byte-identity for all browser asset copies, source anchors and independent
Python-2.7-compatible oracle fixtures.

## Licensing

The game/port is licensed **GPL-3.0-or-later**. Several original assets are under
separate permissive/free-content licenses. See `THIRD_PARTY_NOTICES.md` and
`public/assets/licenses/`.

Do not describe `/reference` as relicensed: it is a preserved upstream distribution
carrying its original notices.
