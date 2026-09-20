# Historical Box2D oracle traces

These CSV files are derived measurement artifacts generated with the libGDX/Box2D native implementation embedded in the preserved Comet Pinball 1.1.0 JAR. The JAR itself is never modified.

Run `tools/oracle/run-oracle.sh` from the project root to regenerate every committed trace.

## Isolated traces

- `freefall.csv`: gravity integration without table collisions.
- `launch.csv`: reset/settle, exact original plunge impulse, launch lane and upper boundary.
- `bumper.csv`: controlled head-on bumper collision and `endContact` force behavior.
- `flipper.csv`: isolated ball/left-flipper contact.
- `flipper-joint.csv`: no-ball revolute-joint press/release trace.
- `launch-contact.csv`: native launch contact normals, points and impulses.
- `flipper-contact.csv`: native isolated flipper contact impulses.
- `flipper-detail.csv`: fixture-level repeated post-solver/TOI diagnostics.

## M7 full-table traces

- `fullgame-state.csv`: deterministic three-ball replay; per-frame ball, both flippers, score and game-state flags.
- `fullgame-events.csv`: callback-order ball contacts, flipper/static contacts, hits, plunges, resets and drains.
- `flipper-corner.csv`: isolated flipper plus `left-flipper-corner` using the full-game input schedule.
- `flipper-corner-contact.csv`: native impulse/manifold observations for that isolated contact.

The full-game oracle currently contains 1,842 state frames and finishes with score 45. The event trace is intended to expose causal divergence, not merely final-score differences.

Contact points are expressed in real-metre coordinates. Contact impulses are divided by Comet's historical x10 coordinate scale so their linear effect is directly comparable with the browser solver's real-metre state.
