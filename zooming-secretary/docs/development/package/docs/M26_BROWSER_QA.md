# M26 — Browser / audio QA

Version: **1.0.0-rc.3**  
Date: **2026-10-12**

## Evidence entering M26

A normal-browser screenshot of M25 showed the game running at desktop size and exposed three polish
issues rather than gameplay defects: duplicated Resume control, duplicated full help text inside the
pause card, and visibly soft/fringed HUD text after canvas scaling.

M26 addresses all three in code. The updated RC3 still needs a fresh screenshot/device check.

## Container checks

- HTTP server: **200 OK**.
- Chromium headless `--dump-dom`: **TIMEOUT / no DOM output**.
- Chromium diagnostics still report missing D-Bus/UPower services and later zygote communication
  failure. Therefore no visual browser pass is claimed from this runtime.

## Audio checks

Automated Web Audio scheduling: **GREEN**.

The M26 fake-`AudioContext` test exercises every runtime sound name, context resume, master gain,
noise generation, event routing and mute behavior. This verifies code execution and scheduling but
cannot prove acoustic output through a user's speakers/headphones.

## External RC3 smoke

- [ ] Pause card has one Resume action; no second Resume button remains in the top bar.
- [ ] Pause text says only how to resume; full keyboard help stays in the footer.
- [ ] HUD labels/counters are crisp and no longer show the M25 system-font fringe.
- [ ] Start cue audible after starting with mouse/touch and keyboard.
- [ ] Ring cue audible.
- [ ] Answer and Miss cues are distinguishable.
- [ ] Pause and Resume cues audible.
- [ ] `M` and the audio button mute immediately; muted game emits no audible cues.
- [ ] Re-enable sound and hear the UI cue.
- [ ] Reload and confirm stored sound preference.
- [ ] Existing desktop/mobile viewport matrix remains no-scroll and usable.
