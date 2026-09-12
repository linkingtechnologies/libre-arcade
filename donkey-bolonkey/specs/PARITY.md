# Parity matrix

| Area | Historical behavior | Web status |
|---|---|---|
| Logical update rate | 60 Hz | Implemented |
| Level size | 16×9 | Implemented |
| Levels | 6 | Implemented |
| Level flags | L/U/R/D/HOME/EXIT/STOP/BUBBLE/TRAP | Implemented |
| Spawn parameters | Per-level | Implemented |
| Movement speed-up after valid hand | Per-level countdown to minimum | Implemented |
| Donkey move passes | EXIT → OTHERS → STOP | Implemented |
| Ordered hand matching | Row-major EXIT cells | Implemented |
| Scores | 3=50, 4=150, 5=400, 6=1600 | Implemented |
| Bubble exchange | Active bubble ↔ adjacent trap | Implemented |
| Counter decrements | After 60-tick death animation | Implemented |
| Level progression | Counter reaches zero | Implemented |
| Game over on occupied HOME | Yes | Implemented |
| Simulation after game over | World keeps updating behind overlay | Implemented |
| Death trajectory | 30 ticks down, then 30 ticks toward crusher | Implemented |
| Door animation | 0→1→2→0 sprite-state timing over ~1 s | Implemented with procedural gate art |
| Funnel geometry | Recomputed from first/last EXIT cell | Implemented |
| Crusher position | Initialized once from level 1 funnel | Implemented |
| Crusher pulley | Continuous rotation | Implemented procedurally |
| Red alarm | STOP collision, 100 ms request | Implemented |
| Blue alarm | Completed death, 200 ms request | Implemented |
| Crazy alarm | Alternates lamps for ~1.5 s on level change | Implemented |
| Blood/body particles | Historical time, gravity, chain cadence and 1024 cap | Implemented with procedural shapes |
| Particle layering | <15 ticks before crusher, >=15 ticks after crusher | Implemented |
| Original sprites/backgrounds | Allegro datafile | Intentionally not used |
| Original audio | Allegro samples | Intentionally not used |
| Audio event semantics | title/motor/bubble/scream/crush/alarm | Implemented with clean synthesized replacement timbres |
| Title timing/state | Zoom/background/prompt timing from `title.c` | Implemented with procedural replacement art |
| Warning/controls/credits flow | Historical blocking screens | Implemented as browser state screens |
| Rotating banners | Five slots, 6 s trigger, interference/steady/collapse | Timing implemented with procedural motifs |
| Hi-score table | 10 entries, strict insertion, editable name | Implemented + localStorage persistence |
| Final flow | Credits then hi-scores | Implemented |
| Best-score persistence | Not browser-native historically | Web adaptation via localStorage |
| Previous-bubble button | Not in original | Web convenience |
| Tap-to-advance intro/credits | Keyboard/blocking screens historically | Web touch adaptation |
| Mobile high-score text field | Direct Allegro keyboard input historically | Web input adaptation preserving 22-char ASCII result |
| Responsive 4:3 viewport fitting | Fixed native 320×240 logical surface | Web presentation adaptation |
| Screen-reader status/focus | Not present historically | Web accessibility adaptation |
| Level-transition death reset | `reset_level()` → `init_donkeys()` clears pending deaths | Implemented |
| Final internal level | increments to 7 before failed final reset | Implemented |
| Six-level end-to-end state progression | levels 1→6→FINAL | Deterministic automated test |
| Native Allegro executable trace | Historical binary/runtime | Not yet available in this environment |
| Exact C `rand()` sequence | libc-dependent global RNG | Not implemented |
| Render-time RNG coupling | Original drawing consumes `rand()` for crusher jitter | Intentionally decoupled from gameplay RNG |

## Milestone 2 notes

The original draw order is preserved structurally: level/funnel → donkeys/death donkeys → young particles → crusher → older particles → player/bubbles/score UI. Runtime graphics remain clean-room procedural replacements and do not load `reference/dkbk/dkbk.dat`.

The original uses the same global C `rand()` for gameplay and some visual effects. The web port deliberately does not let decorative renderer jitter consume gameplay RNG because libc `rand()` is not portable across historical platforms. Exact RNG parity remains a separate future research task.

## Milestone 3 trace status

A source-derived deterministic level-1 trace is now checked in under `test/fixtures`. It validates selected movement/spawn/banner timing boundaries against a fixed oracle anchored to the preserved C source. This is not yet a native executable trace.

## Milestone 4 trace status

The source-derived trace remains green, and an additional end-to-end state test now crosses all six levels through the same counter/death transition path used by the game. Audio event semantics are implemented with newly synthesized Web Audio timbres. A native Allegro executable could not be built in this environment because Allegro 4 development headers/libraries are absent.

## Milestone 5 production status

Browser-only interaction adaptations now include tap-to-advance screens, a mobile high-score input field, responsive 4:3 canvas fitting and accessibility announcements. These are intentionally outside the historical simulation and do not change the deterministic gameplay core.

## Next parity target

Build an instrumented Allegro 4 reference executable in a suitable external environment and capture tick-by-tick C traces; then compare scripted input runs against the JavaScript core.
