# Parity specification — Don Ceferino Hazaña 0.97.8

This document records behavior derived directly from the preserved 0.97.8 C++ source. Odd behavior is preserved when it affects gameplay.

## Timing and process order

The original loop defines logical and graphical ticks as `1000/100`: **10 ms / 100 Hz**. The browser build therefore uses an accumulator-based fixed-step simulation. `requestAnimationFrame` is presentation only.

`procesos::actualizar()` performs work in this order:

1. remove nodes whose state was already `-1`;
2. update messages;
3. update breakable blocks;
4. update items;
5. update bombs;
6. update balls, optionally without movement when enemies are paused;
7. update shots when enabled;
8. update the player when enabled.

Collision notification is a separate pass after process updates. The JS core preserves this order because it affects newly created objects and one-tick list-node behavior.

## Historical message timing

`fuente.cc` has two message modes.

A normal message becomes dead after 215 object updates, but the dead linked-list node is not removed until the next `procesos::actualizar()`. Therefore `hay_mensaje_activo()` remains true for **216 process ticks**, and the owning game state changes on the following game tick.

The quick-message variant similarly remains represented for **114 process ticks**.

These timings control level intros, life loss, timeout, level completion and freeze bonuses in the web core.

## Ball physics

Historical `pelota.cc` behavior:

- initial vertical velocity: `-2`
- gravity: `+0.04` per logic tick
- horizontal movement: 1 unit per logic tick
- logical sizes: 9, 18, 37, 75
- hit on size > 1: create two children at `x+10` and `x-10`, size minus one, opposite directions
- score for a hit: current ball size (1..4)

### Comma-operator quirk

The source contains:

- size 2: `vel_salto=-4,3;`
- size 3: `vel_salto=-4,8;`

In C++ these use the comma operator; the assignment is effectively `-4`. Sizes 1, 2 and 3 therefore rebound at `-4`; only size 4 uses `-5`. This is intentionally preserved.

## Player

The player state machine covers idle, walking, shooting, death, ladder movement, crouch, fall, sweep/spin, spinning fall and bomb throw.

Notable values:

- walking: up to 2 px/tick
- ladder: 1 px/tick
- sweep: up to 7 px/tick
- fall acceleration: `+0.1` per tick
- one simultaneous shot initially
- bomb-throw animation: 28 player updates before the bomb is created

The original falling code probes `x-15` for both left and right air movement. This asymmetry is retained.

## Shots

Normal and trident shots rise by up to 4 units/tick. A normal shot ends at the ceiling. A trident becomes attached and enters its ending state after the historical `cont_vida > 150` sequence, i.e. on the 151st attached update.

`procesos::get_cant_tiros()` counts linked-list nodes, not only live shots. A shot that becomes dead earlier in the same process tick therefore still occupies a simultaneous-shot slot until the next prune. The JS core reproduces this one-tick delay.

## Collision order

`procesos::avisar_colisiones()` performs:

1. ball vs shot;
2. ball vs player;
3. breakable block vs shot;
4. item vs player.

Ball/player collision first uses a broad rectangular test, then four circle-distance checks at Y offsets 15, 25, 55 and 75.

When enemies are paused, ball movement is stopped and **ball/player collision is disabled**, but shot/ball collision remains active. This is important during bomb and freeze effects.

## Repeated-overlap item quirk

The original item collision order is unusual:

1. `gaucho::colisiona_con_item(tipo)` is called whenever geometry overlaps;
2. then `item::colisiona_con_protagonista()` checks whether the item is still normal/transparent before paying the game-level effect.

Because selected items remain alive briefly, the gaucho-side effect can repeat on subsequent overlapping ticks. In particular the extra-shot item can increment `max_tiros` more than once. The parity core preserves this behavior rather than silently fixing it.

## Breakable-block quirk

`bloque::colisiona_con_tiro()` guards only the state transition and tile removal. The random-item roll is outside that guard. A normal shot colliding again while the block is still in its breaking animation can therefore trigger another item roll. Preserved.

## Bomb

The bomb moves horizontally at 4 px/tick, begins with vertical velocity `-4`, uses `+0.1` acceleration and progressively changes its bounce velocity. When it exits beyond X 620 or below X 20, it calls `reducir_todos_los_enemigos()`.

That routine walks only the ball nodes that existed when traversal began. Every non-minimum ball is hit once, scoring normally, splitting normally and performing the normal random-item roll. Newly inserted child nodes are not reduced again during that pass.

A dead bomb node remains in the linked list until the next process update, producing one final bomb-state processing tick before normal play resumes.

## Freeze bonus

The freeze pickup adds `2` to `tiempo_bonus`, pauses enemies and starts a quick bonus message. Each completed quick message decrements the counter while it is greater than 1 and enemies remain.

The historical code **never resets `tiempo_bonus` to zero**. After the first freeze it remains at 1; a later pickup therefore starts at 3 and lasts one quick-message interval longer. This quirk is preserved.

## Timer, timeout and life loss

A level starts at 30. The timer decrements only when `currentTicks - tick_ant > 1500`, then advances `tick_ant` by 1000. The first decrement therefore occurs just after 1.5 s and later decrements roughly every second.

When the value falls below zero, the original does not immediately subtract a life. It first:

1. creates a normal `time out` message;
2. pauses player, shots and enemies;
3. continues the current `jugando()` process/collision pass;
4. waits for the timeout message to disappear;
5. then calls `restar_vidas()`.

If a life remains, `restar_vidas()` creates a second normal message (`ouch`, `uh` or `aaah`) before rebuilding the level. The web core reproduces this two-stage timeout/life-loss path.

## Lives and score

The game initializes `vidas = 3`, but game over is tested after decrement with `vidas < 0`.

An extra life is granted when score **exceeds** the next 300-point threshold (`>`, not `>=`). Remaining level time is added directly to `puntos` during level completion, so the time bonus itself does not call the extra-life check.

## Level completion

After the final enemy list node is pruned, the game creates a normal `level complete` message and pauses player, shots and enemies. Only after the message disappears is remaining time added to score and the next level loaded. The next level then has its own normal level-intro message before simulation resumes.

## Pause

In 0.97.8, `P` enters pause only from normal gameplay. Resume occurs with Space, Enter, X, Z or C and resets the local timer reference. The stock web input layer follows these semantics; touch Fire/Sweep also resumes for usability.

## Gameplay parity milestone (0.2)

Milestone 0.2 established the source-derived gameplay mechanics and state transitions above. Later milestones retain those tests unchanged while adding the complete game shell and production integration.

## Full-game shell (0.3)

### Intro and ending

`intro.cc` and `final.cc` each contain six stages. Their `paso` counter is updated at the same 100 Hz logical cadence as the rest of the original program.

- automatic advance occurs when `paso > 1000`
- Space/Enter advance is accepted only when `paso > 100`
- Escape exits the sequence immediately

The web restoration preserves those threshold semantics and uses the original six intro JPEGs and six final JPEGs byte-for-byte. Text is rendered with browser system fonts because the historical bitmap fonts remain quarantined.

### Menu title

The original menu animates three title sprites with `simple_sprite::actualizar()`. Starting coordinates and targets are:

- `tit_1.png`: `(-594,616)` → `(90,8)`
- `tit_2.png`: `(830,616)` → `(230,0)`
- `tit_3.png`: `(-500,750)` → `(204,87)`

The integer easing rule is preserved. All three sprites reach their destinations after 55 logical updates. The web menu keeps the title timing but uses browser-native buttons for accessibility and responsive input.

### High scores

The original binary score file stores seven entries. The defaults from `utils.cc` are preserved exactly:

1. matar bros — 500
2. pepe — 450
3. kenny — 425
4. vaca — 413
5. martian — 411
6. raton — 300
7. toto — 299

A score qualifies only when it is **strictly greater** than at least one stored score. Ties do not displace an existing equal score in the qualification check. The browser stores the same logical table in `localStorage` instead of the platform-specific binary file.

### Game Over continue

`pierde_todo()` resets `puntos` to 0 and `vidas` to 3, then restarts the current level. It does **not** reset `proximo_pago_vida` or `tiempo_bonus`. The browser core intentionally keeps that quirk.

### Cheats

The historical always-on cheats are retained:

- `JU`: calls the pass-level path and converts remaining time to points
- `SJ`: sets the internal level to 25 and then passes it, resulting in playable level 26
- `BO`: enters the bomb state only while the player is idle

### Browser-specific adaptations

The original 0.97.8 in-game Options scene explicitly says the feature is temporarily disabled and asks the user to run `ceferinosetup`. A browser cannot use that executable, so the web shell exposes equivalent platform-appropriate preferences (fullscreen and touch controls) plus an intro replay command.

The original `Exit` menu item has no meaningful equivalent on a normal web page and is omitted. This is an intentional platform adaptation, not a gameplay change.

## Audio parity in 1.0

The 12 WAV files loaded by historical `audio.cc` are enabled as byte-identical runtime assets. The browser maps the source-called events and preserves the original `Mix_PlayChannel(0, ...)` single-channel behavior, so a new SFX interrupts the previous one.

`menu.xm` is intentionally not part of the active parity runtime. The package grants GPL-2.0-or-later and credits Javier Da Silva for music, but the module was generated by MID2XM and embeds General-MIDI-style sample material whose individual provenance is not documented. The strict preservation policy keeps it under `/quarantine/music`; see `AUDIO_AUDIT.md`.

The original C++ declares an 11-element sound pointer array but loads 12 sounds. That memory-safety defect is documented, not reproduced.

## 1.0 parity freeze

Version 1.0 freezes the source-derived browser baseline for the playable 0.97.8 game: gameplay, 30 levels, intro/menu/final shell, high scores, Game Over continue, cheats and source-called WAV effects. Browser adaptations are limited to responsive scaling, touch controls, fullscreen, persistent web preferences/high scores, system-font UI text and safe page-focus behavior.

The following are deliberately outside the frozen playable-game claim:

- the separate historical level editor and desktop setup utility, which remain preserved under `/reference`;
- `menu.xm` playback for the provenance reason above;
- bitmap-font rendering, also kept quarantined on provenance grounds;
- a native-executable frame-by-frame visual comparison, which remains desirable corroboration rather than a known gameplay defect.

Manual cross-browser/mobile deployment smoke testing is tracked separately in `PRODUCTION_QA.md`; the build environment used for this archive blocks browser navigation and cannot honestly certify that matrix.
