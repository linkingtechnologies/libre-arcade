# Port map

Original: `reference/source-v1.12/` (6502 assembly for NESASM, about 2,700 lines in `game.asm` and its includes, plus the FamiTone player and the music exports) and the competition ROM `reference/competition/Lawn_Mower.nes`. Port: `public/src/` (the game, the picture unit's memories, the picture, the sound player, the data) and the page, `public/app.js` and `public/index.html`, which are new code and not a port.

## Verification level

Following the collection's verification hierarchy (root `AGENTS.md`):

- **Level 1, an executable oracle, for the game itself.** The preserved competition ROM is run (and, as second and third programs, the author's own v1.12 ROM and the v1.12 source assembled here) and the port is compared with its memory at every NMI. This covers the state machine of the title, the set-up of a level, play, the pause, the end of a level, the messages and the final screen; the pacing; the random numbers; the position, the speed, the fuel, the grass, the cans; the pad and its cheat.
- **Level 1 for what the picture unit holds.** At every NMI that shows a picture, the nametables (2 KiB), the palette (with the fade) and the sprite memory of the port equal the ROM's, as the ROM's picture unit had them when the picture began.
- **Level 1 for the sound.** At every NMI the 11 bytes that the port's FamiTone player hands to the sound chip equal the ROM's (`FT_OUT_BUF`), through every tune past its loop and every effect.
- **Level 1 for the pictures.** The picture the ROM puts on the screen is composed from its memories and the log of its register writes (`tools/nes-frame.mjs`) and compared pixel by pixel with `public/src/display.js`'s, on every line but the few where the original changes a register in the middle of the line.
- **Level 1 for data, by the ROM's own bytes** (`test/rom-data.test.js`): the ten levels decoded from the ROM's character memory, every table of tiles, palettes, messages and sprites, the fade table, the note table, the two packed screens; and, from the source (`test/famitone-data.test.js`), the music and effects data, assembled again.
- **Level 3, source-level reading, for what is left:** how the page turns the sound player's bytes into Web Audio, the colours of the screen (a table chosen for this port), and the page itself (keys, touch, the loop, the panel, the language).

### How the oracle works

`tools/nes-machine.mjs` is a minimal NES under `tools/mos6502.mjs` (a 6502 core with cycle counts, tested in `test/mos6502.test.js`): 2 KiB of RAM, the 16 KiB of program mirrored, the picture unit's status, scroll, address and data ports with the nametables, the palette and the sprite memory (and the sprite DMA), the controller ports with the strobe and shift protocol, the vertical blank flag and the NMI at the start of a frame of 29,780 cycles, and the **sprite 0 hit** flag, which the game polls to split the screen and which the machine works out from the sprite, the background and the scroll at the line where it happens. It keeps the scroll registers the way the console does (the temporary address `t`, the fine X scroll, the write toggle), and, when asked, a snapshot of the memories at the start of the picture and a log of every register write with the CPU cycle it fell on. It does not draw (that is `tools/nes-frame.mjs`) and does not play sound; everything the program computes is computed by its own code. `test/nes-machine.test.js` checks the machine and the compositor on programs and pictures small enough to know the answer.

The ROM's variables are at fixed addresses (the zero-page map at the top of `game.asm`; the v1.12 source and the competition ROM share them), so `tools/rom-oracle.mjs` reads them by name, and nothing has to be searched for in the code.

`tools/lockstep.mjs` boots the ROM to the first frame of the title and then runs it and the port side by side, one NMI at a time, giving both the same pad (`tools/bots.mjs`: players that read the ROM's memory to mow, fetch fuel and pause, with a seeded amount of wandering; players that press anything at random; and the title's cheat, which gets them through all ten levels). At every NMI it compares:

1. the variables: the frame counters, the random seed, the three pad bytes (what is read, what was read before, what is new), the position, the direction and the requested direction, the speed, the offset to the next tile, the fuel, the delay, the cut counters, the can and the timer for the next, the camera, the animation byte, the flags, and while a message is shown its counters; in the title, the two scrolls, the start counter, the palette animation and the cheat's ring buffer;
2. the map of 512 bytes, and the 256 bytes of the sprite page;
3. the nametables, the palette and the sprite memory of the picture unit, from the snapshot taken when the picture started;
4. with the sound player attached, the 11 output bytes;
5. with the pictures asked for (`tools/oracle.mjs`), the picture.

While the ROM sets a screen up it keeps the display off for several NMIs and does the work in its main thread; the port has a `setup` mode for these and the two must agree on when the display is on again (the lengths, measured on the ROM, are 10 NMIs for levels 1 to 3, 9 for the others, 1 for the final screen and 2 for the title that follows it).

Two ROMs are run: the competition ROM v1.1 and the v1.12 source assembled by `tools/assemble.mjs`. The port has one switch, `checkPadClearsDirection`, for the one place where they differ in what the game does (see the root `AGENTS.md`); it is `true` against the first and `false` against the second.

### What was compared

`npm test` runs the five scenarios of `tools/oracle.mjs` against each program (5,000 to 20,000 frames each, the picture every fourth frame) and the sound sweep; `npm run test:live` runs them long (40,000 to 90,000 frames each, every frame's picture) for two seeds and each program. See `PROVENANCE.md` for the totals of the last live run. In all of them there is no difference, with one exception: against the author's v1.12 ROM the port is let to follow the ROM's length for each screen set-up (the flavour `v1.12-release`), because that build keeps the display off for 10 NMIs, not the table's 9, when it loads the fifth lawn on some entries; nothing else may differ (`test/oracle-release-v1.12.test.js`).

The scenarios:

| Scenario | What it plays |
|---|---|
| `mow` | a player that goes for fuel cans when the tank is low and for the nearest uncut grass otherwise, with some wandering, boosts and START presses: levels 1 and 2, the clears, the pauses and the empty tank |
| `cheat` | the title's code and SELECT now and then: all ten levels, the final screen, the title again and a second game |
| `chaos` | random buttons, START and SELECT together with anything |
| `chaos-cheat` | random buttons after the cheat code |
| `wander` | a player that never mows and runs out of fuel |

The sound sweep plays the title for 4,300 frames, the biggest lawn for 5,500 frames of an uninterrupted game (the game's tune takes 3,860 to come round), the message after a cleared level and after an empty tank for 1,300 frames (544 to come round) and the final screen for 2,600 frames (2,560), and starts every sound effect there is (the mute, number 10, is started by the game and mixed once).

### What the oracle found

The package's port was written from the text of the source and from its own readings of it. Running the ROM showed it differing in these places, all fixed:

| Difference | In the ROM |
|---|---|
| The pacing | The game's loop passes "this NMI is processed" to its end in the X register, and `fuelUpdateTime` does not keep X: whenever it goes looking for a place for the next fuel can it leaves X = 11. A skipped NMI that searches therefore runs the whole game logic anyway. |
| The borders of the lawn | `setField` draws rows 0 and 1 as sky, row 2 as the top hedge, row 14 as the bottom one, the side hedges down rows 3 to 14 and the corners over them, and then clears to blank everything to the right of the lawn in rows 0 to 13. The package's map ran the sky and the top hedge to the right edge and had plain hedge where the original has four corner tiles. |
| What a level starts with | `setSprite0` checks the tile under the mower once (usually the "nothing here" mute on the grass sound's channel), and the can's and the next can's Y are not cleared, only their X. |
| The pad | The game reads the pad only in some of its loops (not during the wait before play, not while the mower is stopped for the end of a level, not during the fade of a message), takes a button as pressed when it was not down at the previous read, and un-pauses and acknowledges the final screen only when START is the one new button. The package took a one-shot "START" from the page. |
| The cheat | RIGHT, UP, LEFT, LEFT on the title, kept in a ring of four, switches on a level skip: SELECT fills the tank and ends the wait at the start, completes the lawn in play and cuts short the wait after a clear. It plays the "skip" sound. Not in the package. |
| The frame counter | The display is off for 10, 9, 1 or 2 NMIs between screens, and the frame counter goes on counting through them: the fuel decrement and the speed decay look at its low bit, and the can blinks with its fourth. The package counted none of those frames. |
| The messages | `showMessage` writes the message twice over the map's rows 7 to 9 starting under the screen's left edge, then draws one column per processed NMI, blanking the second half as it goes (and blanking the next column also on the NMIs the pacing skips); it takes the mower's sprites off the screen as the message passes over them; while it waits it redraws rows 5 to 7 (not 7 to 9) of its column every NMI; the band in which the message flashes is lines 118 to 155 (the package drew 116 to 153); the animation byte is set to $80. |
| The sprites | The 64 sprites of the picture unit have a priority (the lower number is in front) and at most eight to a line. The package drew the mower's sprites in table order, so its second palette painted over its first and the mower's body lost its details. The mower's left-edge sprites wrap round to the right edge, because the coordinate is one byte. |
| The fade | The fade is the original's brightness table, four steps, applied to half the palette on even NMIs and to the other half on odd ones, one step every fourth NMI; a pause is a step of that table, not a black layer. The package dimmed the picture with 0, 36, 68 and 100 per cent of black. |
| The title | The cheat's buffer of presses starts again with each showing of the title, while the cheat itself stays on. |
| The sound | A silent channel keeps the last pitch in the output buffer; an effect that is not playing is not mixed in (the package mixed the idle streams' cleared buffers over the music); the mute is effect 10, mixed once; the end of a cleared level mutes the effects ten counts after it starts, not at once; the can's sound is heard in the NMI that adds it, the others from the next. |
| The end | After the last level the game's level counter is 10, the final screen's set-up takes one NMI and the title that follows two. |

Where the competition ROM and the source differ, the oracle says so exactly: with the v1.12 behaviour a mower that is moving when the lawn is completed or the tank empties reaches the edge of its tile and, because the source's `checkPad` no longer clears the requested direction, starts into the next tile until the end of the level takes over; v1.1 has no direction left at that edge and stops there. The two differ in where the mower rests, by at most 14 sixteenths of a pixel: `test/kernel.test.js` finishes the first lawn at 150 moments in each of the four directions with the port set to each version and checks it (this measures the port in its two settings, each of which the oracle shows to equal its ROM; the two ROMs were not compared with each other on one script, because they reach the first frame of the title with different frame counters, 5 in the competition ROM and 4 in the assembled source, and the oracle gives the port each ROM's own).

## Map of the original's routines

| Original | Port |
|---|---|
| `reset`, `clearRAM`, `clearVRAM`, `detectNTSC` | `LawnMowerKernel.coldReset` (the state at the first title frame; `BOOT_FRAME_COUNT` is what the ROM leaves). The NTSC test is not ported: the page is NTSC only |
| `showTitle` (`title.asm`), the title loop | `showTitleVideo`, `titleFlowPhysicalTick`, `advanceTitleVisual`; the bands in `display.js` (`TITLE_SPLITS`) |
| `initGame`, `initLevel` | `initLevel`, `beginSetup`, `setupTick`, `setLevelPalette` |
| `setField` | `setField`; `Ppu.drawField` and `Ppu.drawStatusBar` for the screen |
| `setSprite0` | `setSprite0` |
| `mainLoop`, `updateVideo`, `statusSplit`, `setScroll` | `physicalTick`, `captureRegs`; `bandsFor` and `composeDisplay` in `display.js` |
| `checkPad` | `processedGameplayTick` with `requestDirection`, `updateSpeed`, `padPoll` |
| `playerMove` | `movePlayer`, `clipAndCheckIfNeeded`, `alignForTurn` |
| `checkTile`, `cutGrass`, `cutFlowers`, `cutFlowersCut`, `cutStone`, `cutFuel` | `checkTileAt`, `checkCurrentTile` |
| `fuelSubtract`, `fuelUpdate`, `fuelUpdateTime`, `fuelAdd`, `fuelSetTimer` | `subtractFuel`, `updateFuelCanTile`, `fuelUpdateTime`, `tryGeneratePendingFuel`, `addFuelCan`, `setFuelTimer` |
| `setSpeed`, `playerPixelCoordsAlign`, `playerTileCoordsAlign` | derived where used; `alignPlayerPixelCoords`, `alignForTurn` |
| `playerShow`, `putMetaSprite`, `updateFuelBar`, `chrAnimation` | `playerShowLogic`, `updateFuelBar`, `chrAnimation` |
| `levelClear`, `outOfFuel` | `beginLevelClear`, `beginOutOfFuel`, `flowPhysicalTick` |
| `showMessage` | `showMessageFill` and the reveal and wait phases of `flowPhysicalTick` |
| `gameClear` | `beginGameClear`, the `complete` mode of `flowPhysicalTick`, `resetTitleWithoutReseed` |
| `rand`, `max` | `LawnRng.next`, `sourceModulo` (`rng.js`) |
| `ntscIsSkip` | `shouldProcessThisNmi` |
| `padPoll`, `padInit` (`controller.asm`) | `padPoll` |
| `updateTile`, `putNum1/2/3`, `unrle` (`rle.asm`) | `Ppu.updateTile`, `Ppu.putNumber`, `Ppu.unrle` (`ppu.js`, `rle.js`) |
| `palReset`, `palSetup*`, `palSetFade*`, `palUpdate`, `palBrightTable` (`palette.asm`) | `Ppu.palReset`, `palSetup`, `palSetFadeIn/Out/Half`, `palUpdate`, `PAL_BRIGHT_TABLE` |
| `FamiToneInit`, `MusicStart/Stop/Pause`, `Update`, `SfxStart`, `SfxUpdate` (`famitone.asm`) | `FamiToneSequencer`, `FamiToneSfxSequencer` (`famitone-player.js`); the calls the game makes are the events handled by `LawnAudioEngine.processEvents` |
| The data tables | `nes-assets.js`, `constants.js`, `levels-data.js`, `famitone-data.js` |

## Files

| File | What it tests |
|---|---|
| `test/oracle-v1.1.test.js`, `test/oracle-release-v1.12.test.js`, `test/oracle-v1.12.test.js` | the five scenarios and the sound sweep against each of the three programs, everything compared |
| `test/oracle-sensitivity.test.js` | that the comparison sees thirteen deliberate breaks of the port, and still passes without one |
| `test/rom-data.test.js` | the tables, the levels and the screens against the ROM's bytes |
| `test/famitone-data.test.js` | the music and effects data against the source's exports, assembled again |
| `test/assemble.test.js` | the assembler, and the recorded hashes of what it builds from the source |
| `test/nes-machine.test.js`, `test/mos6502.test.js` | the machine and the compositor; the 6502 core |
| `test/kernel.test.js` | properties of the game logic in words; the picture unit's routines; a long random run |
| `test/reference.test.js` | the preserved files against their manifests and the licence lines |
| `test/page.test.js` | the page: preferences, shell, deployed tree, imports, the beacon |

## Limits

- The comparison is exact on every line of the picture except those where the original changes a register in the middle of the line (33 on the playing screens, 27, 94, 160, 161 and 185 on the title, and 116, 154 and 155 around the message's flash). Where in such a line the change falls depends on how the CPU and the picture unit were aligned, which the machine does not model; the port draws the line with the settings it starts with.
- The sound player's output is compared up to the 11 bytes it hands to the sound chip. How the page turns them into sound (Web Audio oscillators and a noise buffer) is not compared with anything.
- The colours of the screen are a table chosen for this port.
- The page's keys, touch controls, panel and language were driven by hand in a browser, not by a test; the tests check the shell's structure.
- The competition ROM's identity with the archive the competition itself served was not checked (see `reference/competition/SOURCE.md`); the port is compared with the ROM as it was preserved.
- PAL consoles run the game differently (no 4-in-5 pacing); this port is NTSC only.
