# Don Ceferino Hazaña

**[▶ Play here](https://linkingtechnologies.github.io/libre-arcade/don-ceferino/public/index.html)**

A preservation-first, browser-native restoration of **Don Ceferino Hazaña 0.97.8**. See [`SOFTWARE_ARCHAEOLOGY.md`](SOFTWARE_ARCHAEOLOGY.md) for the recovery story and [`PROVENANCE.md`](PROVENANCE.md) for exactly what was and wasn't ported.

The original C++/SDL release is preserved unchanged under `/reference`. The playable version uses plain HTML, CSS and JavaScript, Canvas rendering and original 0.97.8 data. It has no application framework, backend or runtime npm dependency.

## 1.0.3 parity hotfix

This release keeps the 1.0 parity baseline and removes only the obsolete `www.losersjuegos.com.ar` text from the runtime copy of the first LosersJuegos presentation image. The untouched historical JPEG remains under `/reference`. Gameplay logic, timing and every other asset are unchanged.

The parity baseline includes:

- all **30 original levels** loaded directly from `base.map`;
- 100 Hz fixed-step simulation independent of rendering refresh rate;
- original ball sizes, gravity, rebound quirks, splitting and scoring;
- player movement, ladders, crouch, sweep/spin, falling and bomb behavior;
- normal/trident shots, breakable blocks, item drops and freeze behavior;
- historical timer, life, extra-life, timeout and level-transition semantics;
- original intro, menu artwork/title animation, How to Play and six-screen ending;
- seven-entry high-score table and Game Over continue behavior;
- historical `JU`, `SJ` and `BO` cheats;
- original WAV sound effects with the original single-channel interruption behavior;
- responsive desktop/touch UI with Italian and English browser text;
- browser-local preferences and high scores.

Historical bitmap fonts remain preserved but unused. The original `menu.xm` is preserved under `/reference` and `/quarantine/music` but is not played because its embedded MID2XM sample-bank provenance cannot be independently reconstructed. See `docs/AUDIO_AUDIT.md`.

## Run locally

```bash
npm run dev
```

Then open `http://localhost:8080/`. `npm run build` packages `public/` into
`game/` for deployment to any static web server; `npm start` builds and
serves that packaged output. Any other static HTTP server pointed at
`public/` works too. The build is suitable for static hosting such as
GitHub Pages.

## Controls

- Arrow keys / WASD / HJKL: move and use ladders
- X or 2: fire
- Z/C or 1/3: sweep
- P: pause
- while paused: Space, Enter, X, Z or C resumes
- touch controls are available on touch-oriented devices and can be forced on/off in Options

Historical cheats:

- `JU`: advance one level
- `SJ`: jump to the original super-jump destination (level 26)
- `BO`: trigger the bomb animation while Ceferino is idle

## Languages and browser options

The browser UI supports Italian and English. Historical gettext catalogs remain preserved in `/reference`.

The original 0.97.8 in-game Options scene delegated settings to the external `ceferinosetup` utility. The browser adaptation exposes fullscreen, touch controls, sound effects and intro replay directly.

## Verification

Run:

```bash
npm run check
```

The release suite covers source/header licensing, preserved-archive integrity, byte identity for historical active assets except the single documented `pres_losers.jpg` derivative, all 30 levels, parity mechanics/quirks, shell flows, audio mapping, storage failure handling and JavaScript syntax validation.

See:

- `docs/ARCHAEOLOGY.md`
- `docs/LEGAL_AUDIT.md`
- `docs/ASSET_AUDIT.md`
- `docs/AUDIO_AUDIT.md`
- `docs/PARITY.md`
- `docs/PRODUCTION_QA.md`

## Licensing

The original 0.97.8 package is GPL-2.0-or-later according to its source headers and per-directory asset license files — independently re-verified against the included, hash-matched archive, not just this audit's summary. New browser-port code is GPL-3.0-only (this repository's `LICENSE` carries the plain GPLv3 text, with no "or later" clause of its own).

See `PROVENANCE.md`, `THIRD_PARTY_NOTICES.md` and `docs/LEGAL_AUDIT.md`.
