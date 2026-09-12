# UC-GRUGNETTOGO1 — Play Grugnetto Go!

## System context

The main gameplay SPA of the **libre-arcade** plugin (tab "Grugnetto Go!", dashboard id `grugnetto-go`). A 2D platformer starring "Grugnetto", organized into 4 worlds of 8 levels each (32 levels total). The same `games/grugnetto-go/app.js` also runs standalone, outside CAMILA entirely, via `games/grugnetto-go/index.html` — the whole `games/grugnetto-go/` folder is self-contained and portable (see design.md).

## Goal

Let the player choose between two commitments — **Practice** (freely try any level, no restrictions) or **Arcade** (a fixed world1→world4 run on one shared pool of lives) — then play a level: move and jump through a hand-built platforming layout, collect coins and bonus pickups, defeat or avoid enemies, and reach the level's goal flag. Score accumulates from pickups (with a combo multiplier for chaining them) and from bonuses awarded at the moment of finishing a level. Practice mode also tracks, per level, whether it has ever been completed.

## Primary Actor

Anyone with access to the libre-arcade plugin (or anyone with the standalone page, outside CAMILA) — no permission beyond that is required. Progress is not tied to any account: completion tracking lives in the browser only (see design.md).

## Stakeholders and interests

| Stakeholder | Interest |
|---|---|
| Player | Wants a normal game structure (start screen, pick a mode, pick what to play, see progress) and a real choice between casual practice and a committed arcade-style run |
| Content author | Wants new worlds/levels to slot into `worlds.js` without touching navigation code — see design.md's "Adding a level" note |

## Preconditions

- User is logged into CAMILA WorkTable with access to the libre-arcade plugin (or is viewing the standalone `index.html` page, which has no login at all).

## Postconditions — Success

- **Practice mode:** the player reaches the "playing" screen for the level they picked, and can return to level-select or world-select at any time without losing overall progress (only the current in-progress attempt is discarded). Finishing a level marks it completed (persisted in the browser); completion is a visible checkmark only — it never locks or unlocks anything else.
- **Arcade mode:** the player either reaches the end of the world4 sequence (level 32) and is shown a "run complete" screen, or runs out of the run's shared lives and is sent back to the title screen. There is no free level-select in this mode — every level plays in a fixed order.

## Postconditions — Error / Partial failure

- If the browser doesn't support the required `<canvas>` features, an error message is shown in place of the game area; the title/mode-select/world-select/level-select screens (pure HTML, no canvas dependency) remain unaffected until the player actually tries to enter a level.

## Status classification

| World state | Meaning |
|---|---|
| Has levels | Selectable in Practice mode's world-select; shows "*completed* / *total*" for that world |
| No levels yet ("coming soon") | Shown, not selectable, regardless of anything else — a world-authoring state, not a progress-gated one (every world currently shipped has levels; this only applies to a future world added to `worlds.js` before its levels are compiled) |

There is no locked/unlocked distinction between worlds — Practice mode lets the player enter any world with levels at any time, in any order (see design.md's note on why the earlier completion-gated lock was removed).

| Level state | Meaning |
|---|---|
| Not completed | Playable, no completion badge |
| Completed | Playable (levels are never locked individually), shown with a completion badge |

## Main Success Scenario

### Step 1 — Title screen

1. Player opens the "Grugnetto Go!" tab (or the standalone page); the title screen is shown immediately (no asset loading yet).
2. Player selects "Play" to continue, or "Credits" to see the game's art/audio/library credits and licenses (Step 1a).

### Step 2 — Mode select

1. Two options are offered: **Practice** ("try any level freely, no restrictions") and **Arcade** ("levels in sequence, one shared pool of lives for the whole run").
2. Player picks Practice (continues at Step 3) or Arcade (skips straight to Step 5, starting at world 1, level 1).

### Step 3 — World select (Practice mode only)

1. Every world with at least one compiled level is listed, showing its name and how many of its levels are completed.
2. Any world with levels can be entered directly — no lock, no required order.
3. Player selects a world.

### Step 4 — Level select (Practice mode only)

1. Every level of the selected world is listed, each showing its number/name and whether it's already been completed. Any level can be selected, independent of the others' completion state.
2. Player selects a level.

### Step 5 — Loading

1. On the very first level picked this visit, the game engine and its assets load (loading screen shown). On any later pick, the switch is effectively instant (the engine is already running).

### Step 6 — Playing

1. The chosen level plays: the player moves left/right and jumps (keyboard arrows/WASD/Space, or a connected gamepad) across a hand-built layout of platforms, gaps, and moving/stationary enemies.
2. A HUD above the play area shows: current world/level, remaining lives, a super-jump gauge, a temporary-invincibility indicator (while active), coins collected out of the level's total, current score, a combo indicator (while a pickup streak is active), and — in Practice mode — a button back to level-select, plus a fullscreen toggle always available.
3. Besides the normal jump, the player has a limited number of extra mid-air "super jumps" for that attempt (enough for a couple of chained higher jumps); the gauge empties as they're used and refills at the start of every fresh attempt.
4. Collecting a coin, a bonus pickup, or defeating an enemy by jumping on top of it all add to the score; chaining several of these in a row without taking a hit raises a temporary score multiplier, shown on the combo indicator, which fades out again after a few seconds of no further pickups.
5. A bonus pickup also grants a short window of invincibility to enemy contact.
6. Touching an enemy any other way than jumping on top of it — or falling into a pit — costs one life, unless the player is currently invincible; running out of lives ends the scenario in Step 8 instead.
7. Each level's goal flag requires collecting every coin in the level before it can be reached; touching it while still missing coins does nothing (a cue signals it's not ready yet). Reaching an unlocked goal ends the scenario in Step 7.
8. The player can return to level-select at any time via the HUD's back button (Practice mode only) — the current attempt is discarded, overall progress (already-completed levels) is unaffected.

### Step 7 — Level complete

1. The level is marked completed.
2. A breakdown of any level-completion bonuses earned (finishing quickly, finishing without taking damage, collecting every coin) is shown alongside the updated score.
3. **Practice mode:** the player is offered to continue to the next level of the same world (only if one exists), return to level-select, or return to world-select.
4. **Arcade mode:** if a next level exists anywhere in the world1→world4 sequence, the player is offered a "next level" button that also auto-advances on its own after a short countdown, carrying the run's shared lives and score forward unchanged; otherwise (the very last level of world 4 was just finished) a "run complete" message is shown instead, with a single button back to the title screen.

### Step 8 — Game over

1. **Practice mode:** the player is offered to retry the same level (fresh lives, same level) or return to level-select.
2. **Arcade mode:** the player is sent straight back to the title screen — there is no retry and no level-select in this mode; the whole run is over.

## Extensions

- **1a.** The credits screen lists every third-party asset/library this game ships (graphics, audio, libraries) with its license, reachable from the title screen and returning there.
- **2a.** All worlds could in principle be listed with levels while still showing "coming soon" for a newly-added-but-not-yet-compiled world — this can happen for any number of worlds simultaneously now that completion no longer gates anything (see design.md).
- **6a.** Fullscreen can be toggled at any point while the game canvas is visible (loading, playing, level-complete, game-over) via the HUD's fullscreen button, independent of anything else happening on screen.
- **6b.** A connected gamepad can be used instead of the keyboard for the entire "Playing" step (movement + jump) with no separate setup step — it mirrors the same keyboard bindings.
- **7a.** Finishing the last level of a world (Practice mode) does not, by itself, jump the player to the next world — they choose where to go next from the level-complete screen, same as after any other level.
