# M13 — Local autosave and resume

M13 adds browser-local persistence without changing the MilCity 1.0.5 simulation rules.

## User flow

- Starting a game immediately creates a local autosave.
- While a game is in progress it is saved at most every 5 simulation seconds.
- Important user actions, action/mode selection, language changes, leaving the game, page hiding and browser unload also force a save.
- When a valid unfinished save exists the main menu shows **Resume Game / Riprendi partita** above **New Game / Nuova partita**.
- Starting an actual new match replaces the previous autosave.
- Finished games are removed from the resumable-save slot.

The save is stored only in browser `localStorage` under the versioned key:

`milcity.m13.autosave.v1`

There is no account, server or cloud synchronization.

## Preserved state

The save contains:

- map and all current cell values, including craters/explosion state;
- buildings and construction/production clocks;
- shields and expiry times;
- money, energy, acceleration and score;
- ammunition and weapon cooldown;
- radar/intelligence status;
- win/loss and blackout state;
- AI level, internal five-tick turn counter and exact Java-compatible RNG state;
- game RNG state and current simulation time;
- current City/Military mode, selected actions and cursor position;
- water/score/starting-money options used for the match;
- EN/IT language;
- radar visual-decay phase.

Closed-page time is deliberately **not** applied to the simulation. Reloading resumes the same logical instant rather than granting money/ammunition or advancing the AI while the game is closed.

## Validation

M13 adds a JSON save/restore round-trip test and, more importantly, a continuation test:

1. run a seeded game;
2. save and restore it through JSON;
3. continue both original and restored games for another 180 seconds;
4. require their complete serialized states to remain identical.

A representative 300-second two-player save is about 12 KB, comfortably small for normal browser local-storage quotas.
