# Yanoid 0.3.0 parity specification

The primary target is the SDL Game Development Contest submission, Yanoid 0.3.0 (1 December 2001). The audited 0.3.5 source archive is historical comparison material for identifying later changes, not a source of features for Contest mode. It is not redistributed in the public package.

## Fixed reference values

- Logical playfield: 800 × 600.
- Initial lives: 5.
- Initial ball direction: π/3 for map round starts; spawned extra balls use π/5.
- Initial ball target speed: 0.19 px/ms.
- Ball target-speed growth: 0.000003 px/ms² from the first ball update of each map.
- Paddle target speed: ±0.4 px/ms.
- Paddle key-down acceleration: ±0.002 px/ms².
- Paddle key-up deceleration: ±0.001 px/ms².
- Paddle bounce angle clamp: π/7 to 6π/7.
- Paddle position angle factor: 0.05.
- Paddle movement angle factor: 1.55.
- Falling power-up speed: 0.05 px/ms.
- Shot speed: 0.2 px/ms.
- Normal shot duration/cooldown: 20 s / 1 s.
- Super shot duration/cooldown: 12 s / 3 s.
- Wide/narrow paddle duration: 10 s.
- Standard brick hit: +10 points.

## Contest progression

`map1 → map7 → map2 → map4 → map8 → map5 → map3 → map6 → map0 → map2 → map3`, then wrap.

There are nine distinct map scripts but eleven stages in the 0.3.0 `maplist.py`.

## Historical quirks preserved

### Power-up probability

The Python source comments say 20%, but the expression is `randrange(0,100) > 80`; only 81–99 pass, so Contest mode preserves the effective 19% test.

The weighted selector uses `<=` against cumulative weights. This gives boundary values to the preceding entry and is preserved. With the 0.3.0 table, the random input is 0–42 while the cumulative total reaches 43; because value 42 is consumed by the previous bucket, the final `+1000` entry is effectively unreachable. Contest mode preserves this bug.

### Time bonus and update clock

`TClient::NextMap()` resets `game_start` and `game_lastupdate`, and `UpdateGame()` passes this relative clock to `TGame::Update`. Paused transition time is excluded. Contest mode therefore uses a **per-level active-play clock** for the three-minute bonus.

The native client also slices long frame deltas into updates of at most 10 ms (`max_deltaticks = 10`). The port preserves this fixed maximum physics step.

### Collision granularity

The released build's `pixelCollision()` returns `boundingBoxCollision()`. Pixel-perfect collision code is not required for parity and is not copied into this port.

## Python rewrite

The Python map scripts are represented as JavaScript factory functions. The goal is semantic equivalence, not source-level translation. `map8.py` callbacks that create bricks dynamically are implemented as named JS callbacks rather than `eval` strings.

## Explicitly excluded post-contest features

These belong to later development/0.3.5 and are not part of Contest mode:

- slow-ball and speed-ball power-ups;
- `map9.py` bonus level and delay bricks;
- post-contest sprite animation changes;
- replacement console/tab completion;
- later collision fixes and other 0.3.5 cleanups.

## Additional 0.3.0 quirks preserved by the hardened port

### Paddle startup and wall contact

`TMap::SetPaddle()` initializes the paddle motion with target velocity 0, acceleration -0.03 and **current velocity 2.0**. The result is a short rightward launch at the start of each map unless input changes it. This surprising behavior is preserved because it is present in the contest source.

`TPaddle::Update()` records historical min/max x extents before paddle/static collision correction. On wall contact the native collision code sets current velocity and acceleration to zero but leaves the target velocity unchanged. The port preserves that ordering because it can affect later paddle resizing and paddle-influenced ball angles.

### Deferred removals

The native update order is: insert queued entities, move/update entities, remove entities that were marked during the previous collision pass, then perform the new collision pass. Therefore a brick or ball marked removable by a collision is not removed from map accounting until the next physics update. The port preserves this one-step delay.

### Simultaneous last ball and last brick

`TGame::Update()` checks the no-ball state first and then the no-brick state. `MAPDONE` can therefore overwrite `CUT` or `DEAD` in the same update. When both disappear together, level completion wins; with more than one life a life has already been decremented, while with the last life no decrement occurs before `MAPDONE` overwrites `DEAD`.

### Super shot and indestructible bricks

The super shot uses `REMOVEALL`, but `TBrick::MarkDying()` refuses removal when `hitnum < 0`. Consequently `brick-stay` remains genuinely indestructible even to the super shot. Three-hit and normal bricks can still be removed by it.

### map8 callback multiplicity

Two chain bricks in `map8.py` use comma-separated Python hit expressions that invoke two helper functions. Each helper calls `basic_brick_hit()`, so a single impact on those chain bricks awards 20 points and performs two independent power-up spawn checks before adding the two new bricks. The JS rewrite preserves that double callback rather than reducing it to one logical hit.

### Presentation timing

The contest client pauses active game time during presentation effects. Map-name intro and lost-ball cut each last 1500 ms. MAPDONE displays two consecutive 1500 ms phases: `Level complete!` and then the time-bonus message. These timings are preserved without adding them to the per-level gameplay clock.
