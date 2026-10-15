# M17 browser QA

## Automated/static checks

- ES modules pass Node syntax checks.
- Local HTTP server serves `index.html`, `web/app.js`, `web/stage-day3.js` and core modules.
- Canvas remains 256x240 and CSS keeps the viewport no-scroll policy from M14.
- Keyboard, touch, pause and IT/EN wiring remain covered by inherited tests.
- Renderer contains only programmatic placeholder drawing; no historical image files are referenced.

## Environment limitation

Full Chromium visual/cross-browser certification is not claimed in this container. Earlier Chromium attempts in this environment timed out because of host/DBus constraints. M17 therefore keeps visual cross-browser QA as a manual publication check.
