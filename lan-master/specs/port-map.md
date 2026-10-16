# Port map: Lan Master v1.09 (NES, 6502 assembly) to JavaScript

How the original's routines correspond to the page's functions, what was compared with the original and how, and what the comparison
found. The original is the ROM of v1.09 of 14.06.11 and the author's source (`reference/`, both Public Domain); the page is `public/`
(`src/app.js` is the game, `src/core.js` the rules, `src/transitions.js` and `src/nes-gfx.js` the pictures, `src/famitone.js` and
`src/nes-audio.js` the sound).

## Verification level

Collection-wide levels (`AGENTS.md` at the root): 1 an executable oracle, 2 hand-computed values, 3 careful reading.

- **Level 1, for the game.** The ROM is run on a small NES written for the purpose (`tools/nes-machine.mjs`, with a 6502 core) next to the
  page's own scripts, with the same buttons, and after every frame the picture, the variables and the calls to the sound player are compared. That
  covers the title screen and its code entry, the start of every level (unpacking, the reveal, the first traces), the play (the cursor, the
  turns, the clocks, the trace, the percentage, the random rotation), the clear of a level and the table, the time out, the pause menu and its three
  choices, the ending, and the fades between them. The routines with no timing of their own are also called on the ROM and compared with the page's
  functions on far more inputs than a game visits: the random generator, the unpacking of a level, the choice of a random rotation, the trace
  and the order in which a level is drawn. The data is compared byte for byte (`test/rom-data.test.mjs`). The sound player, on the NTSC console the ROM
  runs it on, is compared update by update.
- **Level 3, for everything the page adds.** The language, the help, the credits, the touch buttons, the click on a tile, the page's layout and its
  scaling, what the page does when the window loses focus. The page was driven in a real browser (see `PROVENANCE.md`).

## How the oracle works

- **The source gives the ROM a map.** `tools/assemble.mjs` assembles `reference/source/` into exactly the bytes of `reference/release/Lan_Master.nes`
  (`test/reference.test.mjs`), so the labels of the source are where the ROM's routines and variables are. `tools/ram-map.mjs` lists the
  variables that are compared (their addresses are the source's `equ` lines, checked against it in the same test); `tools/symbols.mjs` gives the labels.
- **The machine.** A 6502 with cycle counts, 2 KiB of RAM, the NROM cartridge, the PPU registers the game uses (the vblank flag, the sprite zero hit
  that the game polls to split the screen, the address and data ports, OAM DMA) and a log of every write to the PPU during a picture. `tools/nes-frame.mjs`
  composes from it the picture the console would show (the background with its scroll, the sprites with their flips and priority), line by line; a line in which
  the ROM changes a register in the middle is reported as split and left out of the comparison (the lines of the ending's band; nothing else).
- **A frame.** `tools/rom-run.mjs` runs the ROM one NMI at a time with the pad given. The game finds out which console it is on (`detectNTSC`); the
  page runs at 50 ticks a second, so the comparison is made on the **PAL console** (`region: 'pal'`), where one NMI is one tick of the game's clock and one tick of
  the page's. On the NTSC console the game skips the logic in one frame of five (48 a second), which the page does not model.
- **The page.** `tools/port-run.mjs` runs the page's scripts in the order of `index.html` in a Node `vm`, with a stand-in for the DOM and canvases that keep the
  pixels. A read-only hook appended to a copy of `app.js` gives the oracle the page's state and the functions it calls (the page keeps them in a closure);
  `public/` is not changed. The page's clock starts one frame after the ROM first turns its display on (the ROM's first frame with the display on shows the
  picture before its first fade step, which the page has no tick for), and its frame counter is set to the ROM's, the phase of a counter that nothing resets being arbitrary.
- **The pad.** The same byte goes to both. The page reads its pad once a frame while the game runs, as the ROM does, and in the menus a press is an event that the
  page answers when it comes, one tick after the ROM reads it (`tools/lockstep.mjs`).
- **What is compared after each frame** (`tools/lockstep.mjs`, `tools/states.mjs`): every pixel of the 256 by 240 picture except the split lines; in the menu, the cursor,
  the sound and music switches, the logo's phase and animation, the counter, the code typed and its cursor, and the random seed; in the game, the level, the 256 bytes of the board, the clock and its
  divider, the trace counter and the ordinal of the computer to trace from, the percentage (both bytes, the one drawn, the target), the random rotation's counter, the seed, the cursor
  (position, direction, offset, colour), the turn asked for and the tile it is for, and the pause request; in the ending, the scroll, the text engine, the band and the counter that changes the line.
- **The sound.** `tools/rom-audio.mjs` hooks the first instruction of the ROM's calls to FamiTone (update, music start, stop and pause, effect start,
  sample stop), and records them with the frame they fall in. The page's calls to its player are recorded in the same way, and the two lists must agree frame by frame (the page's
  calls to the player come in the ROM's frame or the one after, because a press is answered by the page in the frame after the pad is read). The ROM pauses and stops the
  music around the rows of a table, which the page has no counterpart of; those calls are left out of the comparison. For the player itself the page's translation of FamiTone
  is driven by the ROM's calls on the NTSC console, and the 11 bytes it would send to the sound chip, and the samples of the drums, are compared with the ROM's after each update.
- **Routines called on their own.** `tools/rom-call.mjs` calls a subroutine of the ROM with the registers and memory the test sets and runs it until it returns
  (`test/rom-routines.test.mjs`).
- **A player.** `tools/solver.mjs` is a bot that plays a level from the page's own state: it moves the cursor and turns the tiles it needs to match the package's solved
  board of the level (each of the 50 boards is checked by the ROM's own trace to connect every computer), and presses A at the clear table.
- **Scenarios** (`tools/scenarios.mjs`, `npm test` and `node tools/oracle.mjs`):

| Scenario | What it covers |
|---|---|
| menu tour | the menu's cursor, the sound and music switches, the code entry (digits, cursor, leaving, a wrong code, the sound test, START), the start flash; 800 ticks |
| first level to the time out, and back to the menu | the start, the reveal, 2,688 frames of play, the time out, its table, the way back; 3,400 ticks |
| moving and turning | the cursor gliding and held, turns of 1, 2 and 3 quarters, a turn asked for while the cursor moves, START while it moves; 620 ticks |
| the pause menu | opening it, moving in it, resuming, restarting, leaving for the menu; 1,200 ticks |
| the bot plays the first levels | levels 1 to 3 solved, the clear animation and table, the next level; 1,300 ticks |
| the ending by its code | the code 6502, the flash, the fade and the ending; 1,900 ticks |
| the clear of the last level and the ending | level 50, its clear table, the fade to the ending and 2,000 frames of it; 2,800 ticks |
| every level from its passcode | the unpacking, the reveal, the first traces and the random rotation; 700 ticks each in `npm test` for levels 2, 11, 26, 39 and 50, 1,500 for all 50 with `LAN_MASTER_FULL=1` |
| the bot plays the campaign | level after level (`node tools/oracle.mjs campaign 20000`); not part of `npm test` |

**What was run, and the result.** The seven scenarios: 12,020 ticks, 9,652 pictures compared, 12,020 states, no difference in the picture, the variables or the calls to the sound player. Every level from its passcode (`LAN_MASTER_FULL=1`, 1,500 ticks after the code each): 50 of 50 with no difference. The campaign, 20,000 ticks from the first level (levels 1 to 29 cleared one after the other and the thirtieth in play at the end): 19,998 pictures, 20,000 states, no difference. `npm test` passes 47 tests in about a minute.

## The functions

| Original | Page | How it was checked |
|---|---|---|
| `reset`, `clearRAM`, `clearVRAM`, `detectNTSC`, `initGame`, `mainLoop` | the page's start-up and its state machine (`app.js`) | the oracle's clock: the page starts one frame after the display turns on |
| `mainMenu`, `mainMenuLoop`, `mainMenuCurUp/Down/Select`, `mainMenuStart`, `mainMenuShowCur`, `mainMenuSetSoundItems`, `mainMenuAnim` | `menuKey`, `menuActivate`, `beginMenuStart`, `menuAnimStep`, `menuTick`, `renderTitle`, `patchMenuAttrs` | lockstep: menu tour, every level scenario (the start flash) |
| `mainMenuEnterCode`, `mainMenuCodeUp/Down/Left/Right/Select/Return`, `mainMenuEnterCodeCur`, `mainMenuSfxTest` | `submitCode`, `leaveCode`, `codeString`, `syncCodeInput`, the code keys in `menuKey` | lockstep: menu tour, the ending by its code, the 50 passcodes, the sound test in the audio test |
| `gamePlayInit`, `gamePlay`, `initLevelVars` | `beginGameInitial`, `prepareLevel`, `resetRuntime` | lockstep |
| `unpackLevel` | `Core.unpackLevel`, `unpackOnce` | the ROM called directly: 50 levels, 3 seeds each; the map, the list of computers and the seed it leaves |
| `showLevel` | `revealTick`, `Transitions.showLevelBatches` | the ROM called directly (the order tile by tile and the pairs per frame, 50 levels, 2 seeds); lockstep |
| `gameLoopInit`, `gameLoop`, `gameLoopCode`, `nmiGame`, `nmiClock` | `playingTick`, `gameFrame`, `nmiClock` | lockstep |
| `moveCursor`, `setCurMove`, `showCursor`, the pad in `gameLoopCode` | `padPoll`, `padActions`, `cursorGlide`, `drawCursor`, `cursorShouldDraw`, the pad model (`padSet`, `padFreeze`, `padArm`) | lockstep: moving and turning |
| `setRotate`, `rotateTile` | `setRotate`, `rotateTarget`, `applyPending`, `Core.rotate`, `Core.pins` | lockstep; the tables are the ROM's bytes (`rom-data.test.mjs`) |
| `updateTerminals`, `updateStatOnline`, `updateStats`, `putNum3`, `putNum2` | `updateTerminals`, `redrawTerminal`, `refreshStats`, `drawGame`, the percentage's step in `gameFrame` | lockstep |
| `randomRotateTile`, `setRandomRotate` | `scheduleRandom`, `Core.chooseRandomRotation`, `Core.reloadRandomCounter`, `Core.counterDecrement`, `Core.counterTicksToZero` | the ROM called directly (every level, 3 seeds); lockstep |
| `traceMap`, the 16-bit compare of `GAME_ONLINE` | `Core.trace`, `Core.onlinePercent`, `doTrace`, `runTrace` | the ROM called directly: 50 levels, 7 arrangements, from every computer (more than 2,000 traces: the count, the "all joined" answer, the sum of the shares, the next computer and the map of the tiles it visited); lockstep |
| `rand` | `Core.randStep` | the ROM called directly: all 256 seeds |
| `levelClear`, `showTable`, `clearTable`, `showPassCode` | `beginClear`, `clearAnimTick`, `clearTableInTick`, `clearTableOutTick`, `clearActivate`, `beginHide`, `hideTick`, `prepareNextLevel` | lockstep: the bot on levels 1 to 3 and 1 to 30, the last level |
| `timeOut`, `timeOutCur`, `timeOutCurAttr` | `timeout`, `timeoutDelayTick`, `timeoutTableInTick`, `timeoutActivate` | lockstep: first level to the time out |
| `restartLevel` | `beginRestart`, `restartTick`, `Transitions.restartFrames` | lockstep: the pause menu |
| `gameMenu`, `gameMenuLoop`, `gameMenuDone`, `gameMenuClose`, `gameMenuShowCur` | `beginPause`, `pauseInTick`, `pauseTick`, `pauseMove`, `pauseActivate`, `pauseDoneTick` | lockstep: the pause menu |
| `exitGame`, the fades (`palBrightTable`) | `beginGameFadeOut`, `Transitions.fadePalette`, `fadeInStage`, `fadeOutStage`, `beginMenuFadeIn`, `finishMenuFade` | lockstep; the maps are the ROM's bytes |
| `wellDone`, `nmiDone` | `beginEndingFadeIn`, `renderEnding`, `endingTick`, `Transitions.createEnding`, `tickEnding`, `drawEndingColumn`, `NesGfx.renderScrolledSplit` | lockstep: the ending by its code, the clear of the last level |
| `sfxPlay`, `bgmPlay`, FamiTone (`famitone.asm`) | `AUDIO` in `nes-audio.js` and `famitone.js` (a translation of the parts the game uses) | the calls in lockstep; the player against the ROM's output on the NTSC console (4 songs, 12 effects, 54 samples) |
| the data: `levList`, `passwords`, `titleNameTable`, `gameBgNameTable`, `tilesTable`, `mapCodes`, `rotateLeft`, `pinsTable`, the palettes, the tables of the panels, the text of the ending | `levels.js`, `nes-assets.js`, `core.js`, `transitions.js` | `test/rom-data.test.mjs`, byte for byte |

## What the oracle found in the package's page

The page agreed with the ROM in the data, in the rules (apart from the first two items) and in the sound player's choice of notes. What differed, with where it is described in
`docs/development/CHANGES.md`:

1. **The percentage at the start of a level.** A computer that reaches no cable was counted as joined. The ROM counts a computer only when a neighbouring tile finds it.
2. **The figure that is kept.** The ROM keeps the largest result of a round of traces and compares by the high byte and then by the low byte, giving up if either is smaller. The page
   took the largest of the high bytes (level 26 shows it).
3. **The cursor sprite.** It was written over the board, pixels with it, and in a real browser left a black square. The ROM's cursor is the brackets over the board.
4. **The panel of the time out.** One tile too many in a row of its table.
5. **The cursor's movement.** It jumped a tile; the ROM glides for eight frames, keeps going while an arrow is held, ignores START while it moves, takes a turn asked for during a glide for the tile
   it moves to, and has a press counted only if it comes after the last time the pad was read. The integrator chose the original's.
6. **The order within a frame**, in many places a frame off: the clock and the trace counter, the numbers (drawn before the step of the percentage), the turn asked for, one computer redrawn, the random
   rotation, the percentage's step, the cursor, the pad; the trace by the main loop after the frame, 25 frames after the one before; the sprites on the screen being the previous frame's.
7. **The menu.** The cursors blink; the logo's animation is a frame behind and follows the music's noise channel; the typed code and the cursor in it stay; the start flash is 21 frames; the frames the
   ROM spends on a sound toggle, on sending a code and on leaving it.
8. **The waits.** The black frames before and after the fades; the number of frames of the reveal (the unpacking takes two to four frames, depending on where the music is); the clear animation (two frames,
   then 50, four computers a frame); the table row by row; the time out (the clock goes on, the cursor goes, 000, the music stops, one more trace that can still win, 50 frames, one, the table).
9. **The ending.** The ROM stops counting at the last line; the page faded it away 300 frames later. The frame counter of the screen is one behind the page's, and the band and the text above it use different
   pattern tables in the same frame.
10. **The sound.** Starting or stopping a song wrote the player's output at once; the ROM's buffer keeps what the last update wrote.

Faults of the oracle itself, found on the way: the console had to be PAL; the page's clock starts a frame after the display turns on; the sprite zero split lines had to be left out of the comparison of the picture; the
ROM's stops and pauses of the music around a table are not the page's.

## Known differences that are kept, on purpose

- **The ROM's quirks.** The 16-bit comparison of the percentage; the one computer redrawn a frame; the percentage that rises one a frame to 100; the cursor that draws one frame late; the trace that the main loop runs after
  the frame; the pad read once a frame, with the state of a button that is held through; the rotation of a tile that the ROM does with the source's `rotateLeft` table. None of them is "improved".
- **Big networks.** On the largest levels (about 43 to 50), when most of the network is joined the ROM's trace takes more than a frame (up to 40 thousand cycles; a frame is 33 thousand), and the percentage and the end of
  the level come a frame or two later in the original. The page traces at once. The last level is compared with the layout of level 39 for this reason (`levelAlias` in `tools/scenarios.mjs`).
- **The unpacking of a level.** It takes two to four frames in the ROM depending on where the music is when it begins. The page has a table of the six levels that take longer when the level starts from the menu
  (38, 42, 45, 46, 48, 49). After a clear, the same level can take one frame more or less (level 31 did, in a run of the whole campaign), which is not modelled.
- **The console.** The page ticks at 50 a second (PAL). The NTSC console runs the logic at 48 a second. The music runs at 60 updates a second, as the NTSC console's, and is compared on that console.
- **Where the page has more than the ROM.** The Main Menu button of the ending, the language, the help and the credits, the touch buttons, a click on a tile (which puts the cursor there at once), the pointer on the menu.
  They are the page's own and nothing was compared.

## What the comparison does not cover

- The page: its layout, texts, controls and flow, read and driven in a real browser (Chromium-based; no Firefox or Safari).
- The real console: the picture is composed by a scanline compositor, not a PPU, and the lines where the ROM changes a register in the middle are not compared; the sound chip itself is not modelled (the player's output
  registers are compared, not what the browser's oscillators make of them).
- The levels beyond the thirtieth played in a row: the 20,000-tick campaign ends in level 30 and is exact all the way; longer runs show the differences of the biggest levels (above). Levels 31 to 50 are compared from their passcodes, and the last also cleared, with the layout of level 39.
- Other browsers than Chromium-based ones.
