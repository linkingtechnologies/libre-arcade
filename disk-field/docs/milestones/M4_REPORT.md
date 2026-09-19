# Disk Field HTML5 M4 — release hardening

## Scope

M4 is a release-hardening pass on the M3 preservation port. It deliberately does **not** modify `engine.mjs`, `levels.mjs`, the historical oracle corpus, or the preserved 1.0/1.01 archives.

Baseline remains Disk Field 1.01, with 1.0 preserved as the PyWeek 5 submission snapshot.

## Changes

### Historically random `Dodge!` selector preview

The 2007 level selector constructs a fresh `World(iSelected)`. Because level 7 / `Dodge!` creates its five moving walls with Python `random()`, the original preview is randomized each time that world is created.

M2/M3 intentionally froze preview construction for repeatability, which was a small presentation mismatch. M4 restores the historical behavior:

- normal play: `Dodge!` preview is random on construction;
- normal gameplay: `Dodge!` remains random on construction;
- `?seed=<value>`: gameplay and preview use deterministic, separate derived seeds for QA.

Preview mode still advances moving environment objects without moving the disk.

### Web Audio fail-soft behavior

Procedural Web Audio is a replacement asset layer, not part of the preserved physics. M4 now degrades silently if:

- `AudioContext` / `webkitAudioContext` is unavailable;
- creation of an audio context fails;
- a context was closed and must be recreated;
- oscillator/gain creation throws;
- a suspended-context `resume()` promise rejects.

Failure of optional audio can no longer prevent gameplay.

### Settings robustness

Language selection now goes through a small pure helper. Only `it` and `en` are accepted from storage; any corrupt or unexpected value falls back to the browser language (`it-*` → Italian, otherwise English).

### Accessibility hardening

- The viewport no longer disables user zoom.
- Pause and sound toggles expose `aria-pressed` state.
- Existing localized labels and live status remain in place.

## Integrity gates

M4 pins and verifies these SHA-256 values:

- `public/js/engine.mjs`: `d5648df0976156e4c57f579fd1dc82f55ab87828916b92b18422478e8afc6b97`
- `public/js/levels.mjs`: `d7d3d032693bd2634c4291989d25f05a1cc571c1e03476f78bf089546355f455`
- historical `DiskField v1.0.zip`: `d0e69dc0c4f07a886de8bd7be3fb474316b7c21af0c23a47e29fe519df4b141d`
- historical `DiskField v1.01.zip`: `e12e14c9ba5a3e92635cb4d0510c245129a97b4576a82aadd8531dfba35ec26f`

This proves that M4's hardening pass did not change the validated simulation/level dataset or the two preserved source archives.

## Regression gate

`npm test` passes:

- 7/7 historical oracle scenarios;
- 85/85 field samples;
- all 17 levels stable for up to 1,200 stress ticks;
- selector preview does not move disks;
- complete monotonic 1→17 progression chain;
- public payload has no quarantined historical font/audio references;
- M4 settings/audio/accessibility checks;
- M4 Dodge randomization check;
- pinned simulation, level-data, and historical-archive hashes.

The numerical oracle envelope is unchanged from M3 because the simulation code is byte-identical.

## Browser execution note

A real Chromium navigation smoke test was attempted in the current build environment. Chromium is installed, but navigation to localhost, `file:` and `data:` URLs is blocked by an administrator browser policy (`ERR_BLOCKED_BY_ADMINISTRATOR`). Browser execution is therefore not claimed as an automated M4 gate. The Node simulation/regression suite remains fully green.

## Remaining release acceptance

No known simulation defect remains. The remaining acceptance items require a human/device rather than more source-level archaeology:

1. complete 1–17 keyboard play-through;
2. touch spot-check on real phone/tablet;
3. short-landscape check on physical mobile hardware;
4. Safari/iOS and Chrome/Android first-gesture audio check;
5. deployment-URL cache/path check.

Until those are exercised, M4 is best described as a **release candidate**, not a fully signed-off final release.
