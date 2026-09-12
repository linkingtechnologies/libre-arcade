# Timing and animation baseline (1.0.1)

This file records source-derived Cocos timings used by the browser reconstruction.
Coordinates are converted from Cocos' bottom-left system to Canvas' top-left system.

| Event | Upstream timing | Browser baseline |
| --- | --- | --- |
| Menu → game/Demo `FadeTransition` | 1.0 s total; switch at 0.5 s | same |
| Initial board delay | 1.0 s | 1.0 s |
| Initial board drop | 2.0 s | 2.0 s |
| `Ready?` hold + move | 2.0 s + 0.5 s | 2.0 s + 0.5 s |
| Swap | 0.2 s | 0.2 s |
| Invalid swap-back | 0.2 s | 0.2 s |
| Matched tile flight | 0.4 s | 0.4 s |
| Gravity settle | 0.2 s | 0.2 s |
| New refill tiles | 0.4 s | 0.4 s |
| AI delay before board move | 1.5 s | 1.5 s |
| Action announcement | 1.0 s hold + 0.5 s move | 1.0 s + 0.5 s |
| Cow travel | 2.0 s | 2.0 s |
| Meteor travel | 2.0 s | 2.0 s |
| Rocket travel | 1.0 s | 1.0 s |
| Laser display | 0.5 s | 0.5 s |
| Attack fade after impact | 0.2 s | 0.2 s |
| Delay after attack impact | 1.0 s | 1.0 s |
| Explosion scale branch | 2.0 s then kill | same |
| Explosion fade branch | 1.0 s delay + nominal 2.0 s fade | killed at 2.0 s, halfway through fade, as upstream |
| Consecutive-timeout board fade | 0.3 s | 0.3 s |
| Consecutive-timeout refill | 0.4 s | 0.4 s |
| End-game board fade | 0.3 s | 0.3 s |
| Floating long-match bonus | 3.0 s; fade after 1.5 s | same |

## Scene transition detail

`game/menu.py` pushes both normal and Demo games through
`FadeTransition(GameScene(...), 1.0)`. The vendored Cocos transition fades the
black color layer in for half the duration, calls `hide_out_show_in` at the
midpoint, then fades the layer out for the second half.

The reconstructed game object therefore starts its intro clock when the incoming
scene is created rather than waiting until the second half of the fade has ended.

## Explosion action quirk

Upstream composes:

`Delay(1.0) + FadeOut(2.0) | ScaleBy(1.2, 2.0) + CallFunc(sprite.kill)`

The scale branch finishes at 2.0 s and immediately kills the sprite. The fade
branch began fading only after its 1.0 s delay, so at the kill point it has
completed only 1.0 of its nominal 2.0 fade seconds. The visible explosion thus
vanishes at roughly 50% opacity. This is preserved as observable historical
behavior rather than “fixed”.

## Turn clock

Upstream sets `time = 100`, accumulates frame `dt`, and only when `elapsed > 0.2`
sets the line to the current integer value, decrements `time`, and tests for
`time < 0`. This means the timeout needs **101 discrete update ticks**, not 100.
At ideal scheduling that is roughly **20.2 seconds**, with small frame-dependent
overshoot because each update discards accumulated time above 0.2 s.

The browser baseline intentionally reproduces that discrete behavior rather than
using a continuous 20-second wall-clock timer.
