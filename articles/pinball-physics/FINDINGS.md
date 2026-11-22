# Pinball physics experiments: findings

Scripts run the three games' own engines from Node, unchanged (Comet: `physics.js`; Mechanical Night:
`DocDonkeysParityPhysics`; Nova: its `physics.js` plus the collision loop copied from `app.js`).
Re-run with `node 0N-*.mjs`. Raw numbers are in `results/`. Nothing here touches a game folder.

Common yardstick: `v_H = sqrt(2 g H)`, the speed gained falling one table height
(Comet 1.83 m/s, Mechanical Night 759 px/s, Nova 1202 px/s).

## 0. Scales (`00-scales.mjs`)

| | table height (ball radii) | gravity (radii/s²) | fall time over H | flipper length (radii) | flipper ω | tip speed / v_H |
|---|---|---|---|---|---|---|
| Comet | 104 | 88.6 | 1.53 s | 8.1 | 50 rad/s | 3.0 |
| Mechanical Night | 91 | 38.9 | 2.17 s | 4.5 | 25 rad/s | 1.3 |
| Nova | 63 | 51.2 | 1.57 s | 7.9 | 13.5 rad/s | 1.3 |

Comet is the only one with real-world dimensions (13.5 mm ball, 0.76 x 1.40 m field, 7° incline).
Mechanical Night is 50 px per metre, so its 18 px ball is a 36 cm "ball".

## 1. Flipper shot (`01-flipper-shot.mjs`)

Ball at rest on the resting flipper, key pressed; speed measured when the ball clears the flipper.
"Rise" = free-flight climb in table heights, ignoring all other obstacles.

- Nova: exit speed is about 1.0 to 1.1 x the flipper surface speed (flipper restitution 0.05), and grows
  with distance from the pivot. Best shot rises 0.69 of the table height. The 1000 px/s ball clamp is applied
  *before* the collision, so the shot leaves at about 1200 px/s and is cut to 1000 on the next step.
- Mechanical Night: 440 to 720 px/s, best rise 0.89 (stock profile) or 0.78 (shipped `flash-enhanced`).
  The ball is half the flipper's mass (0.102 vs 0.222 kg), so the flipper does not deliver its nominal speed.
- Comet: up to 4.6 table heights of potential rise near the pivot. The *delivered* flipper ω at release
  falls from about 42 rad/s (near the pivot) to about 11 rad/s (tip): the flipper is a dynamic body
  and the ball is heavy relative to it. More distance from the pivot does not mean a harder shot.

Caveat: Comet and Mechanical Night were stepped at 1/60 s; the release moment is detected per frame.

## 2. Walls and bumpers (`02-walls-and-bumpers.mjs`)

Effective wall restitution (exit/entry speed):

| impact speed / v_H | Comet | Mechanical Night | Nova |
|---|---|---|---|
| 0.02 to 0.05 | 0 | about 0.13 | 0.40 |
| 0.1 and above | 0.56 | 0.30 | 0.40 |

Comet and Mechanical Night have a velocity threshold (Box2D heritage: 0.1 m/s and 50 px/s) below which
bounces vanish. Nova's restitution is a constant.

Head-on bumper, exit speed for entry at 0.5 v_H (Comet 0.91 m/s, MN 382 px/s, Nova 604 px/s):

- Mechanical Night: 668 px/s (x 1.75, constant, the `1.75` in `solveSolids`).
- Nova: 997 px/s (x 2.16 = `radius / 10`, then capped by the 1000 px/s clamp).
  At v_H the bumper *slows* the ball (1202 -> 997): the clamp, not the bumper, sets the top speed.
- Comet: not a multiplier at all. The bumper adds a fixed velocity kick on contact end
  (`BUMPER_ACCEL_PHYSICAL * dt`, about 43.7 m/s² per frame time), on top of e = 0.56.
  Exit speed at the same entry: 1.23 m/s at 60 Hz, 0.79 at 144 Hz, 0.66 at 240 Hz.

**To verify before publishing:** `comet.js` calls `engine.step` with the real frame time, so in this port the
bumper strength depends on refresh rate. I have not checked whether the original Java did the same
(its source is not in `reference/`; the oracle runs at a fixed 60 Hz). Do not present it as a historical
property of Comet without checking, or say explicitly that it is a property of the port.

## 3. Tunnelling (`03-tunnelling.mjs`)

Ball fired at a straight wall up to 80 x v_H:

- Comet and Mechanical Night: no tunnelling observed on a plain wall at any speed tested.
- Nova: no tunnelling with the 1000 px/s clamp. Without it, tunnelling begins between 3 and 5 v_H, matching
  the analytic threshold `r / dt = 15 x 240 = 3600 px/s`. The clamp is Nova's substitute for continuous
  collision detection.

A wider scan of every Comet polygon edge gave results I do not trust (false positives from neighbouring
geometry), so it is not reported. Do not claim Comet "tunnels" anywhere from this work.

## 4. Divergence (`04-divergence.mjs`)

Same ball dropped twice onto the bumpers with no input, second drop shifted by a fraction of a ball radius.
Nine starting positions per game, 40 s cap, ball radius as the separation threshold.

- Each run is perfectly repeatable (a shift of 0 gives identical paths).
- Comet: a shift of 0.1 radius separates in 0.7 s (median); each factor 10 smaller buys about 0.6 s.
- Nova: 0.75 s at 0.1 radius; about 0.4 s per decade.
- Mechanical Night: the ball rarely hits enough in the top area to amplify a shift (7/9 at 0.1 radius,
  none at 1e-6). Report it as "less chaotic on this setup", not as a property of the engine.
- For shifts of 1e-6 radius or less most runs drain before they separate, so the medians at the small end are
  biased towards runs that diverged early. Only the slope over the first four shifts is meaningful.
