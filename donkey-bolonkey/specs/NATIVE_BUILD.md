# Native Allegro build / trace status

The preserved source targets Allegro 4. The current workspace contains GCC 14.2, but no Allegro development installation was available during Milestone 4: no `allegro.h`, no `allegro-config`, and no Allegro pkg-config module were present.

A native executable was therefore **not** produced here and no claim of binary trace parity is made.

Current Debian package metadata still lists `liballegro4-dev` (Allegro 4.4.3.1), which makes a future native build practical on a suitable Debian/Ubuntu-compatible environment.

## Future trace protocol

1. Build a copy of the historical source without modifying `/reference/dkbk` in place.
2. Add an optional trace-only instrumentation patch outside `/reference` that logs per-tick level, counter, score, donkey coordinates/colors, bubble state, move/add timers and game-over/final flags.
3. Use a fixed RNG shim for the instrumented C build so traces are repeatable.
4. Feed equivalent scripted inputs to C and JavaScript.
5. Compare traces tick-by-tick, separating simulation differences from renderer-only RNG.
