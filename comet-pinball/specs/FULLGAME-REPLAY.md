# Deterministic full-game replay contract (introduced in M7, unchanged through M9)

The replay compares the HTML5 reconstruction with the historical libGDX/Box2D engine over a deterministic three-ball game.

## Clock and input script

- Fixed time step: 1/60 s.
- A new/reset ball settles for 12 frames, then receives the original plunger impulse.
- Left flipper schedule relative to plunge: each 96-frame cycle presses frames 42..48 and 72..77.
- Right flipper schedule: frames 54..60 and 78..83.
- Twelve frames after a drain, reset/continue semantics are applied if another ball remains.
- The native replay stops twelve frames after the third drain.

This is a deterministic test script, not a reconstruction of human play.

## Historical oracle

`reference/oracle/fullgame-state.csv` contains per-frame ball state, flipper state, score, ball number and plunge/drain state. `reference/oracle/fullgame-events.csv` contains ordered callbacks and gameplay events.

The preserved oracle produces:

- 1,842 state frames;
- 532 ordered events;
- drains at frames `602`, `1216`, `1830`;
- final score `45`.

## M9 status

M9 reconstructs several boundaries that remained after M8: the segmented top-curve lifecycle, sling 5 and sling 9 multi-contact TOI islands, the sweep-born left wall, `obstacle:8`, and the frame-402 ball/right-flipper dynamic TOI island.

| Metric | M8 | M9 |
| --- | ---: | ---: |
| position error > 1 mm | 87 | 407 |
| position error > 5 mm | 118 | 433 |
| position error > 10 mm | 169 | 437 |
| velocity error > 0.05 m/s | 182 | 434 |
| first scoring mismatch | 183 | 458 |

The next material contact-feature divergence is frame 434: the native trace begins `flipper-right:poly`, while the JS trace has no matching callback. The older ground callback timing mismatch at frame 6 is retained as a separate diagnostic.

The replay is still a differential diagnostic, not a claim of complete three-ball equivalence. Later drains and score are not tuned once the trajectory crosses the known material boundary.
