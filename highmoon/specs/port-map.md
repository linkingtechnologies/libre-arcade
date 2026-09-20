# Port map: HighMoon 1.2.4 (C++, SDL 1.2) to JavaScript

Baseline: HighMoon `1.2.4`. The C++ sources are preserved byte-identical in `../reference/reference/HighMoon/src/`; paths below are relative to that folder. The port is a clean-room reimplementation: `public/src/` reproduces the historical arithmetic and random-number consumption, not the historical pixels and waveforms.

## Verification level

Per the collection's verification hierarchy (`../../AGENTS.md`):

- **Physics, world generation, weapons, CPU opponent: level 1, executable oracle.** A native runner compiled from the original `vector_2.cpp`, `object.cpp`, `graphics.cpp`, `galaxy.cpp` and `shoot.cpp` (SDL replaced by a fake framebuffer, audio by a stub) produces JSONL traces; an independent mirror and the JavaScript port are compared with them. Recorded results (`../docs/FINAL_QA_RC5.md`, run by `../tests/`):
  - a fixed Laser shot: 102 steps, 816 scalars compared, 688 bit-identical, maximum absolute difference `7.1e-15`, up to 48 ULP; the differences come from C++ `libm` versus the browser's math functions and are not tuned away;
  - glibc `rand()` and galaxy generation for seed 54321: exact (408 RNG calls, 48 settle steps);
  - the CPU solver on the canonical turn: all 7 candidates and all 12,585 shared RNG calls match, shield 100 to 80;
  - the native wormhole collision and teleport, and storm repulsion, reproduced;
  - 100 deterministic galaxy seeds satisfy the placement invariants.
- **Game flow, UI, audio, language, touch input: level 3.** New presentation code checked by contract tests (`ui-contract`, `audio-contract`, `art-contract`) and, before integration, by Chromium runs recorded in `qa-evidence/chromium/`.
- **Not covered:** universal full-playthrough equivalence with the native game. The oracle proves the specified scenarios only.

The simulation modules are the validated baseline; do not change them without re-running the oracle comparisons.

## Modules

| C++ (upstream) | JavaScript | Notes |
|---|---|---|
| `vector_2.cpp/.hpp` | `vector2.js`, `ieee754.js` | Cartesian and polar vector type. `ieee754.js` only serves the bit-level comparison |
| `constants.hpp` | `constants.js` | Behavioural constants preserved from 1.2.4 (1024 by 768 screen, 30 ms shot interval, 700-tick maximum shot run, shot power factor 3, five cluster lasers 30 degrees apart, 5 to 9 planets). `WEIGHT_WORMHOLE=100` is stale upstream: the live Wormhole weight is 50 |
| `main.cpp` (`srand`, `rand` usage) | `rng.js` | glibc `rand()`/`srand()` reproduced exactly; one shared stream, as upstream |
| `galaxy.cpp/.hpp` (`Galaxy`, `calculate_nextPos`) | `galaxy.js`, `simulation.js` | Procedural bodies and collision geometry; inverse-distance gravity summed over the **top-level** bodies only; speed and angle round-trip each tick (`--projectile-roundtrip` in the oracle) |
| `object.cpp/.hpp` (`Planet`, `Stone`, `Blackhole`/Storm, `Wormhole`, `Star`, `Extra`, UFOs) | `galaxy.js`, `world.js` | Weights: Jupiter 350, Earth 300, Mars 200, Venus 180, Saturn 250, Storm -100, Wormhole 50. Collision is a discrete center-distance overlap, tested in array order then UFOs, first hit wins, no swept collision |
| `object.cpp` `draw()` methods that mutate state and consume `rand()` | `historical-runtime.js` | Impact displacement, moon and ring orbits, Storm, Wormhole, Star and Extra effects keep their state changes and RNG calls but draw nothing, so gameplay randomness stays faithful |
| `shoot.cpp/.hpp` (`Shoot`, Laser, Heavy, Cluster) | `simulation.js` (`HistoricalProjectile`), `weapons.js`, `game-shot.js` | Cluster spawns five fragments; the announced Exploding shot is unreachable upstream and falls back to Cluster |
| CPU targeting inside `Playfield`/`Galaxy` (`main.cpp`) | `ai.js` | Integer-quantized path search and Monte Carlo candidate state machine over the game's own simulator |
| `Playfield::play()` and the game loop in `main.cpp` | `game-controller.js` | 30 ms fixed step, turns, three modes (1P vs CPU, 2P, CPU demo), bonuses and shield upgrades, winner, five CPU strengths. Keeps the key-release quirk (a shot can fire on an unrelated key release once charging began) |
| `graphics.cpp/.hpp`, GIF assets | `presentation-art.js`, `presentation-effects.js` | New procedural Canvas drawing and effects, with no authority over collision radii, gravity, RNG order or timing (the effects never read or mutate the historical RNG) |
| `sound.cpp/.hpp`, WAV assets | `presentation-audio.js` | Procedural Web Audio, deterministic noise, no use of the historical RNG stream |
| `language.cpp/.hpp` | `game-app.js` (IT/EN strings) | By its release notes the original grew to nine languages (English and German, then French, Polish and Portuguese, Spanish and Russian, Italian, Dutch); the port offers Italian and English |
| SDL keyboard handling, `-f` fullscreen | `game-app.js` | Arrow keys, Space, Enter, Tab and letter shortcuts, touch hold and release, fullscreen, pause, menu |
| `scenario-seed54321.js` (no C++ counterpart) | `scenario-seed54321.js` | The canonical oracle scenario used by the tests |

## Deliberate departures from the original

- No historical graphics or sounds. Drawing and audio are new, and never influence the simulation.
- A welcome menu that pauses the simulation until Play, with IT/EN instructions and credits.
- Touch controls, safe-area handling and reduced-motion support.
- Two languages instead of nine.
- No sound-test button and no background music (the original has no music either).
- Historical quirks are preserved, not corrected: moons and ring stones collide with shots but exert no gravity, discrete collision can tunnel, the Exploding weapon is vestigial. Any "fixed" behavior would need its own explicit mode, separate from the archaeological one.
