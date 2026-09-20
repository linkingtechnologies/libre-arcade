# Comet Pinball HTML5 — software archaeology

**[▶ Play here](https://linkingtechnologies.github.io/libre-arcade/comet-pinball/public/index.html)**

A preservation-oriented, playable browser port of **Comet Pinball 1.1.0 (2013)** by Patrick Haring and Christian Bürgi. The original upstream is https://github.com/boskoop/comet-pinball . This first commit presents one coherent game and its archaeological evidence; it does not preserve temporary local development milestones as Git history.

## Play

Serve `public/` with any static web server (`npm run dev` starts a dependency-free one on http://localhost:8080/), or open `public/index.html` directly in a modern browser. No framework, online service or server runtime is needed, and there is no build step: `npm run build` only copies `public/` verbatim into a throwaway, gitignored `game/`.

Left flipper: **← / A / Z / Tab**. Right flipper: **→ / D / L / M / Enter**. Launch: **Space / ↓ / Launch**. Camera: **V**. Pause: **P / Esc**. Touchscreen controls support two simultaneous flippers. Music starts after PLAY and can be muted independently of the effects.

The main menu also includes **Credits** (original authors, HTML5 preservation, music provenance and licensing).

**Language:** English is the default; an Italian browser selects Italian. The in-game **EN / IT** control changes language immediately and saves an explicit preference where local storage is available. This changes text only, not game physics or saved scores.

The second and third balls are prepared automatically after a brief message; the player launches them manually. The game-over/record screen is shown after the third ball. A stuck ball can be voluntarily ended, only after explicit confirmation. Score records are stored locally where browser storage permits.

## Repository layout

- `public/`: **the game itself and only what public hosting needs** (`index.html`, `style.css`, `js/`, `data/`, `assets/`, plus the legal notices `LICENSE`, `NOTICE`, `ASSETS_LICENSE`, `MUSIC-CREDITS.md` and `README-PLAY.md`). No original JAR, research CSVs or diagnostics. This is the single copy of the runtime: the Node and browser test harnesses read it directly. The legal notices in `public/` are duplicated from the project root so a standalone deployment carries them; `tests/credits-libre-arcade-license.js` fails if the copies drift.
- `reference/`: 22 directly bundled archival files, including original manual/table, audits and native oracle traces. The original binary is excluded; its identity and upstream link are recorded in `reference/releases/README.md`. **Never modify the original archival artifacts in place.**
- `specs/`: historical constants, parity boundaries, deterministic full-game replay contract.
- `tests/`: reproducible Node regressions, gameplay and UI tests.
- `tools/oracle/`, `tools/diagnostics/`: source and runners for historical measurements; `tools/browser-gate.py` and `tools/language-browser-gate.py` for localized Chromium smoke testing.
- `reports/`: selected research evidence, native diagnostic snapshots and initial-commit test/visual artifacts.
- `ARCHAEOLOGY.md`, `CHANGELOG.md`, `THIRD_PARTY_NOTICES.md`, `MANIFEST-SHA256.txt`: provenance, one-commit summary, rights and checksums.

## Verification

Requires Node.js 22+; run from **this** directory:

```sh
npm run check   # lint, then the 38 Node regression tests (node --test tests/*.js)
npm test        # tests only
```

Use `python3 tools/browser-gate.py` and `python3 tools/language-browser-gate.py` with Chromium and Playwright installed for Italian, English and other-browser-locale UI smoke tests. Native historical probes additionally require Java/Javac and a separately downloaded, locally verified original JAR. See `TESTING.md` before regenerating any `reference/oracle/` output. The SHA-256 manifest and `reference/SHA256SUMS` protect archaeological byte identity.

**Status:** this is a playable first commit, **not** a certified 1.0 across physical Android/iOS or all browser/host combinations. Isolated physics oracle checks are covered; bit-for-bit full-game Box2D parity is not claimed.

## Rights

The port is distributed with Apache License 2.0, the replacement recording is CC0, and the historical JAR (not bundled here) includes separately licensed/shaded dependencies and historically uncertain assets. See `NOTICE`, `THIRD_PARTY_NOTICES.md`, `MUSIC-CREDITS.md`, `ASSETS_LICENSE`, and `reference/audit/`. This public-commit archive **excludes the original JAR**; its upstream download and digest remain documented. See `JAR-LICENSE-REVIEW.md` before considering binary redistribution.

### Collision diagnostics before release 1.0

This import includes isolated, historically compared CCD for the playfield-side divider, central ceiling and upper curves after bumper impacts. The narrow launch lane and residual curve/ceiling mixed contacts are still open; see `reports/M13.12-OPEN-ISSUES.md`. Do not describe this first import as production-ready.

## Corridor collision status

The initial commit includes coupled TOI for both real launcher walls when the ball begins within the lower corridor. Twenty valid native one-step oracle states match within 0.074 mm; 14 two-second stress runs did not escape in the protected corridor range. Entry from above and states initially embedded in a wall are not certified; see `reports/M13.12-OPEN-ISSUES.md`.

## Bumper → upper-wall containment (first import)

Two reproducible escape cases in the pre-import build used a lateral-wall TOI from an obsolete, pre-upper-curve-rebound sweep. The follow-on lateral TOI now uses the curve island post-impact state and remaining time. See `reports/bumper-escape-M13.12-repair.md` and `tests/m13.12-bumper-upper-wall.js`. The complete game is **not** certified native-equivalent.

The **Credits** panel links to the preservation project at https://linkingtechnologies.github.io/libre-arcade/ .
