# Testing and release gate

From this directory, run:

```sh
npm run check   # ESLint, then node --test tests/*.js (the 38 Node regressions)
python3 tools/browser-gate.py
python3 tools/language-browser-gate.py
```

The two Python browser gates read the runtime from `public/`. They were last run before the game joined the Libre Arcade collection and its layout changed (single copy of the runtime under `public/`); they were not re-run after that move.

The Node suite covers physics/contact regressions, isolated native-oracle comparisons, the deterministic full-game differential, input and three-ball flow, and interface/audio checks. `tests/i18n.js` additionally checks browser language detection, English fallback, explicit preference, blocked storage and both dictionaries. `tools/browser-gate.py` runs the existing Italian UI/interaction regression under an Italian browser locale. `tools/language-browser-gate.py` tests English, Italian and non-Italian browser locales and language changes during menu, credits, gameplay and pause. These tests require Node.js, Python Playwright and Chromium as appropriate.

The managed test browser may block both localhost and direct `file://` navigation. In that case the browser runners inline the **exact shipped HTML, CSS, JavaScript and media bytes**. Passing that check is not evidence of real hosted-delivery or physical-device acceptance.

The native oracle tools require a separately downloaded and locally verified original JAR, plus a JDK. The binary is deliberately excluded from the public repository. Execute oracle regeneration only in a disposable copy: do not overwrite the original `reference/` traces. See `reference/releases/README.md`, `reference/SHA256SUMS` and `reference/oracle/SHA256SUMS`.

## Remaining acceptance work

The initial boundary-oracle campaign contains 95 one-step fixtures: 35 playfield-to-divider cases, 15 central-ceiling cases and additional lane/upper-boundary diagnostics. The original 35 and 15 focused corrections were verified separately. The physical engine has since changed to improve coupled launch-lane and upper-curve contacts; the old report counts are historical baselines, **not current release certifications**. The full-game native differential first exceeds 1 mm near frame 407 and has a material velocity difference near frame 434; isolated parity does not imply full-game parity.

Before a 1.0 release, test complete three-ball playthroughs on real desktop/mobile browsers, simultaneous two-finger controls, audio/resume, score persistence, direct static hosting and upper-lane entry/overlap cases. Historical bit-for-bit Box2D parity is a separate research goal.
