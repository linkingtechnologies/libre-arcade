# Provenance

## What this is

*Lan Master* is a puzzle game for the Nintendo Entertainment System made by Shiru between November 2010 and the spring of 2011, written in 6502
assembly (about 5,100 lines by hand, the author says) for an NROM cartridge, with FamiTone, his own sound library, for four tunes, twelve sound
effects and the samples of the drums. A board of 12 by 12 tiles holds computers and pieces of cable; you turn the tiles until every computer is in one
network before the time runs out. There are 50 levels, a passcode for each, and the network turns tiles by itself from level 11. This folder is a
restoration for the browser, in JavaScript, with the original's pictures, music and rules. The version followed is **v1.09, 14.06.11** (the ROM's own
version string); the source files are dated May 2011.

It started from a restoration package, `lan-master-1.0.1-m16-source.zip` (SHA-256 `7c11e72a8b3fd16f91b5a229315143909e2e87a75c573bdd90480e171ce70388`), that
carried a JavaScript page whose data is the ROM's, 11 test runners and the reports of milestones M13 to M16, which called it production ready. The package's
tests compare the page with the package's own reading of the ROM and with files that fix its bytes. The one thing it left open was a build of the ROM from
the author's source. What was done here is a comparison with the original that can be repeated, run on the ROM itself, and the corrections it made necessary.

## Where each thing comes from

| Thing | Source | Evidence |
|---|---|---|
| `public/index.html`, `public/src/app.js`, `core.js`, `nes-gfx.js`, `transitions.js`, `famitone.js`, `nes-assets.js`, `style.css` | the package's, corrected | the oracle (`specs/port-map.md`); the list of changes with hashes is `docs/development/CHANGES.md` |
| `public/src/levels.js`, `audio-data.js`, `nes-audio.js` | the package's, unchanged | the levels and the audio data are the ROM's bytes (`test/rom-data.test.mjs`, `test/audio.test.mjs`) |
| the data in `nes-assets.js` (the character sheet, the compressed pictures, the palettes, the tables of the panels, the fades) | the package's, with one table regenerated (the time out panel) | `test/rom-data.test.mjs`, byte for byte against the ROM and the source |
| `docs/development/package/` | the package's documents, tests, reference and tools, unmodified | its `SHA256SUMS.txt`; `test/package.test.mjs` runs its tests against `public/` |
| `reference/release/` | the author's release zip, as his site served it (`lan_master.zip`), from the Internet Archive's copy | SHA-256 of the zip and the ROM in `reference/SOURCE.md` and `reference/SHA256SUMS.txt`; the ROM and the notes are byte for byte the ones in the package's `reference/` |
| `reference/source/` | the author's source zip (`lan_master_src.zip`), the files the build uses | the source assembles to exactly the ROM (`test/reference.test.mjs`) |
| `tools/mos6502.mjs`, `tools/nes-machine.mjs`, `tools/assemble.mjs`, `tools/lockstep.mjs`, `tools/nes-frame.mjs` | copied from Lawn Mower's and Zooming Secretary's oracles (which started from Concentration Room's) and extended here | they run the ROM from reset to the ending, and the ROM's own variables behave as its source says |
| `tools/ram-map.mjs`, `rom-run.mjs`, `port-run.mjs`, `states.mjs`, `scenarios.mjs`, `solver.mjs`, `rom-audio.mjs`, `rom-call.mjs`, `pad-script.mjs`, `symbols.mjs`, `package-modules.mjs`, `oracle.mjs` | new | `npm test` |
| `screenshots/` | headless Chrome, on a temporary copy of the page with the oracle's hook, so that a level could be started and a board set | looked at |

## The licences

**The original** is **Public Domain**, in the author's own words. The first lines of `reference/source/game.asm` ("by Shiru", 05'11) say
"The game and its source code are released into Public Domain", and those of `reference/source/famitone.asm` ("FamiTone audio library v1.24", by Shiru, 06'11) say
"Feel free to do anything you want with this code, consider it Public Domain". `test/reference.test.mjs` checks that both statements are in the files. So the ROM, the source, the pictures and the music
are in this repository, and the page uses their data as it is; nothing is relicensed.

The same statement is on the author's manual and labels, which are not here (`reference/SOURCE.md` lists them with their checksums). The manual's cover says "PD 2011 Shiru" and its introduction says that the game is free of charge and "released into Public Domain"; both box labels say "PD Shiru 2011". The manual's text was extracted from `manual.pdf` by the integrator (the PDF's SHA-256 is the one recorded in `reference/SOURCE.md`; the Russian half came out garbled and was not used), and the labels were looked at in the author's zip (their SHA-256 are the recorded ones).

**The code of the page** (`public/index.html`, `public/src/*.js` apart from the data, `style.css`) is the package's, GPL-3.0-or-later (its own notice says so), and the corrections made
here are under the same licence, which is also that of `tools/`, `test/` and `scripts/`.

## How it was checked

**The oracle** runs the ROM of v1.09 on a small NES written for the purpose, next to the page's own scripts, with the same buttons, and compares after every frame the whole picture (except the lines in which
the ROM changes a register in the middle), about forty of the ROM's variables, and the calls that the two make to the sound player (`specs/port-map.md` says how it is run, what is compared and how the ROM's variables are found). The ROM and the source are in
`reference/`, and the source assembles into the same bytes as the ROM, so the source's labels say where each routine and variable is.

**What was run, against the ROM, and agreed in every frame:** the 7 scenarios of `tools/scenarios.mjs` (12,020 ticks: the title and its code entry, a first level played to the time out and back to the menu, moving and
turning, the pause menu, the bot on the first levels, the ending by its code, the clear of the last level and the ending); all **50 levels from their passcodes** (1,500 ticks each after the code, `LAN_MASTER_FULL=1`); and a bot that plays from the first level for
20,000 ticks (it clears 29 levels and is in the thirtieth when the run ends). Not one difference in the picture, in the variables or in the calls to the sound player. Besides: the ROM's routines called directly and compared with the page's functions on the same inputs (the random generator for all 256 seeds, the unpacking of
all 50 levels with 3 seeds, the random rotation of all 50, the trace on 50 levels with 7 arrangements each from every computer, more than 2,000 traces, and the order in which a level is drawn, 50 levels with 2 seeds); the data byte for byte (50 levels, 49 passcodes and the ending's, the
character sheet, the pictures, the palettes, the tables of the panels, the fades, the text of the ending); and the sound player against the ROM's output on the NTSC console update by update, in all four songs, twelve effects and the samples.

**What it found in the package's page** (`specs/port-map.md`, "What the oracle found"; `docs/development/CHANGES.md` has each change): a computer that reaches no cable counted as joined (the share rose to 50 at the start of every level); the percentage kept by
the wrong comparison; the cursor sprite drawn over the board as a black square; the panel of the time out with a tile too many; the cursor that jumped a tile where the original glides; the order of the things within a frame, a frame off in many places; the menu's blinking cursors, the logo's phase, the typed code
that stays and the frames the ROM spends on its toggles; the waits before and after the fades, the reveal, the clear and the time out; the end of the ending; and the sound player's output at the start and the stop of a song. The package agreed with the ROM in the data, the rules
of tracing and turning, the random numbers and the choice of notes at the first comparison.

**Faults of the oracle itself,** found and fixed on the way: the console had to be PAL; the page's clock starts one frame after the ROM's display turns on; the lines where the ROM changes a register in the middle of a picture are left out; the ROM's pauses of the music around a table are not the page's.

**Level of confidence** (the collection's levels are in the root `AGENTS.md`). Level 1, an executable oracle, for the rules, the pictures, the timing and the sound player. Level 3, reading and trying it in a browser, for what the page adds around the game. No claim is made beyond that: the page is not "certified",
and the package's claims of that kind (its reports M13 to M16) are its own. The comparison stops where `specs/port-map.md` says it does.

**The page** was driven in headless Chrome (a Chromium-based browser; no Firefox or Safari): a read-only hook was added to a temporary copy of the page and keys were pressed in real time (an arrow held for 0.7 seconds, a tap, a turn, START, the pause and its choices), with a held touch button in an emulated phone;
audio started; the layout was measured, in English and Italian, on the title, the help, the credits, the code entry, the game and the ending, at 320 by 568, 360 by 640, 390 by 844, 654 by 639, 1280 by 800 and 1280 by 960: no scroll and no control outside the window. No error reached the console. The five screenshots in `screenshots/` come from these runs.

## Open points

1. **The files are the Internet Archive's copies of the author's site.** The two zips were fetched by the `id_` form of a Wayback address, which returns the stored bytes, on 15 October 2026 (`reference/SOURCE.md`). The ROM and `notes.txt` are byte for byte the ones in the package's
   `reference/`, and the source assembles to the ROM. That the zips are byte for byte what the author published is not established.
2. **The big networks.** On the largest levels (about 43 to 50) the ROM's trace takes more than a frame when most of the network is joined (up to 40 thousand cycles; a frame is 33 thousand), and the percentage and the end of the level come a frame or two later in the original. The page traces at once. The
   last level was compared with the layout of level 39 for this reason, and levels 43 to 50 are compared from their passcodes, where the network is not yet nearly joined.
3. **The unpacking of a level** takes two to four frames in the ROM depending on where the music is. The page has a table of the six levels that take longer when the level starts from the menu; after a clear the same level can differ by a frame (level 31 did, once). Neither affects how a level plays.
4. **Timing.** The page ticks at 50 a second, the PAL console's rate, and the comparison is made on the PAL console. The NTSC console runs the game's logic at 48 a second and the music at 60 updates; how the pace feels on a console is not compared.
5. **What the page adds** (the language, the help, the credits, the touch buttons, a click on a tile, the pointer on the menu, the way back to the menu from the ending) is not compared with the original, which has nothing like it, and the touch buttons were driven in an emulated phone, not on a real one.
6. **The sound chip itself.** The player's output (the 11 bytes it would send to the sound chip) is compared with the ROM's; what the browser's oscillators make of them is heard, not measured.
