# Bubble Train Restoration — Release Candidate checklist

## Automated gate — PASS

Run:

```sh
npm run release:check
```

Current RC result:

- [x] 64/64 Node tests pass
- [x] 3/3 historical archive SHA-256 checks pass
- [x] 66/66 historical `.lvl/.gms` SHA-256 checks pass
- [x] 31/31 clean-asset manifest SHA-256 checks pass
- [x] 8/8 clean historical-theme replacements present
- [x] runnable root/source scan finds 0 references to quarantined historical media
- [x] 61 historical levels load and run
- [x] randomized soak: 183 attempts, 128,589 simulation ticks, no non-finite positions/exceptions
- [x] local HTTP smoke: HTML, JS, SVG, `.gms`, `.lvl` served successfully with expected MIME types
- [x] `public/index.html` + `public/main.js` entry point serves the playable restoration directly at `/`
- [x] player-facing How to play / Come si gioca explains objective, controls, specials and audio toggle
- [x] release root is decluttered; milestone manifests preserved under `docs/manifests/`
- [x] cannon visual rotation matches Left/Right, pointer aim and projectile direction
- [x] sound-off path disables procedural cues/music
- [x] opening Options/Fastest Times pauses gameplay music together with simulation

## Manual release gates — PENDING

These require external environments and must not be marked complete without actual observation.

### Historical executable parity

Direct static executable comparison is complete:

- [x] identify/hash actual OS4 1.0final PowerPC executable
- [x] identify/hash actual GP2X/GBAX ARM executable
- [x] direct disassembly confirms line/track-adjacent core mechanics and frame ordering
- [x] direct disassembly confirms 3+ matching, Bomb, Colour Bomb, Rainbow, Speed and ripple behavior
- [x] direct disassembly confirms cannon step/limit/length and no wall-bounce projectile motion
- [x] GP2X-to-OS4 data comparison classifies 0.4 geometry/speed scaling and handheld tuning separately from upstream baseline
- [x] executable-derived constants locked by regression tests

Live runtime differential checks remain pending:

- [ ] boot/run original OS4-compatible Bubble Train (or validated equivalent historical runtime)
- [ ] capture first-spawn timing at 25 Hz
- [ ] capture line/arc/spiral motion frame-by-frame
- [ ] visually compare collision/insertion side and 3+ removal timing
- [ ] visually compare Rainbow cadence and Speed behavior
- [ ] compare pause/timer and retry/credits/campaign transitions

### Browser/device matrix

- [ ] Chromium desktop
- [ ] Firefox desktop
- [ ] Safari/WebKit desktop/mobile
- [ ] Android Chromium/touch
- [ ] iPhone/iPad Safari/touch if available
- [ ] portrait phone
- [ ] landscape phone / short viewport
- [ ] keyboard controls
- [ ] mouse/pointer controls
- [ ] touch controls
- [ ] sound enabled/disabled and first-gesture audio unlock
- [ ] IT and EN layouts
- [ ] Fastest Times persistence

## Release labeling

Until live runtime parity and the browser/device matrix are completed, publish as:

**Bubble Train Restoration — Release Candidate**

Do **not** call it “parity-certified” or a final historical preservation release yet.

## Audio unlock/volume regression

- [x] Effects queued while `AudioContext` is suspended are replayed after unlock.
- [x] Audio unlock is retried on pointer, touch and keyboard input.
- [x] Procedural music bus no longer uses the near-muted double attenuation from M11.
- [ ] Manual audible verification on the target browser/device.
