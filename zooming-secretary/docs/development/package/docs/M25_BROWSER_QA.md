# M25 — Browser QA

Date: 2026-10-12

## Static / server checks

- local HTTP server: reachable, HTTP 200;
- production entry point: `index.html`;
- responsive CSS contract from M24 retained;
- touch controls remain enabled in short coarse-pointer landscape;
- overlay cards remain height-bounded with internal scrolling;
- no runtime external-network dependency.

## Chromium attempt

M25 retried headless Chromium more aggressively than M24:

1. normal headless mode;
2. explicit `--no-sandbox`, `--disable-gpu`, `--disable-dev-shm-usage`;
3. local system D-Bus daemon started at `/run/dbus/system_bus_socket`;
4. Chromium launched inside `dbus-run-session`.

Chromium still times out before DOM or screenshot output. The log reports unavailable
`org.freedesktop.UPower` followed by D-Bus/zygote termination errors. This environment therefore
cannot provide a trustworthy visual-browser pass.

**Result: automated/static browser gate GREEN; visual browser smoke remains external.**
