# Architecture

The port keeps behavioural state independent from Canvas and replacement art.

```text
rng.js
  glibc rand()/srand() sequence
    |
galaxy.js
  procedural bodies + collision geometry + body-internal visual state
    |
historical-runtime.js
  historical draw-time state/RNG mutations, but no original rendering
    |
simulation.js
  gravity + speed/angle round-trip
    |
world.js
  primitive Laser/Heavy collision order + body/UFO hit effects
    |
game-shot.js
  playable Laser/Heavy/Cluster lifecycle + Extra collision
    |
ai.js
  integer-quantized path oracle + CPU Monte Carlo state machine
    |
game-controller.js
  fixed 30 ms turn/game state machine + modes + bonus + winner
    |
game-app.js
  keyboard/touch input + clean-room Canvas presentation only
```

## Simulation authority

Canvas and replacement artwork never define collision radii, gravity weights,
RNG consumption order, physics timing, AI target geometry or weapon damage.
Historical geometry and state live in simulation modules.

## Why `historical-runtime.js` exists

HighMoon 1.2.4 couples rendering and gameplay through one process-global
`rand()` stream. Storm/Wormhole effects, Star blinking and Extra animation can
therefore change the random values later seen by the CPU solver.

The port preserves those state mutations and RNG calls without preserving the old
pixels. Clean-room rendering can therefore look different while the gameplay
still follows the reference decision stream.

## Oracle strategy

Tests combine literal source-semantics tests, native fixtures extracted from the
Phase 3 C++ oracle, full-turn determinism checks, controller tests and a
long-running CPU-vs-CPU smoke test.

Floating-point deviations attributable to JavaScript vs C++ `libm` remain
measured and visible. They are never hidden with empirical constants.
