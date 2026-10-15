# M21 browser/static QA

- All `.js` / `.mjs` files pass `node --check`: **42/42**.
- `python3 -m http.server` served `index.html` successfully: **HTTP 200**.
- Static media/source policy scan: **0 forbidden historical files**.
- Chromium headless was attempted with `--headless --no-sandbox --disable-gpu --disable-dev-shm-usage`.
- Chromium timed out after 15 seconds without producing a DOM dump. The log reports unavailable DBus and UPower services in the container.

Therefore M21 does **not** claim automated cross-browser visual certification. This is an environment limitation, not a passed browser-rendering test.
