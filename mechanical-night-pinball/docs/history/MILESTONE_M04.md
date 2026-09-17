# M0.4 — Box2D physics calibration

## Method

A small C++ reference harness was compiled locally against the exact Box2D 2.3.2 sources preserved in the final DocDonkeys commit. It reproduces the original 1/60 s step, 6 velocity iterations, 2 position iterations, 50 px/m scale, gravity, fixture restitution, joint geometry and motor commands.

The JavaScript solver was then calibrated against deterministic micro-scenarios rather than by visual feel alone.

## Reference observations

| Scenario | Box2D reference | M0.4 / tolerance |
|---|---:|---:|
| Free fall after 60 frames | vy 350.000 px/s | exact gravity contract |
| Oblique wall rebound | vy -102.250 px/s | within 0.05 px/s |
| Oblique wall spin | 11.164 rad/s | within 0.08 rad/s |
| Big bumper (e=1.75) | vy -596.458 px/s | within 0.05 px/s |
| Left kicker (e=4.0) | vy -1363.333 px/s | within 0.05 px/s |
| Left flipper first powered frame | -14.159°, -14.965 rad/s | angle within 0.2°, omega within 0.03 |
| Left flipper lower resting slop | about -47° | within 0.02° |
| Plunger first held velocity | +16.046 px/s | within 0.02 px/s |
| Plunger first return velocity | -219.095 px/s | within 0.03 px/s |
| Full launcher peak | -689.582 px/s | -686.881 px/s (~0.4%) |
| Ball maximum launcher depth | 787.632 px | 787.433 px (~0.2 px) |

## Important archaeological finding

`CreateAttacherBody()` creates a real static circular fixture for each flipper and for the plunger. Although visually hidden, those fixtures collide with the ball. The plunger attacher at (412, 801) is especially important because it prevents the ball from dropping too deeply while the plunger is held. Omitting it made the M0.3 launch too energetic.

## Remaining limits

M0.4 is still a custom solver. It is not Box2D compiled to WebAssembly and is not expected to preserve every chaotic trajectory indefinitely. Remaining parity work should focus on long multi-contact trajectories and edge cases rather than retuning the basic gravity, bumper, flipper and launcher constants.
