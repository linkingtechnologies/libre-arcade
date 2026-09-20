# HighMoon oracle JSONL events

Each line is a complete JSON object. Floating-point gameplay fields are emitted both as a decimal with 17 significant digits and as an exact 64-bit IEEE-754 hexadecimal payload (`*_bits`).

Event families:

- `srand`: seed operation and current global RNG index.
- `rng`: one historical `rand()` consumption, with raw value, `RAND_MAX`, source file and line.
- `galaxy_create`: procedural galaxy creation request and seed.
- `fire_command`: player, weapon, power, angle, start and velocity at fire time.
- `shot_activate`: actual projectile activation state.
- `step_begin`: projectile position and velocity immediately before gravity.
- `gravity`: one top-level galaxy body's contribution (`weight/distance` magnitude) for a tick.
- `step_end`: projectile position and velocity after gravity + 30 ms position integration.
- `collision`: selected collider and the pre-side-effect collision geometry.
- `wormhole_teleport`: pre/post teleport position plus preserved speed and direction.
- `ufo_damage`: shield before/after plus projectile speed/weight.
- `cluster_split`: parent impact state immediately before five Laser fragments are created.
- `shoot_path_begin`, `shoot_path_end`, `shoot_path_cache_hit`: CPU path-simulation lifecycle.
- `ai_candidate`: candidate y/power/angle, difficulty factor, remaining search count, and acceptance result.

The logger does not call the RNG. `HM_RAND()` calls `rand()` exactly once, records the returned value, and returns that same value to the historical code.
