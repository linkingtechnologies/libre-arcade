# HighMoon 1.2.4 — Phase 3: native physics/AI oracle

## Status

**Oracle core: PASS. HTML5 port: not started.**

The HighMoon 1.2.4 source has been preserved untouched under `reference/HighMoon`. Instrumentation lives in a separate tree and is enabled only with `-D__ORACLE_TRACE__`. The historical `Makefile` in the instrumented tree remains byte-identical to the reference; tracing uses the additional `Makefile.oracle` or the dedicated headless build.

## Native-core runner

The native headless runner compiles these original HighMoon translation units directly:

- `vector_2.cpp`
- `object.cpp`
- `graphics.cpp`
- `galaxy.cpp`
- `shoot.cpp`

It replaces SDL with a minimal fake backend that allocates surfaces, reads the real GIF dimensions, and discards screen blits. This keeps original sprite, `Planet::draw`, `Stone::draw`, star/shooting-star/Goldrain, and RNG-consuming presentation code executing. Audio is a no-op stub because it does not drive simulation/RNG.

A full historical SDL 1.2 executable was not built in this environment because SDL 1.2 development tools/headers are absent. The oracle therefore targets the original simulation + presentation-side state changes, not the platform window/audio stack.

## Exact physics regression

Fixed scenario:

- startup seed: `12345`
- galaxy seed: `54321`
- top-level objects: `6`
- start: `(130,384)`
- power: `70`
- angle: `0°`
- initial speed: `210`

The native Laser reaches the opposing UFO after **102 integrated ticks**. Per tick the trace contains `step_begin`, six `gravity` records, and `step_end`: **816 physics events** total.

The independent headless mirror, compiled against the original `vector_2.cpp`, matches all 816 events **exactly**, including every stored IEEE-754 bit pattern.

The same native scenario using Heavy also matches the Laser's 816 physics events exactly. This confirms from execution, not just code reading, that Heavy does not have a different gravitational trajectory. Its larger projectile weight only changes damage.

Laser final impact:

- projectile speed: `238.2414207041286`
- shield: `100 -> 77`
- collision position: `(925.0988713306975, 392.0050165116002)`

Heavy at the same physical impact state:

- projectile speed: `238.2414207041286`
- projectile weight: `2`
- shield: `100 -> 53`

## Polar round-trip fidelity finding

HighMoon does not persist projectile velocity purely as Cartesian `(vx,vy)`. `Laser`, `Heavy`, and `Cluster` persist speed + direction and rebuild a polar `Vector_2` before a later tick. This can alter a Cartesian component by one IEEE-754 bit even though the mathematical vector is equivalent.

The independent mirror therefore has a `--projectile-roundtrip` mode. Without preserving this historical representation detail, a future port can slowly drift even when the gravity formula itself is correct.

## CPU oracle

For the stored AI scenario (same galaxy seed, factor `3`), the original solver evaluates **7 candidate shots**. The first six are rejected; the seventh is accepted:

- y: `186`
- power: `49`
- angle: `5.007250780876458` radians
- remaining search counter: `144`

That shot hits UFO 1 with projectile speed `200.8445389673785` and changes shield `100 -> 80`.

The trace contains:

- 7 `shoot_path_begin` / `shoot_path_end` searches;
- 4,350 simulated physics ticks;
- 26,100 individual gravity-body contributions;
- 13,889 historical RNG consumptions;
- one accepted `fire_command`, one actual projectile activation, and one target collision.

This directly demonstrates that the CPU opponent is a stochastic brute-force trajectory solver that calls the historical physics repeatedly rather than an analytic/heuristic-only aimer.

## Cluster oracle

The stored Cluster trace records the parent impact and all five actual Laser activations. Parent impact speed is `238.2414207041286`; each fragment starts at `142.94485242247714`, exactly 60% of the parent speed.

Recorded fragment directions are:

- `1.5623905011057673`
- `2.085989167772434`
- `2.6095878344391004`
- `3.133186501105767`
- `3.6567851677724335`

They are separated by 30° and correspond to the historical asymmetric `-75°, -45°, -15°, +15°, +45°` construction relative to the impact vector.

## Wormhole oracle

A targeted shot confirms the actual wormhole side effect:

- collision position: `(749.209880099276, 91.57115027903862)`
- teleport destination: `(1117.3167170882225, -243.37807250022888)`
- speed before/after: `70.86151124180897`
- direction before/after: `0.23576558163013847`

The wormhole moves the projectile but does not deactivate it; the trace continues after teleport.

## RNG fidelity

All source-level `rand()`/`srand()` gameplay calls were routed through wrappers only when `__ORACLE_TRACE__` is enabled. The wrapper calls the historical RNG exactly once and does not consume any additional random values. A direct-vs-wrapped test confirmed the first 16 values for seed `1234` are identical.

Because rendering consumes the same global RNG stream as galaxy generation and AI, the native-core runner executes original `graphics.cpp` rather than replacing it with an approximate visual stub.

## Source guard

The regression refuses to silently represent a modified game if the key historical routine changes. Current fingerprints:

- `Galaxy::calculate_nextPos()` chunk SHA-256: `5386e7b806b3f6802d4ea25963b4900ba517528826d33107cab4e09b677cee12`
- original `vector_2.cpp` SHA-256: `b8ad58981effd44fa1dc6c764d86d6030dd62bcce8262cc2d79275135f6b6313`

It also checks the literal 30 ms interval, distance calculation, `weight/distance` law, contribution summation, velocity update, and position update.

## Preservation conclusion

The central HighMoon simulation and its CPU opponent are now reproducible enough to serve as a reference oracle for a future port. The next technical phase can be a clean-room/behavior-preserving JavaScript simulation checked against these JSONL traces. That should still wait for the explicit decision to begin the HTML5 port; this phase deliberately stops at the oracle.

The remaining release blocker is still asset provenance/licensing, not physics fidelity.
