# Port map: AsteroidsInfinity-1.2.py to public/src/

Every line number refers to `reference/AsteroidsInfinity-1.2.py` (1012 lines, SHA-256 `1a806d89…`), which is preserved unchanged. The port follows the original function by function; where it departs, the row says so.

## Verification level

The collection ranks evidence: an executable oracle first, hand-computed exact values second, documented source-level review third (`../../SOFTWARE_ARCHAEOLOGY.md`). This game uses all three, per area.

| Area | Level | Evidence |
|---|---|---|
| Asteroid construction, drift and wrap | 1, executable oracle | `test/make_oracle_asteroids_m2.py` runs the original `Asteroid.__init__`, `Obj.update` and the spawn statement under Python 3 and records every RNG draw; `test/oracle-asteroids-m2.json` holds the result and `test/test-asteroids.mjs` replays the tape. Regenerating the fixture during integration reproduced it byte for byte |
| `controls.txt` and `highscores.txt` | 1, executable oracle | `test/original_file_oracle_m7.py` runs the original readers and writers and round-trips their output through `public/src/native-files.js` |
| Flight, camera, collisions, saucers, particles, scoring, menu topology | 3, documented source review | The modules cite the lines they follow; `AUDIT.md` records the reading milestone by milestone, and the line ranges listed below were checked again during integration |
| Frame timing and audio | not applicable | Both are declared adaptations, not ports. See the last two rows of the table |

No native Python 2 or Pygame session was ever run, so nothing here is frame-level or audiovisual parity.

## Module by module

| Original | Lines | Port | Notes |
|---|---|---|---|
| `wrap(num, start, end)` | 201–206 | `originalWrap` in `core.js` | The original loops with `while` and a strict `>`; the port keeps the loop instead of using a modulo, so values exactly on the boundary behave as they did |
| `Obj.update` | 226–238 | `step` in `core.js`, `stepAsteroid` in `asteroids.js`, `updateParticle` in `particles.js` | Spin, then translation, then **one** wrap per axis: an object moving faster than the world is wide is not normalized back, which the port reproduces |
| `Obj.set_pos_screen` | 250–263 | `screenCoordinates` in `core.js`, `asteroidScreenPosition`, `particleScreenPosition` | Wraps into [-30, 670] × [-30, 510]: the 700 × 540 world behind a 640 × 480 view |
| `Asteroid.__init__` | 280–291 | `createAsteroid` in `asteroids.js` | Radius `3 · 2^size`, then ten polar points. Line 284 reads `random.uniform(math.pi * -2, math.pi * -2)`: both bounds are the same, so every asteroid spins at exactly -2π. The port keeps that value **and** still consumes the RNG draw, because the original does |
| `Asteroid.collide` | 294–314 | `collisions` in `combat.js` | Splitting into two smaller rocks, 25/50/100 points by size |
| `Ship.__init__`, `normal_points` | 315–338 | `makeShip` in `combat.js`, `SHIP_POINTS` in `render.js` | The seven polar points of the hull, transcribed at radius 10 |
| `Ship.control` | 347–372 | `step` in `core.js` | Left and right add and subtract π, so pressing both cancels; reverse thrust is 400/3 and forward 800/3; the speed change is applied **before** the angle update, as in the original |
| `Ship.control` (weapons, shield) | 375–398 | `controlWeapons` in `combat.js` | |
| `Ship.exaust` | 399–404 | `exhaust` in `particles.js` | |
| `Ship.collide` | 409–416 | `collisions` in `combat.js` | A raised shield destroys what hits the ship and the ship survives |
| `Saucer`, `BigSaucer`, `SmallSaucer` | 418–540 | `saucers.js` | Including the growth phase: a new saucer is not collidable until it has finished growing, and the small saucer aims in screen coordinates with `atan2(x, y)`, not by the shortest toroidal path |
| `explosion`, `Particle`, `Stick` | 208–213, 542–566 | `particles.js` | |
| `Bullet` | 568–590 | `makeShot`, `integrateBullet` in `combat.js` | Speed 400, life one second |
| `raise_score` | 591–598 | the scoring guard inside `collisions` in `combat.js` (line 48) | Points go to the player only when the shot's creator is the ship: a saucer that destroys an asteroid scores nothing |
| collision sweep in `main` | 829–847 | `collisions` in `combat.js` | Pairwise, with each pair first brought within half a world of each other, then `hypot < r1 + r2`. The break when an object has left every group is reproduced |
| wave spawning in `main` | 810–821 | `spawnWave` in `asteroids.js` | Level *n* spawns *n* large asteroids at random positions with random velocities; the previous wave's speeds are corrected by the camera velocity |
| camera in `main` | 938–955 | `step` in `core.js` | The elastic viewpoint: relative position wrapped into [-world, 0] plus half a screen, a per-axis factor capped at 1, then `(1-p)^dt` easing of both velocity and position |
| viewpoint integration in `main` | 992–993 | `step` in `core.js` | Runs unconditionally, even with no ship alive; the port keeps that, which is why the camera drifts on after a collision |
| menu structure in `main` | 639–920 | `menu.js` | Play, Highscores, Options, Quit and the control-binding screen keep the original order and nesting. How to play and Credits are new screens, kept apart from the four original entries |
| `get_highscores`, `save_highscores`, `get_controls`, `save_controls` | 78–133 | `native-files.js` | Import and export only. Everyday persistence is browser JSON in `storage.js`, deliberately a different format |
| `pygame.time.Clock.tick(100)` | in `main` | `frame-clock.js`, `frame-delta.js` | **Adaptation.** One measured step per rendered frame, capped at 100 Hz, gaps over 250 ms skipped. No fixed-step integration and no catch-up |
| `loadsounds`, `Sound`, `Channel` | 50–77, 134–179 | `sound.js` | **Not a port.** Seven Web Audio cues synthesized on the device. No historical sample is used, reproduced or approximated |

## Deliberate departures

1. **The random generator.** Python's Mersenne Twister is not reproduced. `browserRandom` wraps `Math.random` and offers `random`, `randint` and `uniform` so the *sequence of calls* matches the original; the values do not. `rng-tape.js` records a run's draws so a test can replay it exactly.
2. **Frame timing**, as above.
3. **Audio**, as above.
4. **Interface.** Responsive layout, touch controls, English and Italian, How to play and Credits screens, and browser storage are 2026 additions. The Libre Arcade link appears only inside Credits, which `test/test-m12.mjs` enforces by asserting that the initial HTML carries no such link.
5. **Quit.** A browser page cannot exit; the entry ends the run and returns to the menu.
