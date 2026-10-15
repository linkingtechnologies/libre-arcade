# M24 browser/static QA

Date: 2026-10-12

## Results

- Local HTTP server: **PASS** (`HTTP 200`).
- Node syntax checks: **45/45 PASS**.
- Automated gameplay/regression: **251/251 PASS** with `npm test`.
- Small-screen static CSS audit: **PASS** after M24 landscape-touch fix.
- Chromium headless DOM/screenshot: **NOT CERTIFIED in container**.

## Chromium limitation

`chromium --headless=new` starts but does not produce DOM before timeout. Stderr repeatedly reports
failure to connect to `/run/dbus/system_bus_socket` / `/run/oai/bus` and UPower property calls.
M24 therefore does not claim a visual browser pass from this environment.

A manual visual smoke on desktop/mobile is required before the public `1.0.0` tag; see
`M24_RELEASE_CHECKLIST.md`.
