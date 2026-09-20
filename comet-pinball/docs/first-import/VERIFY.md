# Comet Pinball — first-import verification (EN/IT)

- **38/38 JavaScript tests passed** using the shipped engine (including the language detection/storage test).
- **Italian Chromium gate passed** on 1280×960, 390×844, 390×667 and 320×568, with no page errors or page overflow; touch and audio emulation checks passed.
- **English/Italian language gate passed** for en-US, it-IT and de-DE browser locales, including live switching in menu, credits, active game and pause. English is the default when no Italian browser preference or explicitly saved language applies.
- All **23 included reference files are byte-identical** to the preceding public-safe first-import baseline. The historical shaded JAR is intentionally excluded; its asset redistribution rights are still unverified.
- `data/playfield.js`, `js/physics.js`, `js/camera.js`, `js/audio.js`, `js/visuals.js` are unchanged. The source and published runtime files match byte-for-byte.
- Project-authored documentation, code comments and diagnostics are in English; only the in-game Italian translation, tests that explicitly assert translated text, and frozen historical evidence retain Italian content.
- `CHANGELOG.md` contains one initial-release entry. The UI does not expose local development milestone names.
- Limitation: the managed Chromium environment blocks localhost and direct file navigation, so the browser tests use the same shipped HTML/CSS/JS/music bytes inline. Actual static-host and physical-device acceptance, launch-lane entry/overlap cases and full-game Box2D parity remain open.

The relevant logs are `projects/comet-pinball/reports/initial-test-run.log`, `initial-browser-gate.log` and `language-browser-gate.log`.
