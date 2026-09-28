# Changelog

## Unreleased

- First public version, joined to the Libre Arcade collection.
- Added the collection's scaffolding: `package.json` (scripts `dev`, `build`, `start`, `test`, `lint`, `check`, plus `bundle` to regenerate `public/app.bundle.js` from `src/`), `scripts/serve.mjs`, `scripts/build.mjs`, an ESLint config, `.gitignore`, the GoatCounter snippet and a "Play here" link. `COPYING` was two lines pointing at `LICENSES/GPL-3.0.html`; replaced with the full GPL-3.0 text the collection's rules require at the root.
- Made `npm test` independent of a JDK. The delivered `mix-parity.cjs`/`background-parity.cjs` compiled and ran two Java oracle programs live on every test run; both were re-run here against the real `reference/puzzlegames.jar` (Java 1.8.0_503) and their output stored as fixtures, which the tests now check against. Added `test/reference-integrity.cjs`, `test/photo-integrity.cjs` and a Node port of the delivered `production-smoke.sh`'s static checks, combined with the existing tests into `test/run-all.cjs`: 8 checks in total, all JDK-free. `test/production-smoke.sh` was rewritten to re-verify the stored fixtures against a live JDK re-run instead of silently doing nothing with its own compile step, and remains available as an optional full check.
- Verified independently and recorded in `PROVENANCE.md` and `SOFTWARE_ARCHAEOLOGY.md`: the shuffle algorithm and the background-color formula, both against the live original Java classes; the ten photographs and thumbnails byte-identical to the historical jar; and the GPL "or later" header read directly in `SliderHandler.java`.
- No change to the game rules, the shuffle algorithm (directional bias included), the background-color formula, the strings or the bundled photographs.
