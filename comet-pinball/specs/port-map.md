# Port map: Comet Pinball 1.1.0 (Java, libGDX, Box2D) to JavaScript

Baseline: release `1.1.0` (build 480), source commit `2d0a2865ab7243a476f1f7a6eab4d23b267e2135` of `boskoop/comet-pinball`. Java paths below are relative to `src/game/` in that repository and are the source anchors the port was written from (`reference/source-urls.md`). The port is a clean-room reimplementation, not a transcription: the original delegates to Box2D, while `public/js/physics.js` reimplements the parts of Box2D 2.2.x that this table exercises.

## Verification level

Per the collection's verification hierarchy (`../../AGENTS.md`):

- **Isolated contacts: level 1, executable oracle.** The original release is driven by the Java programs in `tools/oracle/` and its per-step state is compared with the port (`reference/oracle/*.csv`, `reports/oracle-m*/`). Recorded results include free fall, a bumper head-on, the launch lane, the left flipper, the revolute joint, the frame-57 flipper/corner contact (native normal impulse `3.575747013`, port `3.575741215`) and the frame-133 `obstacle:7` circle/polygon TOI. Method and numbers: `PARITY.md`.
- **Full three-ball replay: not certified.** A deterministic 60 Hz input script (`FULLGAME-REPLAY.md`) yields, natively, 1,842 frames, drains at frames 602, 1216 and 1830 and a final score of 45. The port's trajectory departs from it near frames 407 to 434, after which its later drains and score differ. The engine is deliberately not tuned toward the target score.
- **Boundaries added after the replay work: level 1 for the cases measured, open elsewhere.** The playfield-side divider, the central ceiling, the upper curves after bumper impacts and the lower launch corridor were compared with native one-step fixtures (`M13.9-BOUNDARY-ORACLE.md`, `reports/M13.10-*`, `M13.11-*`, `M13.12-*`). Entry from above and states embedded in a wall are not certified.
- **UI, camera, audio, language, input: level 3.** New presentation code checked by the Node tests with simulated DOM and audio (`tests/ui-smoke.js`, `m13*-*.js`, `i18n.js`) and, before the layout change, by the Python Chromium gates.

`public/js/physics.js` and `public/data/playfield.js` are the validated engine baseline. `MANIFEST-SHA256.txt` records their hashes; change them only together with the affected regression tests and oracle comparisons.

## Modules

| Java (upstream) | JavaScript | Notes |
|---|---|---|
| `desktop/playfields.xml` | `public/data/playfield.js` (`COMET_PLAYFIELD`) | Lossless translation: 3 bumpers (ids 1 to 3), 4 slingshots (ids 4, 5, 9, 10), 3 obstacles (ids 6 to 8). Scores: bumpers 20 points, slingshots 4 and 5 five points; slingshots 9 and 10 have no scoring rule. The schema could describe several playfields; the original loads only the first |
| `physics/PhysicsDefinition` | `constants` in `physics.js` | Frozen constants: 0.76 by 1.40 m field, ball radius 0.0135 m, steel restitution 0.56, ball friction 0.4, ramp 7 degrees, 6 velocity and 2 position iterations, TOI Baumgarte 0.75 with 20 iterations |
| `physics/PhysicsPlayFieldImpl` | `Engine`, `makeGeometry` | World construction and stepping. The original's Java/Box2D world is scaled by 10; the port works in metres |
| `physics/ball/Ball` | `makeBall`, `resetBall`, ball state in `Engine` | The original ball is a bullet body; the port reproduces its continuous behavior with TOI solvers (`solveBall*TOI`) |
| `physics/ball/GroundSensorElement` | `ground` polygon in `makeGeometry`, `drainLatched` in `Engine` | Drain detection; `onDrain` in `comet.js` counts the ball |
| `physics/element/FieldBoundsElement`, `FieldTopCornerElement`, `FieldBottomCornerElement` | static polygons in `makeGeometry`, `solveBallTopCurveTOI`, `solveBallPolygonTOI` | The upper corner arcs are segmented polygons (30 fixtures); their post-impact behavior needed the M9 and M13.9 to M13.12 work |
| `physics/element/PlungerTubeElement` | launch lane in `makeGeometry`, `solveBallLaneCoupledTOI`, `Engine.plunge`, `PLUNGE_DV` | Plunge impulse 1.962 m/s; one plunge per second at most |
| `physics/element/FlipperElement` | `makeFlippers`, `beginFlipperStep`, `solveFlipperVelocityConstraint`, `updateFlipper`, `solveBallFlipperTOI`, `findFlipperCornerTOI` | Flippers are driven by direct angular velocity (left +50 / -15 rad/s, right the mirror image), not by torque; each flipper is a dynamic body on a revolute joint |
| `physics/placable/Bumper`, `BumperElementFactoryImpl` | circles with `kind:'bumper'`, `BUMPER_ACCEL_PHYSICAL` | Circular contacts use an adaptive CCD path |
| `physics/placable/Slingshot`, `SlingshotElementFactoryImpl` | polygons and circles labelled `sling-*`, `solveBallSlingTOI` | **Historical bug kept:** the reactive side applies the bumper force (200 in scaled units), not the separately declared slingshot force (300) |
| `physics/placable/Obstacle` | polygons labelled `obstacle:*`, `solveBallPolygonTOI` | Obstacles 7 and 8 have dedicated oracle tests |
| `logic/simulation/SimulationManager`, `logic/state/SimulationState`, `presentation/screens/GameScreenImpl` | game flow in `comet.js` (`newGame`, `onPlunge`, `onDrain`, `resetBall`, `fireScore`) | Three balls, score from `COMET_PLAYFIELD.scores`, high score kept locally |
| `application/.../pinball.properties` (key bindings, physics properties) | key bindings in `comet.js`, constants in `physics.js` | The original keys: Tab and Enter for the flippers, Space to plunge. The port adds arrows, A/D, Z/L/M and touch |

## Deliberate departures from the original

- No libGDX, LWJGL or Box2D: Canvas 2D and Web Audio, no framework, no build step.
- New presentation: a follow-ball or whole-table camera, synthesized effects, replacement artwork, a credits screen.
- Controls extended for web keyboards and simultaneous two-finger touch.
- The second and third balls are prepared automatically after a short notice; launching stays manual.
- A player-confirmed way to end a stuck ball. A stationary pocket in the upper-left field was reproduced on the native engine too, so the port does not silently move the ball.
- English and Italian interface with a saved preference.
- Royalty-free background music, which the 2013 game did not have.
