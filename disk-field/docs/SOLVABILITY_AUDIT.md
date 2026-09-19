# Disk Field M6 — canonical solvability audit

M6 closes the automated solvability gate without changing the validated simulation or level data.

## Result

**17/17 active levels have a canonical input replay that reaches `world.finished === true`.**

| Level | Ticks | Notes |
|---:|---:|---|
| 1 | 65 | canonical replay |
| 2 | 111 | canonical replay |
| 3 | 152 | canonical replay |
| 4 | 94 | canonical replay |
| 5 | 396 | canonical replay |
| 6 | 135 | canonical replay |
| 7 | 182 | `Dodge!`, randomized movers with seed `solvability-v1` |
| 8 | 138 | canonical replay |
| 9 | 169 | canonical replay |
| 10 | 334 | canonical replay |
| 11 | 152 | canonical replay |
| 12 | 185 | canonical replay |
| 13 | 86 | canonical replay |
| 14 | 98 | canonical replay |
| 15 | 285 | moving-wall / moving-field timing solution |
| 16 | 146 | canonical replay |
| 17 | 190 | long route around the central wall, then down the left field |

Total replay length: **2,918 simulation ticks**, about **97.3 seconds** at the historical 30 Hz simulation rate.

## What the validator proves

`tests/validate-solvability.mjs` reads `tests/solvability/replays.json`, recreates each level using the production `public/js/engine.mjs` and `public/js/levels.mjs`, applies only the three legal per-tick inputs (`L`, `R`, `.`), and requires:

1. the replay action SHA-256 to match the preserved corpus;
2. replay length to equal the recorded tick count;
3. `world.finished === true` at exactly the expected tick;
4. the final disk position to match the preserved replay result.

The test therefore does not use a simplified solver or alternate physics model as its acceptance oracle: the final proof is replayed on the same canonical engine used by the game.

## Dodge! and randomness

Level 7 (`Dodge!`) historically randomizes the starting positions and speeds of five moving walls. The permanent regression replay fixes seed `solvability-v1`, so it proves that one authentic randomized configuration is solvable and gives the test suite a deterministic artifact.

Additional QA searches also found valid solutions for other independent randomized seeds. This is useful evidence that the level is not dependent on one lucky layout, but it is **not** presented as a formal proof that every possible RNG configuration has a winning trajectory.

## Archaeological constraint

No replay was produced by editing physics, level geometry, forces, walls, goals or collision rules. `engine.mjs` and `levels.mjs` remain byte-identical to the already validated M3–M5 baseline. The solver was only a search tool; its output becomes evidence only after the canonical replay validator succeeds.
