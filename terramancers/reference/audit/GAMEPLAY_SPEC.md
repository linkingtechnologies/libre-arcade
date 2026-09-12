# Gameplay and engine specification from the historical source

## Engine/rendering

Terramancers is not a 3D game. It is a Java AWT/Swing 2D tile game.

- fullscreen undecorated `JFrame`;
- 32×32 tile grid;
- tilemap cached to a `BufferedImage`;
- character animation from 64×64 frames in 576×256-ish LPC sheets;
- trees use the first half of `greenTrees.png`;
- no physics engine and no WebGL-equivalent requirement.

For the browser restoration, **Canvas 2D** is the direct fit.

## Simulation timing

Historical constants:

- `FPS = 60`
- `TPF = 3`

During the main loop the engine runs three simulation ticks per nominal frame: approximately **180 simulation ticks per second** when the host keeps up.

`Terramancer.tick()` uses a hard-coded movement speed of **0.8 px per simulation tick**. A dynamic speed formula exists in `Engine.getPlayerSpeed()` but is commented out at the movement call site and is therefore not part of the completed game's behavior.

Diagonal movement adds both axes independently and is **not normalized**.

## Core capture rule

When a moving player enters a neutral tile, that tile changes to the player's tileset. The map then checks left/right/up/down. If another tile owned by the same player is found before an obstacle, all intervening non-obstacle tiles become the player's tiles.

There is no diagonal capture.

## Collision model

Collision is point-based. Before movement the code checks only whether the destination point `(x + dx, y + dy)` lies on an obstacle tile. The historical source contains a `TODO` to improve collision checking.

This limitation is a parity behavior, not something to silently fix in the primary port.

## Terrain ownership and character mapping

At application startup, six general terrain families are loaded:

0. sand
1. farmland
2. grass
3. cement
4. dirt
5. volcanic

For a playable match, three distinct families are randomly selected for neutral / player 1 / player 2-CPU ownership.

The player sprite depends on the selected terrain-family ID:

- 0 → Professor
- 1 → Baldric
- 2 → Princess
- 3 → FBI
- 4 → Astraea
- 5 → Mage

## Level generation

Every normal base tile is randomly one of tile indices 10, 15, 16, or 17.

Single-player difficulty:

| Difficulty | Trees | Random obstacle ratio |
|---|---:|---:|
| Easy | 6 | 0.02 |
| Medium | 8 | 0.05 |
| Hard | 10 | 0.08 |

Menu exhibition:

- 8 trees
- obstacle ratio 0.01
- no players

Multiplayer:

- two players
- obstacle ratio 0.05
- obstacle placement is generated with rotational symmetry
- no tree opponents

The generator adds a water border and transition tiles around the arena.

## Tree opponent behavior

A tree belongs to tileset 2 and is also marked as an obstacle.

- reload time: 50
- initial reload index: 0
- search patience: 20

On a paint attempt a tree claims the target if it is neutral and free. Otherwise it recursively random-walks to one of eight neighboring tiles, clamped to arena bounds, for up to 20 attempts. After an attempt, `reloadIndex` is set to 50 and then decremented on following ticks, yielding a new attempt every 51 simulation ticks.

## End condition and scores

The game ends when the neutral, non-obstacle tile count reaches zero.

Control percentage is calculated among *claimed* tiles only:

`player tiles / (player 1 tiles + player 2 tiles)`

Single-player treats equality as a loss because the historical UI checks only `player1 > player2` for a win.

## Controls

- Player 1: arrow keys
- Player 2: W / A / S / D

## Legacy map format

Although completed Terramancers generates its map procedurally, predecessor editor/map-loading code remains in the archive.

`Tilemap.saveToFile()` stores:

1. one byte: width in tiles
2. one byte: height in tiles
3. for each `(x,y)` in x-major order:
   - one byte base tile index
   - one byte addition tile index

Ownership and obstacle flags are not serialized. The completed Terramancers engine has the old `Map.map` loading line commented out.
