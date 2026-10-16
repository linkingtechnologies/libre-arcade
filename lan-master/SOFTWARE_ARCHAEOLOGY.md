# The software archaeology behind Lan Master

This is the recovery story of this one game. The philosophy shared by every game in the collection (preserve the reasoning and not just the artifact, verify by execution rather than resemblance, record provenance instead of erasing it) is in [`../SOFTWARE_ARCHAEOLOGY.md`](../SOFTWARE_ARCHAEOLOGY.md).

## A short game that took half a year

Lan Master is a puzzle game for the Nintendo Entertainment System by Shiru. His development notes say how it began: in November 2010 he wanted a simple game that would not take long, and expected to finish it before the year ended. It took half a year, with breaks and side projects, among them NES Screen Tool and FamiTone, the sound library that the game uses. The idea was a NetWalk-like game (NetWalk by Gamos, 1996) with no server and a few additions. The first thing he made was a mock-up of the title and of the board, in Graphics Gale, and with small changes it became the real graphics.

The hard part was the tracing of the network, which decides whether a computer is joined to the others. He wrote it in C first, inside the level editor, and then again in 6502 assembly. The sound was hard for another reason: most of the game was written before FamiTone existed, so the calls that update the sound are, in his word, messy. There are about 5,100 lines written by hand. He made the game without a console and tested it on one only when it was nearly finished. After the release mbrenaman reported that the ending screen did not work on the real hardware and that part of the cursor was missing when the game was continued from a passcode, and a series of fixes followed. In 2015 rainwarrior found a bug in entering the pause, with a fix, and the ROM and the source were updated again. The ROM in this repository is the last of them, v1.09 of 14 June 2011.

## What the restoration package had

A restoration package, `lan-master-1.0.1-m16-source.zip`, came with the request. It held a JavaScript page, the 50 levels and the 49 passcodes as data, the pictures and the music taken from the ROM as bytes, a translation of FamiTone, 11 test runners and, in a form its tests could use, a solved board for each level. Its reports called the page production ready, and they were careful about what they claimed, and one gate they left open: the reproducible build of the ROM from the author's source.

The data was right. The rules were a port of the source's behaviour, and they were mostly right. But the package's tests compared the page with the package's own reading of the ROM and with files that fixed its bytes, so none of them could say whether the page agrees with the cartridge in the place where a player sees it: in the order in which things happen within a frame, in how many frames each wait takes, in the picture, put together out of a background, sprites and a split of the screen at a line.

## The author's ROM and source

The author's site served two zips, the release and the source. Both were fetched from the Internet Archive's copy of the site (the `id_` form of a Wayback address returns the stored bytes unchanged), with the integrator's permission, and the ROM and the notes of the package's `reference/` were found to be byte for byte the author's. The licence is in the source's first lines: "The game and its source code are released into Public Domain", and FamiTone says the same. So the ROM and the source are in this repository, under `reference/`, and the oracle runs on them.

The author's assembler is not in his archive. The source is NESASM 3, and a small assembler was ported to run it (from the one that came with Lawn Mower's package). What it needed to reproduce the ROM is one rule that the first attempt did not have: NESASM encodes an operand as a zero page address only when it is a plain number of one or two digits or is written with a `<`; a symbol is absolute even if it was defined as a number below $100. With that rule the source of Lan Master assembles to exactly the ROM (`test/reference.test.mjs` checks it on every run), and so does Lawn Mower's. That is the gate that the package had left open, and the reason that the oracle can use the source's labels to find the ROM's routines and variables.

## The oracle

A 6502 core and an NROM board were copied from Lawn Mower's and Zooming Secretary's oracles, and the rest was written for this game:

- **A console.** The page runs at 50 ticks a second, which is a PAL console. The ROM finds out by itself which console it is on , and on a PAL one every frame is one tick of the game; on an NTSC one the ROM's logic skips a frame in five and the game runs at 48. The comparison is made on the PAL console, one tick against one frame.
- **A frame.** The ROM's frame is the NMI. After every frame the picture the ROM would show is composed from its background, its sprites and its registers, and compared pixel by pixel with the page's canvas, except for the lines where the ROM changes a register in the middle of the screen (the split of the screen at a line). The variables of the ROM (its RAM map comes from the source's own `equ`s) are compared with the page's state, and the calls the two make to the sound player are compared in the frame they come.
- **The page, unchanged.** The page's own scripts run in Node, in a `vm`, with a stand-in for the DOM, and a read-only hook appended to a copy of `app.js` hands the oracle the page's state.
- **The pad.** The same buttons go to both. A press that the ROM reads in one frame reaches the page in the tick that follows.
- **Routines called on the ROM.** The routines that have no timing of their own (the random generator, the unpacking of a level, the choice of a random rotation, the trace, the order in which a level is drawn) are called directly on the ROM and compared with the page's functions on the same inputs: all 256 seeds of the generator, the 50 levels with three seeds, thousands of arrangements of the trace.
- **A player.** A bot solves the levels by pressing the pad, from the page's own state and the package's solved boards (the ROM's own trace says that each of them joins every computer), so that the clear tables, the passcodes and the way into the next level are the ROM's and the page's own.
- **The sound player,** on its own. The four songs, the twelve sound effects and the 54 samples of the drums are played by the ROM on an NTSC console and by the page's translation of FamiTone, and the 11 bytes that the player sends to the sound chip are compared after every update.

## What it found

The page agreed with the ROM in the data, the rules and the sound player at the first comparison, apart from the places below. What differed was how the screens are put together and in what order the frame does things.

- **Four things a player could see.** The cursor drew a black hole in the board in a real browser (the sprite was written over the pixels instead of onto them); the share of the network rose to 50 at the start of every level, because a computer that reaches no cable was counted as joined; the panel of the time out had a tile too many in a row; the ending was left in a state in which the ROM stops and the page went on to fade it out.
- **The cursor.** It moved a tile at once. In the ROM it glides for eight frames, two pixels at a time, goes on while an arrow is held, and START is ignored while it moves. This was a decision for the integrator, and the original's cursor was chosen.
- **The order in a frame.** The numbers on the board are drawn before this frame's step of the percentage, the cursor on the screen is the one the frame before left, the trace is run by the main loop after the frame and again 25 frames later, one computer is redrawn a frame. The page had an order of its own, which differed from the ROM's by a frame in many places.
- **A comparison that the ROM does badly.** The ROM keeps the largest result of a round of traces and compares it with the new one by the high byte and then by the low byte, and gives up if either is smaller. A larger figure with a smaller low byte is not taken. Level 26 shows it. This is the original's, and the page does the same.
- **The menu.** The menu's cursor and the code's blink with a counter that a press resets; the logo's animation follows the music's noise channel; the code you typed is kept; the start flash is 21 frames, not 20; and the ROM spends frames of its own on a sound toggle, on a code and on leaving the code.
- **The sound player.** Starting or stopping a song wrote the registers at once; in the ROM the buffer keeps what the last update wrote until the next one.
- **Faults of the oracle itself,** found and fixed on the way: the console had to be a PAL one before anything agreed; the page's clock starts a frame after the ROM turns its display on (the ROM's first frame with the display on shows the picture before its first fade step, and the page has no tick for it); the ROM stops and starts the music around the rows of a table, which the page has no counterpart of, and those calls are left out of the comparison of the sound player's calls.

The package's account of its page (behaviour certified, files frozen) was right about a great deal and could not be right about the order of a frame. Its tests that pin the bytes of its files fail now that the files have changed, on purpose, and say so.

## Checked against the cartridge

The menu tour, the first level to the time out and back to the menu, moving and turning, the pause menu, the bot on the first levels (and on the first 30 in a long run), the ending by its code, the clear of the last level and the ending, and all 50 levels from their passcodes are compared with the ROM frame by frame with no difference in the picture, in the variables, or in the calls to the sound player. The numbers are in [`specs/port-map.md`](specs/port-map.md).

## What stays open

- The time the ROM takes to trace a network that is almost all joined is more than a frame on the biggest levels (about 43 to 50), and the page, which traces at once, sees the end of the level a frame or two earlier. The unpacking of a level takes two or three frames depending on where the music is.
- The page is a PAL console at 50 ticks, not the NTSC console's 48 for the logic, and plays the music at the NTSC console's 60 updates a second.
- Where the page has more than the ROM (the language, the help, the credits, the touch buttons, the click on a tile) nothing was compared.
