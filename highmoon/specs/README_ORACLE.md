# HighMoon 1.2.4 — preservation oracle

This bundle preserves an untouched extraction of HighMoon 1.2.4 and a separate instrumented copy used only to produce deterministic JSONL traces.

## Layout

- `reference/release/highmoon-1.2.4.tar` — exact uploaded TAR payload (browser-decompressed from the historical `.tar.gz`).
- `reference/HighMoon/` — untouched extracted HighMoon 1.2.4 tree.
- `instrumented/HighMoon/` — copy with opt-in `__ORACLE_TRACE__` instrumentation.
- `instrumentation.patch` — complete diff from reference to instrumented copy.
- `oracle/native_headless/` — runner that compiles original `vector_2.cpp`, `object.cpp`, `graphics.cpp`, `galaxy.cpp`, and `shoot.cpp`; SDL rendering is replaced by a fake framebuffer/image loader and audio by a no-op stub.
- `oracle/src/highmoon_physics_oracle.cpp` — independent physics mirror using the original `vector_2.cpp` and the exact arithmetic order of `Galaxy::calculate_nextPos()`.
- `oracle/tools/` — builders, source guard, JSONL validator and exact comparator.
- `oracle/native_headless/samples/` — authoritative native-core traces.

## Build and regression

```sh
./oracle/tools/regression_native_vs_mirror.py
```

The regression:

1. checks the historical source guard;
2. builds the independent mirror;
3. builds the native-core runner;
4. runs a fixed Laser shot in the original simulation core;
5. reconstructs the same shot in the independent mirror;
6. requires exact JSON equality for all physics events, including IEEE-754 bit patterns;
7. repeats the native shot as Heavy and requires the same gravitational path.

## Native trace example

```sh
HIGHMOON_ORACLE_JSONL=/tmp/highmoon.jsonl \
  ./oracle/native_headless/bin/highmoon-native-headless \
  --root ./reference/HighMoon \
  --startup-seed 12345 \
  --galaxy-seed 54321 \
  --objects 6 \
  --mode laser \
  --ticks 700 \
  --power 70 \
  --angle-deg 0 \
  --settle
```

Use `--mode ai --ai-factor 3` for the CPU solver, `--mode heavy`, or `--mode cluster`. `--start X,Y` can place a projectile for targeted collision tests such as the wormhole sample.

## Important fidelity rule

HighMoon projectiles store speed + direction and reconstruct a polar `Vector_2` between ticks. The independent mirror therefore needs `--projectile-roundtrip` when compared bit-for-bit to native Laser/Heavy/Cluster traces. Carrying the Cartesian velocity directly can diverge by one IEEE-754 bit and then drift over time.
