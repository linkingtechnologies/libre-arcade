# M22 Browser / static QA

- Browser shell: ES modules, Canvas 256×240, fixed 50 Hz gameplay scheduler.
- Keyboard: arrows/WASD; pause via P/Escape.
- Pointer/touch directional controls retained.
- IT/EN strings include Day 7, Dibrov/wisdom feedback and the final ending.
- Viewport no-scroll policy inherited from M14 and remains covered by regression tests.
- All 42 JS/MJS files under `src/`, `web/` and `tests/` pass `node --check`.
- Local static server smoke test returned **HTTP 200** for `/`.
- Automated visual Chromium certification remains environment-dependent and is not claimed here.
