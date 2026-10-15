# M23 Browser / static QA

## Passed

- `index.html` served from Python HTTP server: **HTTP 200**.
- 46 JavaScript/MJS files: **46/46 syntax checks passed**.
- Canvas remains 256×240 and CSS remains main-page no-scroll.
- Touch controls retained for coarse pointers / small screens.
- Dedicated compact landscape rule added for short displays.
- Credits dialog has an accessible label and safe external Libre Arcade link.
- Sound state and language state use local storage and can be reset from Credits.
- No original image/audio binary dependency is referenced by the browser shell.
- No public `__ZS_Mxx__` / `debugApi` hook remains.

## Chromium headless

Attempted with:

`chromium --headless=new --no-sandbox --disable-gpu --disable-dev-shm-usage --disable-software-rasterizer --dump-dom ...`

Result: timeout before DOM output. Chromium repeatedly reports missing DBus sockets and UPower
service access in this container. This reproduces the environment limitation seen in prior
milestones.

**No cross-browser visual certification is claimed.**
