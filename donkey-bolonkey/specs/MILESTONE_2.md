# Milestone 2 — Crusher and visual timing parity

This milestone ports the gameplay-visible machinery surrounding completed hands without importing historical media from `dkbk.dat`.

## Ported faithfully from the C source

- Exit door timing and the number of doors opened by a completed hand.
- Death-donkey 60-tick lifetime: first half drops below the exit, second half travels into the crusher while rotating.
- Counter decrement only when a death donkey reaches the crusher.
- Funnel endpoints derived from the first and last EXIT block of the active level.
- Crusher position initialized once from the level-1 funnel, matching the original initialization order.
- Red STOP-collision alarm request (100 ms).
- Blue crusher alarm request after death completion (200 ms).
- Alternating level-change alarm for approximately 1.5 seconds.
- Particle-chain cadence from `particle.c`, including same-tick first burst, blood/body velocity model, gravity formula, four-chain limit and 1024-particle cap.
- Particle draw split at `FRAMES_PER_SECOND/4` to preserve crusher layering.
- Historical behavior where simulation continues while the GAME OVER flag is active.

## Reconstructed presentation

Crusher, belt, pulley, gates, particles, donkey shapes, backgrounds and score panel are procedural replacements. They preserve layout/function/timing but are not replicas of the historical copyrighted/uncleared bitmap and audio assets.

## Verification

Automated tests cover:

- six level shapes/parameters;
- spawn timing;
- bubble exchange;
- long deterministic state invariants;
- retry semantics;
- door frame timing;
- fixed crusher position vs recomputed funnel;
- death completion and particle-chain creation;
- same-update first particle burst;
- alarm timing;
- post-game-over simulation.
