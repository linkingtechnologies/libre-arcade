# Audit trail of the port, M1 to M12

The browser version was built in twelve milestones between 22 and 24 September 2026. Each one delivered its own report, test record and, from M10, a release gate: 42 files, about 200 KB, half of it raw test-runner output. This document replaces them. Nothing here is new material: it is the substance of those files, with the repetition removed.

What was dropped and why is at the end. The files that carry evidence rather than narrative are still in the repository: `reference/AsteroidsInfinity-1.2.py`, the oracle fixtures in `test/`, `ORIGINAL_FILE_ORACLE.log`, `port-map.md` and `ACCEPTANCE.md`.

## The milestones

| # | Added | Node tests | Its own main caveat |
|---|---|---|---|
| M1 | Flight and camera. World 700 × 540 behind a 640 × 480 view, `Ship.control`, `Obj.update`, `set_pos_screen`, the ship outline | 8 | Fixed 100 Hz accumulator instead of the original's measured frame time. No asteroids, no collisions |
| M2 | Asteroids: construction, ten polar vertices, drift, the single wrap, the first wave of one large rock | 16 | `Math.random` is not Python's generator. The lone rock passes through the ship |
| M3 | Collisions, player bullets, fragmentation 3→2→1, scoring 25/50/100, shield, lives, respawn, wave progression | 28 | Pygame group order approximated with arrays. Saucers counted on the rare roll but not created |
| M4 | Saucers: growth before becoming collidable, steering from camera velocity, big and small firing, 250/1000 points, the rare `randint(0,50)==0` spawn | 40 | Small-saucer aim uses the current camera transform, not each sprite's own last screen position |
| M5 | Particles: `explosion`, exhaust, ship and saucer debris, `Stick`, per-frame decay draws, insertion ordering through `objectOrder` | 55 | Draw order is faithful for particles against active saucers, not proven for the whole object graph |
| M6 | Menu topology from `main()`: Play, Highscores, Options, Quit; the five options; the six remappable actions; the original top ten and its qualifying rule | 72 | Browser JSON storage, deliberately not the historical text format. Volume present but inert: no audio shipped yet |
| M7 | `controls.txt` and `highscores.txt` import and export, name entry and its Escape path, a seeded no-input session that reaches game over by itself | 87 | A restricted interoperable subset: canonical files only, not every malformed file the original tolerated |
| M8 | Never delivered. The archive was not found when M9 began; M9 carries its variable-time work | — | — |
| M9 | Measured `dt` per animation frame instead of the fixed step; camera integration moved out of the ship-alive branch, as in the original; the RNG tape | 97 | The tape detects call-order divergence, it does not make `Math.random` behave like Python's generator |
| M10 | The 100 Hz cap of `Clock.tick(100)` as `frame-clock.js`, with no catch-up; Tab and Enter behaving like ordinary browser focus; a full seeded session in Chromium to a natural game over | 102 | A 120 or 144 Hz display gets fewer than 100 updates per second, because `requestAnimationFrame` cannot schedule like Pygame |
| M11 | Consolidation for a silent beta: milestone numbers and internal jargon out of the interface, scoped reset of this game's storage keys | 104 | Still silent: the historical WAV files were not cleared for redistribution |
| M12 | How to play and Credits screens, Italian and English throughout, seven synthesized Web Audio cues, Libre Arcade credited only inside Credits | 113 | The cues are new sounds. No audio parity with the original is claimed |

The interesting detail of that table is the caveat column. Eleven milestones, and not one of them ends with a parity claim.

## What each milestone kept from the original rather than improving

- The degenerate `random.uniform(-2π, -2π)` that gives every asteroid the same spin, draw included (M2).
- The single wrap per axis in `Obj.update`, so an object faster than the world is wide is not normalized back (M1, M2, M5).
- The strict `>` in the particle decay test and in the wrap loop (M1, M5).
- Scoring that credits the player only when the ship or one of its bullets caused the destruction (M3, M4).
- Saucer bullets waiting one tick before they move (M3, M4).
- Camera velocity integrated even with no ship alive, which is why the view drifts on after a collision (M9, restoring what M7 had smoothed away).
- The small saucer aiming with `atan2(x, y)` in screen space, without a shortest toroidal path (M4).

One departure was deliberate rather than faithful: when neither ship nor asteroid exists, the original's `SmallSaucer.update` can read an uninitialised target. The port skips the shot instead of crashing (M4).

## Evidence, by strength

**Executable oracles.** Two, both runnable today with Python 3 and Node:

- `test/make_oracle_asteroids_m2.py` extracts `Asteroid.__init__`, `Obj.update` and the wave-spawn statement from the preserved source, runs them under a group-free stub and tapes every random draw with its bounds. Seed 20260922, three rocks, 75 draws, 87 ticks. Re-run during integration into the collection, it reproduced `test/oracle-asteroids-m2.json` byte for byte.
- `test/original_file_oracle_m7.py` runs the original `get_controls`, `save_controls`, `get_highscores` and `save_highscores` and compares the bytes they write with the JavaScript parser and formatter. Only two Python 2 `print` statements in an unused error branch are neutralised so the snippet parses under Python 3. Output in `ORIGINAL_FILE_ORACLE.log`.

**Documented source review.** Everything else: flight, camera, collisions, saucers, particles, menu topology. `port-map.md` lists which original lines each module follows, and says so plainly rather than implying oracle-level confidence.

**Simulated sessions.** M7 ran 42,510 steps of 0.01 s with no input and reached a natural game over (score 300, five ships lost); M10 repeated it in Chromium at a simulated 60 Hz in 24,716 steps. Both use a seeded browser generator. Neither is a person playing, and neither is Python.

## What was blocked in the audit environment, and what happened since

The runner's Chromium refused to navigate to `http://127.0.0.1` (`net::ERR_BLOCKED_BY_ADMINISTRATOR`) and to a routed HTTPS origin. Every browser test from M1 to M12 therefore inlines the module bodies into `about:blank` and stubs `localStorage`. That is why `test/browser_smoke_m*.py` looks the way it does, and why each report repeats that an ordinary HTTP module load was never certified.

That particular gate was closed when the game joined the collection: `public/` was served over HTTP and the page was driven in an ordinary headless Chrome, at desktop size and at 375 × 812, through the menu, a full game to level 2, How to play and Credits. All 13 modules and the stylesheet returned 200 with the right MIME type and no console error. `test/test_http_assets_m10.py` passes as well.

## Still open

1. Real audio on real speakers, and a physical phone.
2. Persistence at a real site origin, after an actual reload.
3. The original Python 2 and Pygame game, never executed here or in the audit. Whole-game and audiovisual parity are not claimed and cannot be until that happens.
4. Redistribution rights for the historical WAV files and the Vector Battle font. Until then they stay out, and the synthesized cues are described as new sounds everywhere they are mentioned.
5. The player-side pass described in `ACCEPTANCE.md`, on the deployed address.

## What this file replaced

Removed: ten `M*_REPORT.md`, nine `M*_TEST_RESULTS.*`, three `M*_RELEASE_GATE.md`, twenty-two `.log` files of runner output and `FILES_SHA256.txt`.

The logs were either reproducible in seconds (`npm run check` regenerates the current one) or snapshots of code that no longer exists. Five of them were exact duplicates: `M7_ORIGINAL_FILE_ORACLE_RUN.log`, `M9_NATIVE_TEXT_ORACLE.log`, `M10_NATIVE_TEXT_ORACLE.log` and `M12_ORIGINAL_FILE_RUN.log` were one byte-identical file repeated four times, kept here once as `ORIGINAL_FILE_ORACLE.log`, and `M7_M6_BROWSER_REGRESSION_RUN.log` was a copy of `M6_BROWSER_RUN.log`. `FILES_SHA256.txt` listed the delivered package before the move to `public/`, which `SHA256SUMS.txt` now covers.

`M12_USER_ACCEPTANCE.md` was kept, unchanged, as `ACCEPTANCE.md`.

The complete original set is in the delivered archive, `AsteroidsInfinity-LibreArcade-M12-first-commit.zip`, which is the record of what was handed over. It was never committed to this repository, so this condensation removes nothing from the project's history.
