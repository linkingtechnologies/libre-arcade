# M9 full-game differential report

Oracle: historical libGDX/Box2D from `comet-pinball-1.1.0-b480.jar`.

Replay contract: unchanged M7 deterministic 60 Hz three-ball input script.

## Boundary movement

| Metric | M8 | M9 | Movement |
| --- | ---: | ---: | ---: |
| position error > 1 mm | 87 | 407 | +320 frames |
| position error > 5 mm | 118 | 433 | +315 frames |
| position error > 10 mm | 169 | 437 | +268 frames |
| velocity error > 0.05 m/s | 182 | 434 | +252 frames |
| first scoring mismatch | 183 | 458 | +275 frames |

## Representative state errors

| Frame | Position error | Velocity error | Meaning |
| ---: | ---: | ---: | --- |
| 133 | 7.09e-7 m | 2.54e-6 m/s | obstacle:7 full-world regression |
| 182 | 1.46e-6 m | 3.81e-5 m/s | sling:5 multi-contact TOI reconstructed |
| 305 | 4.52e-5 m | 5.60e-4 m/s | sling:9 reactive-seeded TOI |
| 380 | 1.87e-4 m | 1.42e-4 m/s | obstacle:8 TOI |
| 402 | 2.72e-4 m | 9.35e-3 m/s | right-flipper dynamic TOI |
| 434 | 5.36e-3 m | 2.88e-1 m/s | next material boundary |

## Contact/event differential

The raw first callback mismatch remains frame 6: JS reports `CONTACT_BEGIN ground` one frame earlier than the native callback trace.

After the M9 target region, the first feature mismatch is frame 434:

- native: `CONTACT_BEGIN flipper-right:poly`;
- JS: no matching callback in that frame.

The first scoring mismatch occurs at oracle frame 458 (`HIT sling-reactive:4`, +5) versus the JS event sequence reaching its mismatching hit at frame 478.

## Outcome after the boundary

Historical drains: `602`, `1216`, `1830`; score `45`.

Current JS diagnostic within 3,600 frames: drains `1673`, `3358`; score `435`; only two balls drain in the diagnostic horizon.

These downstream results occur after the known frame-434 material divergence and are not optimization targets.

Machine-readable measurements are in `reports/fullgame-differential.json`.
