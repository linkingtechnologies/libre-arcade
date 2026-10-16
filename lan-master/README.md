# Lan Master

**[▶ Play here](https://linkingtechnologies.github.io/libre-arcade/lan-master/public/index.html)**

HTML5 restoration of **Lan Master**, the puzzle game for the Nintendo Entertainment System that Shiru made in 2011. A board of 12 by 12 tiles holds computers, pieces of cable and a few loose ends; you turn the tiles one at a time until every computer is in one network, before the time runs out. There are 50 levels, a passcode for each, and from level 11 on the network turns tiles by itself. The page is the one that a restoration package built from the author's ROM; here it was put next to the ROM itself, run on a small NES of our own, and corrected wherever the two differed. The pictures, the music and the sound effects are the original's.

## Play

- **Goal.** Join all the computers in one network before the time at the top of the board runs out. The number on the board is the share of the computers that are joined (DONE). Pieces of cable that are not joined to anything can stay as they are.
- **Keyboard.** The arrow keys move the cursor, one tile at a time; hold an arrow and it keeps going (it takes eight frames for a tile, as on the console). **Z** or **A** turn the tile under the cursor a quarter one way, **X** or **B** a quarter the other way, **Shift** a half turn. **Enter** pauses (and chooses, in the menus).
- **Touch.** The arrows, A, B, SELECT and START are on the screen below the picture, and a tap or a click on a tile puts the cursor there. The buttons at the top are the language (EN and IT), the help and the credits.
- **Passcodes.** The table after a level that is cleared and the pause menu show a four-digit passcode. On the title screen, choose the code entry and type it: the game opens at that level (there are 49, for levels 2 to 50).
- **The pause menu** has Resume, Restart (the level again, from the start) and Main menu, and shows the passcode of the level you are in.
- **From level 11** the network turns a tile now and then by itself, and the interval between turns gets shorter with the levels.
- **Time out.** If the time is over the table says so and the level is played again. If the last trace of the network shows it complete a moment after the time ends, the level is won, as in the original.

## Hidden in the original

The cartridge has two things that it never mentions, and this page has them too (the page does not mention them either). Both are typed in the code entry of the title screen.

- **The ending, from a code.** Typing **6502** in the code entry opens the ending screen at once. It is the fiftieth code of the ROM's table, the one after the 49 that open levels.
- **A sound test.** In the code entry, **68** followed by two digits plays the sound effect with that number: **6800** to **6811** are the twelve effects of the game (the music is not in it). Any other code that is not a passcode is refused.

## What is preserved

The ROM decides what is right. A very large part of what is on the screen is the original's own data run by a new, small program:

- **The levels.** All 50: the tiles, the share each computer counts for, when the network turns by itself, the time, the starting position of the cursor. The 49 passcodes and `6502`.
- **The rules.** How a tile turns, which sides of each piece of cable are open, how the network is traced and counted, the random generator (an 8-bit one, as the ROM's) and the way it scrambles a level and turns tiles later.
- **The pictures.** The character sheet, the title, the board, the ending, the palettes, the way a level is drawn a piece at a time, the tables for a cleared level, the time out and the pause menu, the fades.
- **The sound.** The four tunes, the twelve effects and the 54 samples are the ROM's bytes, played by a translation of FamiTone, the library that the game uses, to the Web Audio API.
- **The timing.** The frame in which each thing happens in the ROM happens in the same frame on the page, as far as the 50 ticks a second of the page allow (see below).
- **The cursor.** It glides from tile to tile in eight frames, keeps going while an arrow is held, and does not take START while it moves.
- **The quirks the ROM has.** Things that look like bugs and are the original's are kept (see [`AGENTS.md`](AGENTS.md)): a percentage that is not updated when the new figure's low byte is smaller than the old one, a computer that is counted only if a neighbouring piece finds it, one computer redrawn each frame.

What was checked, and how far, is in [`specs/port-map.md`](specs/port-map.md); where everything comes from, the licences and the open points are in [`PROVENANCE.md`](PROVENANCE.md). The language switch, the help, the credits, the touch buttons and the click on a tile are the page's own and are not compared with the original.

## Run

```sh
npm run dev      # serve public/ at http://localhost:8080
```

There is no framework and no build step to play: `public/` is plain HTML, CSS and JavaScript (classic scripts). Any static web server works. `npm run build` packages `public/` into a gitignored `game/` folder for standalone deployment; `npm start` builds and then serves `game/`.

## Test

```sh
npm test         # node --test: the ROM, the source and the page, side by side
npm run lint
npm run check    # lint + test
```

`npm test` runs the ROM itself: it is in this repository, together with the author's source, which `tools/assemble.mjs` assembles to exactly the same bytes (`reference/`). The ROM runs on `tools/nes-machine.mjs`, a NES written for the purpose, next to the page's own scripts in Node with the same buttons, and the picture, the game's variables and the calls to the sound player are compared after every frame. `LAN_MASTER_FULL=1 npm test` also plays all 50 levels from their passcodes (about six minutes more). The numbers are in [`specs/port-map.md`](specs/port-map.md).

## License

The original game, its source and its music are released into the Public Domain by Shiru, in the source's own words (the manual and the box labels say "PD" too), and so is the FamiTone library. They are in `reference/` and their data is in `public/src/` unchanged. The code of the page (`public/src`, `public/index.html`) is the restoration package's, under the GPL-3.0-or-later that the package gave it, with the corrections made here; the tools and the tests are GPL-3.0-or-later as well. See [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md) and [`PROVENANCE.md`](PROVENANCE.md).
