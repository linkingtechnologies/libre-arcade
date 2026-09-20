# HighMoon 1.2.4 — Physical oracle plan

The oracle must instrument the historical C++ source, not reimplement it first. Instrumentation must not add any `rand()` calls or change simulation order.

## Reference build metadata
Record compiler and flags, OS/libc, architecture, endianness, SDL/SDL_image versions, `sizeof(double)`, `RAND_MAX`, archive SHA-256 and a short fingerprint of `rand()` outputs after `srand(1)`.

## Event stream
Use JSONL. Emit `run_meta`, exact world state, RNG calls, `shot_start`, one `tick` per live integration step, per-body gravity contributions, collisions/teleports, cluster spawns, damage and `turn_end`.

For every double, record decimal with 17 significant digits and the raw IEEE-754 64-bit payload (`x_bits`/`y_bits`). This avoids false mismatches from text formatting.

## Instrumentation points
- `Galaxy::create`: seed and final top-level object state after generation.
- `Ufo::shoot`: player, exact start vector, angle, power, weapon.
- `Galaxy::calculate_nextPos`: position/velocity before; each object's position, weight, distance and delta-v; summed delta-v; final position/velocity.
- `Galaxy::has_collision`: object order and first collision selected.
- `Wormhole::hit`: position before/after teleport; velocity is unchanged.
- `Cluster::hit`: exact five child start vectors and angles.
- `Ufo::hit`: shield before, speed, projectile weight, integer damage, shield after.
- `Shoot::move`/subclasses: timeout vs collision vs cluster-complete turn end.
- Wrap every historical `rand()` call with a logger that calls libc `rand()` exactly once and returns the unmodified value. Rendering calls must be logged too because they share the gameplay RNG stream.

## Required regression cases
1. ordinary Laser under one dominant planet;
2. multi-body gravity superposition;
3. Storm repulsion (`weight=-100`);
4. Wormhole attraction + teleport;
5. planet collision and subsequent planet displacement;
6. moon/ring collision proving that child bodies collide but do not contribute gravity;
7. self-hit/returning trajectory;
8. Heavy vs Laser with identical launch state: trajectory equality, damage difference;
9. Cluster split: angles -75,-45,-15,+15,+45 degrees relative to impact vector and child speed 0.6× parent speed;
10. 699 integrated live steps before normal timeout;
11. CPU search on all five strengths with fixed reference RNG stream;
12. CPU 151-failure fallback;
13. cached `calculate_ShootPath` across galaxy changes to capture the historical stale-cache behavior;
14. a case where drawing consumes RNG before the next CPU decision.

## Port comparison rule
The future JavaScript simulator passes a trajectory case only when each tick matches the oracle within an explicitly documented floating-point policy. No empirical tuning of constants is permitted. A second, stronger mode should compare IEEE-754 bit patterns where the browser's operation ordering allows it.
