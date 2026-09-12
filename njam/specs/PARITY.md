# Njam 1.21 offline parity audit

Primary behavioural reference: the source and data shipped in the AmigaOS4 Njam 1.21 package, especially `njamgame.cpp`, `njammap.cpp`, `njamedit.cpp`, menu/options code, audio setup and the original 800×600 assets.

This build deliberately targets **Njam 1.21**, not a modernized 1.25 ruleset. Network Host/Join is excluded by project decision for this milestone; everything below refers to the local/offline product.

## Main menu and options

The browser now reconstructs the historical 800×600 menu surface rather than replacing it with a generic web menu:

- `mainmenu.jpg` background;
- eight original menu entries at the source y positions;
- original Pac-Man selector sprite and keyboard Up/Down/Enter/Esc flow;
- `VERSION 1.21` bitmap-font label;
- Top 10 table and last-score highlight;
- top yellow scrolling ticker;
- cycling information/script window sourced from the packaged `script.txt`;
- original `options.jpg` overlay and Music / Sound / Skin / Back semantics;
- historical Host/Join entries are intentionally omitted from the player-facing menu because network play is not included in this build.

The options file itself cannot be written as `njam.conf` from normal browser JavaScript, so `localStorage` is the persistence adapter.

## Local gameplay modes

### One Player

- P0, five ghosts, COOP level sets and ordered level progression;
- 1850-frame base bonus;
- cumulative GamePoints and Top 10 handling.

### Two Player cooperative

- P0 + P1, five ghosts, shared lives, COOP level sets and ordered progression;
- 1000-frame base bonus;
- source-equivalent shared/non-shared point handling.

### Two Player Duel

- P0 + P1, eight ghosts and DUEL level sets;
- random map per round;
- six random power-up replacement attempts;
- no time bonus;
- player-v-player juice kills;
- first player to four round victories;
- source `m_TripleDinged` state reproduced: `tripleding.wav` fires once when all but one active player are mathematically unable to catch the leader, and `mapend2.wav` fires if the race becomes open again.

## Main loop and timing

- Logical game-frame target: **34 ms**, matching `StartTime + 34`.
- Per-frame order: `Animate()` → `MoveGhosts()` → `MovePlayers()` → final-cookie short-circuit → `Collide()` → `UpdateWorld()`.
- READY / SET / GO: one second each.
- Final cookie ends the map before collision/world timers on that frame.
- Bonus expiration emits the original triple-ding effect.
- Game Over: 700 ms before high-score check; if no entry qualifies, 1300 ms more before automatic menu return.
- Whole-game victory: 1300 ms before accepting any key, then high-score/menu flow.
- Duel match winner: winner art remains for 4000 ms and returns automatically.

Browser scheduling can jitter or throttle; source ordering and logical durations are preserved.

## Maps and level sets

The OS4 1.21 data is embedded losslessly:

- COOP: DRAGON, EASY, ORIGINAL, RAVENS CURSE, WOLF.
- DUEL: BEAMTEAM, DULIO, HUNT, ORIGINAL.

Each file is 20 fixed map slots × 28×24 bytes = **13,440 bytes**, stored x-major. `LevelSet.rawMap()` preserves source bytes. `LevelSet.runtimeMap()` reproduces `NjamMap::SetCurrentMap()` by clearing the three spawn corners reserved for players 1–3 while deliberately leaving `(1,1)` untouched.

## Ghosts and multiplayer targeting

- Five ghosts in One/Two Player; eight in Duel.
- Slot/type relationship and staggered delays use the original `slot % 3` and `slot * (MAXDELAY/GHOSTMAX)` rules.
- Shaddy, Hunter and Assassin movement follows 1.21 source logic.
- Line-of-sight targeting searches the nearest active visible player.
- Freeze/dead-ghost delay behaviour, ghost-house state and desperate-eyes rendering are retained.

## Scoring, pickups and collisions

- Cookie: +1 MapPoints to collector; +1 GamePoints only in One Player.
- Ghost kill: +5 MapPoints; +5 GamePoints only in One Player.
- 50-point tile: +50 GamePoints.
- Juice, freezer, invisibility, traps and teleport timing/selection follow 1.21.
- A second juice is left in place in non-duel modes while the player is powered.
- In Duel, touching a second juice removes and relocates it to the opposite reserved corner.
- Closed-trap death uses `2*MAXDELAY`, door respawn and no life decrement.
- Normal ghost death in One/Two Player decrements shared lives and resets active players/ghosts after the life screen.
- Duel ghost death costs no life and gives at least `1.5*MAXDELAY` invisibility at the door.
- Duel player-v-player collision kills only when one participant has juice and the other does not.

## Presentation and audio

- Original four map skins and source selection semantics.
- Original sprites, bitmap fonts, HUD, lives/map-points/duel counters, bonus gauge and result art.
- Original WAV effects at source-equivalent events, including kill/death variants, bonus expiry and duel race-warning transitions.
- Original tracker files are preserved unchanged. Browser playback uses derived Ogg files because normal browser audio does not natively decode the packaged XM/S3M tracks.
- Normal gameplay music preserves the 1.21 3/4 `ritam` vs 1/4 `dali` random-choice shape.
- Pause retains game music rather than pausing it, as in the original.

## High scores

The One Player Top 10 subsystem follows 1.21:

- strict `>` qualification/insertion;
- score + level storage;
- nine-character name limit;
- original allowed-character normalization;
- original-style `hiscore.jpg` in-canvas entry with bitmap-font name/cursor;
- packaged 1.21 `hiscore.dat` zero state as the initial default.

`localStorage` is the filesystem adaptation replacing `hiscore.dat` writes.

## Level editor

The editor now mirrors the historical workflow and 800×600 composition closely:

- starts as a blank COOP set;
- COOP/DUEL kind switch via `K`;
- 20 map slots;
- numeric tile editing 0–9;
- playable marker at `(1,1)`;
- source-positioned right-hand help/palette rendered with the original bitmap font;
- UNSAVED / NOT PLAYABLE warnings;
- clear, undo, previous/next and two-stage swap;
- load, save and save-as actions;
- exact `.COOP` / `.DUEL` import/export;
- contiguous-playable-map validation with one Door and one Pentagram per playable map;
- source-style confirmation messages;
- **T TEST** semantics: commit current buffer, launch two players with Duel collision semantics, 5 ghosts/no injected power-ups for COOP or 8 ghosts/six injection attempts for DUEL, force skin 0 only when selected skin is random, then return to the editor without replacing its data.

The only material editor UI adaptation is file access: browsers cannot expose an unrestricted filesystem path chooser like the SDL desktop build. File System Access API is used when supported; otherwise standard upload/download controls are used.

## Deliberate / unavoidable platform differences

1. **RNG implementation.** 1.21 uses platform C `rand()` seeded from SDL ticks. The port uses a deterministic xorshift generator and supports `?seed=12345`. Source-equivalent call sites/order are preserved where practical; numeric sequences are not expected to match a particular libc.
2. **Scheduling.** Browser timers can jitter/throttle; logical frame/timing targets remain source-derived.
3. **Malformed-map safety.** The 1.21 ghost-direction loop can hang when surrounded by walls. The port guards against browser lock-up; upstream 1.25 later fixed this class of problem.
4. **Filesystem persistence.** `localStorage` replaces `njam.conf` / `hiscore.dat`; editor file dialogs use browser file APIs.
5. **Tracker decoding.** Ogg derivatives are used for playback while original tracker files remain preserved.
6. **Exit.** A web page generally cannot close a tab it did not open. The Exit item attempts normal browser close and otherwise leaves an explicit exited state.
7. **Responsive shell.** The preserved game/menu/editor surfaces remain 800×600 internally, but CSS scales them to fit the viewport. Optional touch controls and browser utility buttons live outside that historical surface.
8. **Convenience input.** WASD is additionally accepted for Player 1 in One Player mode; original arrows remain primary.

## Explicitly deferred: network duel

Host Duel / Join Duel are **not part of this offline-parity milestone**, by project decision. Njam 1.21 uses SDL_net raw TCP on port 5547, which normal browser JavaScript cannot reproduce directly. The original transport-independent packet formats have already been source-audited and encoded/tested in `src/network-protocol.js`; `NETWORK_PARITY.md` documents them for a future optional transport adaptation.

## Status wording

This build should be described as an **offline 1.21 parity candidate**: the local modes, original-style menu/options, high-score flow and editor are all implemented and regression-tested, with the browser adaptations above documented. It should not be labelled absolute 100% Njam product parity because network play is intentionally absent and final visual/feel comparison against a running native 1.21 build remains a manual acceptance step.

## Production wrapper hardening

The production candidate additionally uses pointer-capability detection for touch controls (including landscape phones/tablets), safe storage fallback when `localStorage` is unavailable, direct click/tap menu activation as a browser convenience, and hides the wrapper Fullscreen control on browsers that do not expose the Fullscreen API. None of these changes alter the historical game simulation.
