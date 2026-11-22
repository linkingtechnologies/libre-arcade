# Port map

Baseline: `petarov/game-off-2012` at `25ee169` (v0.9.10). Original files in `reference/original/src/`.
Verification level: **1, executable oracle** for the game logic (the original game itself is run and the
port is compared with it frame by frame); level 3 (reading) where stated.

## Function by function

| Original | Port (`public/src/sim.js` unless stated) | Notes |
|---|---|---|
| `Config` defaults (`gameTimeLimit`, `gameTurnPeriod`, `enemiesPerTurn`, `startEnemiesCount`, `maxEnemiesToSpawn`, `carrotsPerTurn`, `startCarrotsCount`, `maxCarrotsToSpawn`, `carrotsCollect`, `carrotsPushCost`, `carrotsForkCost`, `defaultCarrots`) | `CONFIG` | Same values. `sfx`, `music`, volumes: `audio.js`. `Modernizr.touch` branch (960 x 704 field): not ported, see DIFFERENCES |
| `Tilemap.initialize` (grass, 27 obstacles, A* map) | `Game` constructor, `generateObstacles` | Random draws in the original's order: kind first, then x, y until the tile is free |
| `Tilemap.getPathToTile` / `getPathToTilePx` | `getPathToTilePx` | Clamps the start tile, floors both, `astar.search(..., diagonal = true)` |
| `Tilemap.spawnCarrot` | `spawnCarrot` | Including the position memory whose `pop()` keeps the first eight positions for good |
| `Tilemap.spawnAt`, `spawnAtPx`, `spawnAtCentre`, `spawnAtRandom` | same names | Spiral search, strict equality on tile coordinates (so a fractional position is never "occupied") |
| `Tilemap.spawnRelativeTo`, `spawnRelativeToEdge` | same names | |
| `Tilemap.findFreeCarrot` | `findFreeCarrot` | First of equal distances wins (carrots in creation order = Crafty's id order) |
| `Player` model, `Dude`, `LeftControls` | `Game.player` | `LeftControls` requires Multiway but never calls `multiway()`, so it does nothing; not ported |
| `Player` `KeyDown` / `KeyUp` | `keyDown` / `keyUp` | Q and W act on key **up**; no repeat of KeyDown (Crafty's dispatcher) |
| `Player` `EnterFrame` | `updatePlayer` | Order: move, pull, collisions (revert and stop), carrot detection |
| `Player` `PushEnemies` | `pushEnemies` | Cost first; nothing else (no cloud, no sound but the burp) if the carrots are short; if there are no enemies the carrot is spent and nothing happens |
| `Player` `ForkEnemies` | `forkEnemies` | One totem at a time; with no enemies the cost is paid and no totem appears |
| `Player.eatCarrots` | `eatCarrots` | |
| `Enemy` component (`newTarget`) | `spawnEnemy`, `newTarget` | The claimed carrot is never released, as in the original |
| `Enemy` `EnterFrame` | `updateEnemy` | |
| `Enemy` `PushBack` | `pushBack` | Including the unbraced `if`s of the horizontal case |
| `Enemy` `ForkBeacon` | `forkBeacon` | The old carrot target is kept; only the destination and path change |
| `MagicFork` (`_createdOn = frame + 300`) | `Game.fork` | Expires when `frame > created + 300` |
| `scene.game.js` `onEnterFrame` | `Game.step` (last part) | Game over, turn, tick, in this order, after all entity handlers |
| Crafty `hit()` / SAT | `overlaps`, `hitCarrot`, `hitObstacle` | Strict overlap of axis-aligned boxes; oldest entity first |
| Crafty `timer` | `Game.step`, `main.js` loop | Fixed 20 ms step, at most 5 catch-up steps |
| `lib/graph.js`, `lib/astar.js` | `public/src/astar.js` | Transcription, same heap and tie-breaking |
| Sprites, animations, `gfx.js` (`MagicPush`) | `art.js`, `render.js` | New pictures; sizes, depth order and animation speeds as the original |
| `hiscore.js`, `scene.splash.js`, jQuery UI dialogs, `traps.js` | `main.js`, `i18n.js`, `index.html` | Rewritten, see `docs/DIFFERENCES.md` |

## How the oracle works

`tools/oracle/harness.html` loads the original's own files in the browser, from
`reference/.fetched/orig` (fetched and hash-checked by `scripts/fetch-original.mjs`):
jQuery, Crafty 0.6.3, Underscore, Backbone, `graph.js`, `astar.js`, and `config.js`, `actor_object.js`,
`tilemap.js`, `player.js`, `enemy.js`, `gfx.js`, `scene.game.js`, unmodified. Only the sources of
non-determinism are replaced: `Date.now` and `Date` read a virtual clock, advanced 20 ms per frame;
`requestAnimationFrame` does nothing, and frames are stepped by `Crafty.timer.simulateFrames(1)`;
`Math.random` is a seeded generator (the same one the port uses); `Crafty.audio.play` records the sound
instead of playing it. Key events are injected with `Crafty.trigger("KeyDown" / "KeyUp")`.

After each frame the page reads the state (player, every carrot, every enemy, the totem, the carrot limit,
the sounds of the frame) and `tools/shared/canon.mjs` turns it into a string. Entities are identified by
creation serial rather than Crafty id, because the original spends ids on tiles, bars and animations
that the port has no need to create; only their order matters and the serial keeps it.

A scripted player (`tools/shared/bot.mjs`: `idle`, `greedy`, `mash`, `brawl`, `hunter`; a scenario may also start the player with a stock of carrots, set identically on both sides) produces the key events;
they are recorded, and replayed on the port by `tools/shared/replay.mjs`. `tests/golden/*.json` keep, per
game, the seed, the inputs and a 12-hex-digit SHA-256 fingerprint of every frame (the recordings
themselves are tens of megabytes and are not committed; re-record with `tools/oracle/run.mjs`).

## What the 19 recorded games cover

171,000 frames, 3 minutes each: the map and the player's start; carrot spawning, with its ceiling and
the difficulty turns; every enemy's spawn, targeting, claiming, path (A* with diagonals), pull and
re-targeting; contested carrots, with the original's laugh when an enemy takes the one the player stands
on; the player's movement, collisions with the scenery and the edge, pull and score; Q (including the
burp with no carrots and the repelled enemies' rest and recovery); W (the redirection of every enemy,
the one-at-a-time rule, the 301 frames it lasts) and the sounds of each frame; the end of the game on the
9001st frame with the same score.

## What it does not cover

- **Pushing** is exercised well since the `hunter` games (a bot that chases rivals with a stock of 40 carrots, which the original and the port are both given): across the 19 games Q was released 158 times with a carrot and repelled an enemy in 8 games (49 enemies pushed, 834 frames with a pushed enemy), in addition to hand-worked values in `tests/mechanics.test.mjs`. Burps happen 8 times and totems 17 times.
- **The inputs are those of five scripted players**, not human play. Plays that the scripts never make
  (for example pulling while pushed against two obstacles at once) are not exercised.
- **Frame-rate behaviour.** The oracle steps frames exactly 20 ms apart. The original's wall clock
  (`Date.now`) and Crafty's catch-up could make a real browser's game differ in timing under load; the
  port derives its time from the step count (see DIFFERENCES).
- **Rendering, audio and the interface** are new and are not compared with the original (they cannot be:
  the art and sound effects are not reused). `tools/e2e` smoke-tests them in a real browser.
- **A second game in the same page** (level 3, read from the source): the original's `Tilemap` defaults
  hold one `carrotsCoordsQueue` array shared by every instance, so replaying in the same page session
  inherits the positions remembered by earlier games. The port starts each game with an empty queue,
  which is the original's first game after a page load; this was not run in the oracle.
- **The original's wall clock for sound variants** (`Date.now() % 2` chooses fart1 or fart2, scream,
  laughter): the oracle's virtual clock is always even, so it records the family of the sound, not the
  variant.
