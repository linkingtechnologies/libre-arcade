# Gameplay specification — source-derived baseline

## Core objective

Each level contains one cannon and one or more independent train stations. A train of bubble carriages advances along its track. Destroy all train/station carriages before any carriage runs past the end of a track.

## Frame/timing model

The original top-level loop is frame-limited to **25 FPS** (`FRAMES_PS = 25`, 40 ms target frame). Train speed and bullet speed are effectively expressed in movement units/pixels **per frame**, while reload and special-effect durations use `SDL_GetTicks()` wall-clock milliseconds. A faithful port should preserve the 25-FPS simulation semantics even if rendering uses `requestAnimationFrame`.

## Cannon and firing

- Exactly one cannon appears in every shipped level.
- Cannon position, bullet speed and reload delay are level data.
- Shipped bullet speeds: **10, 11, 12, 14 px/frame**.
- Shipped reload values: **300, 400, 500, 600 ms**.
- Keyboard rotation step is `pi/60`, i.e. **3 degrees** per input step.
- Cannon angle is limited to a left/right half-plane around vertical.
- Mouse mode maps horizontal mouse displacement to cannon angle with configurable sensitivity.
- The cannon displays the loaded and next bubble.
- Fired bullets travel in a straight line. **There is no wall bounce.**
- A bullet that no longer intersects the screen rectangle is removed.

## Train spawning

A `TrainStation` owns a `CarriageFactory`, `Track` and `Train`. A new carriage is placed at the exact track start only after the existing tail has moved more than one bubble diameter (**30 px**) from that start. Thus spacing emerges from movement rather than a fixed spawn timer.

If a reversing train pushes a carriage before the first track section, that carriage enters `CS_IN_STATION`, is removed from the active tail and prepended back into the station factory. A speed bubble is reset to normal before returning from station on a later spawn.

## Carriage generation

Level XML may request random or explicit sequences. For random generation the factory maintains per-colour/per-special availability counts. Ordinary colours may be unbounded (`-1`). Shipped levels use 2–5 colours and 3–50 carriages per train.

The random factory rejects an initial/generated sequence that would contain three consecutive normal bubbles of the same colour, preventing automatic matches as a train first enters the track.

## Collision and insertion

A carriage reports bullet collision when the distance from bullet centre to carriage centre is at most one bubble diameter (**30 px**).

When a normal/rainbow/speed bullet hits:

1. The track section containing the target carriage decides whether the new bubble belongs `BEFORE` or `AFTER` the target, based on bullet side relative to line/arc/spiral direction.
2. The new carriage initially occupies the target position.
3. The train creates room by ripple-moving one side **15 px forward** and the other **15 px backward**.

## Spacing and split chains

Bubble radius is **15 px**; nominal diameter is **30 px**. Two carriages count as touching when centre distance is `<= 31 px`.

`rippleMove` propagates displacement from carriage to carriage only while the next carriage is no farther than 30 px. If a gap is larger, propagation stops. This means the logical train can split into physically separate groups. Only the segment connected to the driving/rear end receives forward propulsion; when a rear segment later closes a gap, movement propagates into the forward segment again.

## Matching/removal

After movement, every frame scans from the driving/rear end toward the front for runs of **3+** touching carriages with the same current colour. The source has a small asymmetry: the **current** carriage in the scan must not be `SFX_SPEED`, but the already-counted rear-most/previous carriage is not re-checked. Therefore a speed bubble can count only when it is the rear-most member of a run; encountering one later breaks the run. The faithful engine preserves this quirk.

A qualifying run is removed and converted into explosion particles. Because the test repeats on following frames, removing a group can create a gap and later reconnection can cause a secondary match. This is a natural chain reaction, but there is **no separate combo counter or combo score** in the audited code.

## Special bubbles

### Rainbow (`SFX_RAINBOW`)

The source comment says 15 frames, but the actual post-decrement code changes colour immediately on its first animate call and then every **16 animation calls**. It participates in normal colour matching using its current colour. The faithful engine follows the code, not the comment.

### Speed (`SFX_SPEED`)

On construction it evaluates the original integer macro `random(3) - 1.5`. In practice this produces discrete adjustments **-1.5, -0.5, +0.5** and can produce **+1.5** only at the exact `RAND_MAX` endpoint. Lifetime is `int(5 / abs(adjustment))`, capped at 10 seconds: ±1.5 gives 3 s and ±0.5 gives 10 s. Station-generated speed bubbles keep their timer disabled; a speed projectile starts its timer only when copied into the train. Speed effects on the physically connected driving segment are added to the base multiplier (`1 + adjustments`). Negative aggregate speed reverses the driving section. On expiry the bubble becomes normal and chooses a random colour.

### Bomb (`SFX_BOMB`)

Does not insert. It removes all carriages in the impacted train whose centres are within **60 px** of the bullet impact position.

### Colour bomb (`SFX_COLOUR_BOMB`)

Does not insert. It samples the colour of the carriage hit, then removes every carriage of that colour in that same train.

## Level state

- **Win:** every train is `TS_EMPTY` and each corresponding station factory has no remaining carriages.
- **Loss:** any carriage is moved past the final track section, causing `TS_CRASHED` -> `LS_GAMEOVER`.
- The game normally offers retries via credits. Default documented value is 5; `-1` means infinite.
- On retry the same level is reloaded.
- On win, elapsed level time is added to total game time and the next `.gms` entry loads.

## Time / ranking

There is no conventional points score in the gameplay code. Fastest-time records use **highest completed level plus cumulative time**. `LevelTimer::getTime()` returns `(endTime - startTime) / 100`, i.e. tenths of a second stored/displayed as an integer unit. Pauses adjust the timer so paused wall time is excluded.

## Multiplayer

No multiplayer mode was found in the audited source/data.

## Parity cautions

Do not add wall bounces, hanging clusters, gravity/drop rules, point scoring or Puzzle-Bobble-style ceiling behavior to the faithful release. Those are not present in the audited Bubble Train code.
