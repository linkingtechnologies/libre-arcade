# Milestone 1 — faithful engine core

Status: **implemented and testable**, not yet a full game release.

## Included

- Pure JavaScript ES modules, no framework and no runtime dependencies.
- Fixed-step target documented at 25 Hz (40 ms); the diagnostic viewer runs that simulation cadence independently of rendering.
- Clean-room XML parser for `.lvl` and `.gms` schema.
- `line`, `arc`, and source-derived exponential `spiral` track primitives.
- Forward/backward section transitions, crash at path end, return-to-station at path start.
- Bubble radius 15, diameter 30, touch threshold 31.
- Train split/connected-segment motion.
- 15 px backward + 15 px forward insertion ripple.
- Centre-distance collision threshold <=30.
- Same-colour touching groups of 3+ and speed-bubble match exclusion.
- Bomb radius 60 and colour-bomb removal behavior.
- Station spawning only after the rear carriage clears the start by >30 px.
- Seeded gameplay RNG and factory rule preventing generated initial triples.
- Cannon straight-shot geometry and projectile screen culling; no wall bounce.
- Minimal `LevelModel` win/loss state.
- Clean geometric diagnostic viewer; **no original audiovisual assets or original level layouts are used**.

## Deliberately deferred

- Exact special-bubble timers/animation state (rainbow and speed expiry).
- Exact original bullet/carriage availability-count semantics for every XML special-population combination.
- Campaign credits, fastest-times persistence, pause-aware timer and configuration UI.
- Renderer/audio/UI parity.
- Runtime comparison against the native executable.

## Fidelity notes

The spiral movement intentionally uses the audited discrete step (`angle += distance/currentRadius`) rather than a mathematically exact logarithmic-spiral arc-length integral. `insertionSide()` is implemented as projection onto the local path tangent, the clean-room geometric equivalent inferred from the audited section-specific behavior; it remains flagged for native runtime parity on line/arc/spiral.

The deterministic RNG does **not** claim to reproduce any particular C library's numeric `rand()` sequence. C `rand()` is implementation-defined. It preserves the game's random-selection role while making tests/replays reproducible.

## Verification

Run:

```sh
npm test
```

Milestone freeze result: **26 tests passing**.

Run the diagnostic viewer:

```sh
npm run serve
```

then open `http://127.0.0.1:8080/demo/`.
