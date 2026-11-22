# Heal'em All: gameplay specification (reconstructed from the original code)

Labels: **[S]** verified in source, **[X]** verified by execution against the unmodified original,
**[D]** documented but untested, **[?]** unknown. Evidence for [X] lives in `evidence/probe-original-result.json`
(fixed-step probe, seeded `Math.random`, `tools/probe-original.js`) and `evidence/realtime-baseline.json`
(real keyboard/touch in Chrome 158, `tools/realtime-baseline.mjs`). Units: pixels, seconds, tile = 70 px.

## Player (`player.coffee`, `gun.coffee`)

| Feature | Rule | Status |
|---|---|---|
| Move | `speed 330`, Quintus `platformerControls`; left/right arrows | [S]; [X] 324.7 px/s measured in real time over 1 s, 319 in fixed steps (ramp-up) |
| Jump | `jumpSpeed -660`; Up arrow (or `action`: X, or touch "b") | [S]; [X] `vy = -660`, apex about 217 px |
| Hitbox | 40 x 100, shifted by facing (`[-25,-50..15,50]` right, `[-15..25]` left) | [S][X] |
| Lives | 3 at level start (`Q.state lives`); **no death by single hit** | [S][X] |
| Contact damage | touching a `Zombie` costs 1 life, then 1 s of invincibility (`timeInvincible`) | [S][X] lives 3→2→1 at 1 s steps |
| Fall damage | `vy > 1100` flags `willBeDead`; the life is lost when `vy` drops back below 1100 | [S][D] |
| Out of map | `y > map height` costs a life and teleports to the last saved ground position (saved every 2 s while on ground) | [S][D] |
| Level edges | x is clamped to `0..map width` | [S] |
| Gun | picking up `Gun` sets `hasGun`, bullets from the gun item; fire with Space or Z (touch "a") | [S][X] pickup and Space fire: bullets 3→2, one bullet sprite |
| Fire rate | one shot per 0.5 s; empty gun says "I'm out of ammo" and still consumes the 0.5 s | [S] |
| Bullet | speed 700, range `Q.width / 2` (window-dependent), gravity 0, starts 15 px ahead | [S]; range [D] |

## Healing, humans, re-infection (`zombie.coffee`, `human.coffee`, `dead_zombie.coffee`)

* A bullet hit lowers a zombie's `lifePoints` (1) to 0, the bullet is destroyed, and the zombie is replaced by a `Human` at the same spot. [S][X] (healed 16 frames after the shot in the probe; enemy counter 1 → 0)
* A `Human` has a 4 s grace (`timeInvincible 4`). After that, a touching `Zombie` makes it play `outro` and it becomes a `Zombie` again, flagged `wasHuman`, facing a random direction. [S][X] (re-infected 107 frames after a zombie was placed next to it)
* A `wasHuman` zombie shot again becomes a `DeadZombie` (grave sprite), never a human. [S][X]
* The "Zombies healed" statistic is the number of `Human` sprites alive when the door is entered. [S]
* A zombie falling out of the map dies as `DeadZombie` without becoming human. [S]

## Zombie AI (`zombie_ai.coffee`)

* Patrol speed 60 px/s; direction from the `startLeft` property. [S][X] (|vx| = 60)
* Sight: player within 350 px horizontally **and** within ±10 px vertically (same floor). [S][X] (340 px seen, 360 px not, 30 px height difference not)
* On sight: remembers for 3 s, turns toward the player, plays the "notice" sound and `attack` animation (10 s sound cooldown). [S][D]
* Turns around at a ledge when it cannot see the player and its memory timer is 0. [S][D]
* Zombies bump off walls keeping the impact speed (`hitFromLeft/Right`). [S][D]
* Zombies physically collide with humans (mask includes `SPRITE_HUMAN`). [S]

## Zombie mode (protagonist "dies")

* At 0 lives the `Player` is destroyed and a `ZombiePlayer` appears at the same spot; label "I was bitten. I'm turning. Nooo!". [S][X]
* After the 6-frame-pair intro animation it gains controls: speed 140, jump -500; label "I need to kill myself"; music switches. [S][X] speed/jump values; the transition to controllable is [D] (see Unknowns)
* The `ZombiePlayer` turns any `Human` it touches into a zombie that is **not** `wasHuman` (so it can be healed again). [S][D]
* Falling out of the map ends zombie mode: a new `Player` spawns at the last saved ground position with 3 lives and `wasZombie = true`. [S][X]
* A second death while `wasZombie` shows **Game Over**. [S][X]

## Items and exit (`heart`, `key`, `gun`, `door`, `exit_sign`)

* Heart: +1 life (no cap), stat "Health collected". Key: sets `hasKey`. Door: with the key it opens (key consumed); an opened door needs Up or X (touch "b") while overlapping to finish the level. Without the key: "I need the key". [S][D]
* On finishing, `Game.stageEndLevelScreen()` shows the summary. [S][X]

## Levels (counts verified at load) [X]

| Level | Map (tiles) | Zombies | Hearts | Gun bullets | Randomised content (`Math.random`) |
|---|---|---|---|---|---|
| 1 | 30 x 21 | 1 | 1 | 3 | none |
| 2 | 30 x 21 | 4 | 1 | 6 | key/heart swap (2 variants) |
| 3 | 50 x 31 | 8 | 3 | 10 | key/door sides (2 variants) |
| 4 | 100 x 46 | 12 | 6 | 14 | key/door/hearts/gun (4 variants) |
| 5 | 100 x 46 | 16 | 6 | 18 | same 4 variants |
| 6 | 100 x 46 | 24 | 6 | 26 | same 4 variants |

Variant counts observed over 40 seeds match. [X] **Quirk to preserve:** in level 3 the sign position is read from a field that does not exist
(`randomItems[random].exitSign`), yet an `ExitSign` sprite is still created (probe: `exitSigns: 1`), at default coordinates. [S][X]

## Score and progression

* Stars from `healed / available`: ≤ 0.5 → 1 star; > 0.5 and < 0.9 → 2; otherwise 3. A level with 0 healed still gets 1 star. [S][X rendering with 3/4 = 2 stars]
* Saved only if better than before (`localStorage zombieGame:levelProgress:<n>`); finishing level n unlocks n+1 (`availableLevel`). [S]
* Summary lines: health collected, zombies healed, bullets wasted (count of bullets that hit anything except a zombie), zombie mode found. [S][X]
* "Play next" after level 6 goes to the end screen. [S][X]

## Controls

* Keyboard: arrows, Space/Z = fire, X = action, Enter = confirm/buttons, P = pause, Esc bound but unused in sources I read. [S][X Enter, arrows, Space, P]
* Touch (when a touch device is detected): on-screen `<`, `>`, `b` (action/jump), `a` (fire), plus pause and "back to levels" buttons. [S][X rendering, `Q.touchDevice = true` under touch emulation]; actual finger input [D]
* The audio on/off button is click/tap only: no key is bound to `mute`. [S]
* Info label messages ("I need to find the way out of here", ...) are the story/hints; 14 strings in `info_label.coffee`. [S]

## Sound triggers [S] (files quarantined, see `LICENSE-AUDIT.md`)

player_bg (loop while playing), zombie_mode (loop in zombie mode), gun_shot (fire), collected (heart/key/gun), player_hit (life lost),
human_created (zombie healed), zombie_notice (zombie sights player). Door-open, level-success, game-over and out-of-map sounds were planned
(`missing_audio.txt`) but never implemented.

## Animation timing [S]

Frame rates are Quintus `rate` values per animation (player run `1/4`, jump `1/3`; zombie run `0.4`, attack `1/2`, fall `1/5`; human intro `0.7`, outro `0.8`; bullet `0.3`). Not measured by execution. [D]

## Update (M3)
Verified by execution on the original: bullet range = `Q.width / 2` (513, 642 and 408 px at widths 1024, 1280, 800), star thresholds and progress saving, fall damage and out-of-map life loss, key/door/level end, zombie-mode controls (speed 140, jump -500, 135 px/s measured over 0.5 s) and humans touched by the zombie player becoming ordinary (healable) zombies. See `evidence/m3-parity.json`. The first bullet of the Unknowns below is therefore closed.

## Unknowns / not verified

* [?] Whether zombie-mode controls become active: the probe's `hasControls` flag read `false`, but it tested `p.platformerControls`, which is probably not where Quintus stores the component, so the probe is inconclusive. Needs a focused check (M3).
* [?] Behaviour with window sizes far from 640 x 320 (bullet range, camera).
* [?] Exact end-to-end winnability of each level by a scripted player.
* [D] Fall damage threshold, ledge turning, sound triggers, touch finger input.
