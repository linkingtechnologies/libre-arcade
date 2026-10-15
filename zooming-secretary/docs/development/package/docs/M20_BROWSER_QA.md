# M20 Browser / Static QA

## GREEN checks

- All JavaScript modules/tests pass `node --check` (**38 files**).
- Local static HTTP server responds **200** and serves `index.html`.
- Canvas remains 256×240 with the existing responsive/no-scroll shell.
- Keyboard/touch controls, IT/EN strings, pause and fixed 50 Hz scheduler remain covered by the M14+ regression suites.
- Day 5 is wired into the campaign after both Dream outcomes.
- Renderer includes new placeholder-only Geek treatment and four-topic support.
- No historical ROM/CHR/nametable/media/source files are present.

## Chromium limitation

Chromium headless launches in the container but does not complete the DOM-dump run within the QA timeout. Its stderr contains missing DBus/UPower service errors from the container environment. Therefore M20 does **not** claim automated cross-browser visual certification.

This is narrower than earlier milestones: HTTP serving itself is now confirmed working in-container.
