# Heal'em All: parity test plan

**Claim policy:** no parity is claimed in M1. Only the *baseline* exists. A restored build may be called "behaviourally equivalent" for an
item only after the item's test below passes against the unmodified original and the restored build with identical inputs.

## Status after M2 to M4
P1-P3, P5-P8 (M2) and P4, P9, P10, P11, P12 (M3) are implemented in `tools/probe-original.js` and `tools/probe-m3.js` and run by `tools/browser-gate.mjs` and `tools/m3-gate.mjs`: **identical** on the original and the restored page. P12 (zombie-mode controls) is no longer unknown: controls are active after the intro, speed 140 px/s, jump -500. P10: the restore position after leaving the map is not asserted. Not done: recorded playthroughs of levels 4-6, Firefox/Safari.

## Feasibility (proven in M1)

Deterministic stepping works on the unmodified original: with `Q.pauseGame()`, `Math.random` replaced by a seeded generator, and
`Q.stageGameLoop(1/60)` called by hand while setting `Q.inputs.*`, two runs produced identical trajectories (`tools/probe-original.js`).
Real-time input and rendering work in headless Chrome (`tools/realtime-baseline.mjs`). So parity can be tested deterministically.

## Test layers

### 1. Core tests (Node `node --test`, no browser needed, optional)
The probe runs inside a page because `game.js` needs a DOM and canvas. Two options for M3: (a) keep the page-based probe, driven by Playwright; (b) load Quintus + `game.js` in `jsdom`/stubbed canvas. Prefer (a): same engine, fewer fakes.

| ID | Rule | Method | Baseline already captured |
|---|---|---|---|
| P1 | Walk speed 330, jump -660, apex ~217 px, hitbox | fixed-step | yes (`movement`) |
| P2 | Healing: 1 bullet → Human, counter -1 | fixed-step | yes |
| P3 | Human grace 4 s then re-infection → `wasHuman` zombie; shot again → DeadZombie | fixed-step | yes |
| P4 | Bullet range = `Q.width/2` | run at 640x320 and 1280x720 viewports; record the stopping x | no |
| P5 | Contact damage with 1 s invincibility; 3 lives → zombie mode | fixed-step | yes |
| P6 | Zombie mode ends off-map → player with 3 lives `wasZombie`; second death → game over | fixed-step | yes |
| P7 | Zombie sight 350 px / ±10 px; 60 px/s patrol; ledge turn | fixed-step | partly (sight, speed) |
| P8 | Per-level counts and randomised variants (levels 1-6) | fixed-step, 40 seeds | yes (`levels`, `random_variants`) |
| P9 | Stars thresholds 0.5 / 0.9 and unlock/save in `localStorage` | call summary scene with healed/available pairs | formula in source only |
| P10 | Fall damage `vy > 1100`; out-of-map respawn at saved position | fixed-step | no |
| P11 | Door/key logic and level completion | fixed-step | no |
| P12 | Zombie-mode controls activation (spec unknown) | fixed-step | no |

### 2. Browser tests (Playwright + Chrome, real input)
Enter/click menu flow; held arrows; Space fire; P pause; touch emulation tap on buttons; resize/orientation behaviour (post-C6); 60 Hz loop;
no console errors; no network request leaves origin (post-C3/C4); offline reload after a Service Worker install (M4).

### 3. Visual tests
Screenshots of fixed states at 1024x768 and 812x375 (baseline set already in `evidence/screenshots/`). Compare original vs restored pixel-wise **after** fonts are localised and the viewport is fixed; allow a small tolerance for text anti-aliasing. Because localisation (IT/EN) alters text, visual comparison of text screens is done on the default English build only.

### 4. Regression tests
The P-tests above, frozen with their recorded outputs as expected values. Any intentional change (e.g. a documented fix) updates the expectation in the same commit with a reason.

## Parity method (original vs restored)

1. Run the same script on both builds: seed, viewport, input timeline (frame → keys).
2. Record every N frames: player x, y, vx, vy, lives, counters, sprite lists by class, `Game.currentScreen`.
3. Diff the traces; any difference must be explained by a change recorded in `COMPATIBILITY-ISSUES.md`.
4. For audio-less builds, compare with `AudioManager` calls stubbed on **both** sides (record the call list: it is part of the original behaviour).

## Known limits of this plan
Win paths for levels 4-6 need a scripted player or recorded input; plan to record them by hand in real Chrome and replay them. Pixel parity of canvas text depends on identical fonts. Safari/iOS audio and touch cannot be covered by this harness.
