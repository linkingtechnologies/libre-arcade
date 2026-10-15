# Provenance

## What this is

*Zooming Secretary* is a game for the Nintendo Entertainment System made in 2011 by Shiru and Alexei "PinWizz" Bespalko, written in C
(about 2,600 lines of it by hand, the author says) for an NROM cartridge, with 21 sound effects, a few short tunes and a text message for
every answered call. You are a secretary: when a telephone rings it shows the symbol of a topic, you touch the filing cabinet with the same
symbol to memorise the topic, and then you reach the telephone, with ladders and floors, coffee, and a character on each stage that gets in
the way. Seven days, and a Dream between the fourth and the fifth. This folder is a port to the browser, in JavaScript, of the rules, with a
new page, new pictures and new sounds around them. The version followed is **v1.02, 30.12.11**.

It started from a restoration package, `zooming-secretary-1.0.0-rc9-m32-source.zip` (SHA-256 `1dcc94baede31bb4e14c66e7fcff99f03c1b068a2996d9e1266a3c3c1abd5ba6`), that
carried a JavaScript port written from a reading of the source and of the ROM, a page, 32 milestone reports and 24 test runners. The package's
tests compare the port with what its authors read and with recordings made by a tracer of their own that is not part of the package, so none of them
could be repeated. What was done here is a comparison with the original that can be repeated, and the corrections it made necessary.

## Where each thing comes from

| Thing | Source | Evidence |
|---|---|---|
| `public/src/`, `public/web/` (the rules, the page, the new pictures and sounds), `public/index.html` | the package's `src/`, `web/`, `index.html`, corrected | the oracle (`specs/port-map.md`); the list of changes with hashes is `docs/development/CHANGES.md` |
| `public/data/` (the layouts of the eight stages) | the package's `data/`, unchanged | the oracle: the state at the start of every stage and every iteration after it, in 56 scenarios and 5 campaigns, compared with the ROM; the licence is the original's (below) |
| `docs/development/package/` | the package's documents, tests, fixtures, tool and reference, unmodified | `test/package.test.mjs` runs its tests against `public/` |
| `reference/` | a record, no bytes | `reference/SOURCE.md`, `reference/ORIGINAL_SHA256.txt` |
| `tools/mos6502.mjs`, `tools/nes-machine.mjs` | copied from Lawn Mower's oracle (which started from Concentration Room's) | they ran the ROM from reset to the end of the campaign, and the ROM's own variables behave as its source says |
| `tools/ram-map.mjs`, `rom-run.mjs`, `js-run.mjs`, `oracle-state.mjs`, `oracle-scenarios.mjs`, `oracle-chain.mjs`, `bots.mjs`, `rom-oracle.mjs` | new | `npm run test:live` |
| `test/fixtures/rom-oracle.json` | the ROM's state after every iteration of 56 scenarios and 5 campaigns, as checksums | recorded by `node tools/rom-oracle.mjs record --rounds 3` from a run in which the port and the ROM agreed everywhere |
| the original itself (ROM, source files, manual, label) | the OpenEmu project's `OpenEmu-Update` repository, `Homebrew/NES/Zooming Secretary/`, and the Internet Archive's item `zooming_secretary` (a release ZIP and a source ZIP), both third parties' copies, downloaded on 15 October 2026 with the integrator's permission and **not kept** | the two copies agree byte for byte on the ten files they share, the ROM's SHA-256 is the one the package certified, and the release ZIP's is the one the package recorded for its own copy (`reference/SOURCE.md`) |

## The licences

Two, and neither is the original's alone.

**The code** (`public/src`, `public/web`, `tools`, `test`) is GPL-3.0-or-later: the package's own code, under the licence the package gave it, and
the code written here. The original is not copyleft, so "or later" is the licence of new code and says nothing about the original.

**The layouts** (`public/data/`, eight files) hold the functional geometry of the stages (which cells are floor or ladder, where the phones, cabinets,
coffee, tables and characters are, the counts and times of the stages), written as JavaScript from what the original's program does, with no tile art and none
of its byte arrays. They are shared under the original's **Creative Commons Attribution** grant, whose version is not stated, attributed to Shiru and
PinWizz (`public/data/LICENSE.txt`, `public/data/README.md`, `THIRD_PARTY_NOTICES.md`). They are not relicensed as GPL, and the version is
not guessed. The evidence for the grant, and what is missing from it, is in `reference/SOURCE.md`: the author's own notes say that the game was released under
a Creative Commons licence that asks for credit; the release's manual ends its cover with "CC BY 2011 Alexei Bespalko and Shiru" and says, in English and in Russian,
that the game is free of charge and "released under Creative Commons Attribution license"; the cartridge label says "CC BY 2011 by PinWizz and Shiru". None of them
gives a version, an address or the legal code. These are the release ZIP of the Internet Archive's copy, which is the file the package recorded the hash of for its own.

The original's ROM, pictures, music, sound effects, manual, label and source files are not in this repository and are not redistributed.

## How it was checked

**The oracle** runs the ROM of v1.02 on a small NES written for the purpose, next to the port, with the same buttons, and compares about ninety values of
the game's state after every iteration of its main loop, and the front end's (the title screen, the sound test, the choice of the level) after every pass of its loops (`specs/port-map.md` says how it is run, how the ROM's variables are found, what the players are, and what is
compared). The ROM is not in the repository: it is read from `ZS_ROM`, and its SHA-256 is checked.

**What was run, against the ROM, and agreed in every iteration:** 56 scenarios (the eight stages, three kinds of player, three rounds of seeds and allowances) of 137,506
iterations; 48 more of the same with the bots pressing START now and then (the program's pause); 47 front ends of 14,082 passes, from reset to the first iteration of the stage that
was chosen (6,240 iterations of those stages); and 5 campaigns (two from the title screen to the ending, two from the Dream, one from Day 7) of 27 stages and 109,527 iterations:
484,895 iterations of the game, 9,698 seconds. The same buttons in the same order reproduce, in the port, the ROM's state after every one of them (`npm test`, from the recording). 19 breaks of the port (a heart that
takes two numbers when none is free, a call delay that does not shrink, a ladder sampled a pixel to the left, another feedback byte of the generator, a knock held 47 iterations, wisdom of 499,
a coffee of 19, the Dream's phone that waits one iteration less, the Chief slowing a player left of x = 32; a pause that is one iteration short, a lockout of 23, frames counted while paused, a START held through the pause that ends it; a code that does not start again, a sound test read at the end of the wait, a choice of the level that stops at 7, LEFT and RIGHT together, a wait one pass short, random numbers taken by the pass of START) are each seen by the replay.

**What it found in the package's port** (`specs/port-map.md`, "What the oracle found"): the ladders (the climbing step that loses an iteration per segment, the ladder
flag that stays set, the direction that is kept), the contact of ManBox and Dibrov at the left edge, the hearts that take numbers from the generator only when a slot is
free, the Chief that is never near left of x = 32, and the page's seeds (every stage but the first started from 1; the original never reseeds). The package agreed with
the ROM in everything else that was compared, including 16 whole stages (eight stages, two seeds each) played with no button pressed. The package had none of the program's pause, hidden code, sound test or choice of the level (its page had a pause of its own): they were written from the source and agreed with the ROM at the first comparison.

**Faults of the oracle itself**, found and fixed on the way: the extra step after the last iteration of a stage, and the unused variables that a stage inherits from the
character before it (`specs/port-map.md`); and, in the front end's comparison, the generator's byte at the end of the screens, which the ROM has already used for the set-up of the stage it has begun.

**Level of confidence** (the collection's levels are in the root `AGENTS.md`). Level 1, an executable oracle, for the rules of the game and the campaign. Level 3, reading and
trying it in a browser, for the page. No claim is made beyond that: the port is not "certified", and the package's claims that its core was "frozen" and "certified" (its reports
M11 and M12) are its own.

**The page** was driven in headless Chrome (a Chromium-based browser; no Firefox or Safari): a bot read the game's state through a read-only hook that was added to a
temporary copy of the page, and pressed keys for the whole campaign in real time (805 seconds: Days 1 to 4, the Dream lost, Day 5 lost once and then won, Days 6 and 7, the
ending), reading the page's own cards between stages; the credits, the pause, the language and the sound buttons, and the preferences kept in the browser were tried; keys were pressed
for the hidden code, the choice of the level (including the limits and the final screen), the program's pause (with Enter, P, Escape and the Pause button) and the sound test, and for the case in
which the four buttons of the sound test are not all down, and the same was done with the touch buttons in an emulated phone (390 by 844, with three touches held and a fourth on the title screen for the sound test); the layout was
measured, in English and Italian, on the title, the intro, in play and in the credits, at 320 by 568, 360 by 640, 390 by 844, 568 by 320, 812 by 375, 1024 by 600, 1280 by 800, 700 by
700, 900 by 700 and 1100 by 800, and at four short landscape sizes with touch emulation: no scroll and no control outside the window. Each of the eight days' cards, in both languages, was also checked for scrolling inside itself at 320 by 568, 360 by 640, 390 by 844,
412 by 915, 568 by 320 (with and without touch), 480 by 300 (without touch), 568 by 300, 640 by 360, 700 by 400, 812 by 375, 1024 by 600, 1280 by 800 and 700 by 700, and none does; at 480 by 300 *with* touch emulation (smaller than any phone) a few cards
scroll inside themselves by 8 to 20 pixels and their button stays in view. No error reached the console.

## Open points

1. **The files are third parties' copies.** The author's page (`shiru.untergrund.net`) did not answer on 15 October 2026. The ROM and the source were read from the OpenEmu repository (a commit of
   14 December 2014) and then from the Internet Archive's item (uploaded on 5 April 2017 by another person), whose release ZIP and source ZIP were read as well. The copies agree byte for byte
   on the ten files they share, the ROM's hash is the one the package certified, the release ZIP's is the one the package recorded, and the source files agree with the ROM in the ways that
   could be tried. That they are byte for byte what the authors published is not established. The second label of the release (`label_fami.png`) and the source archive's other 28 files
   (the maps, the music modules, the tracker projects) were not opened.
2. **The version of the Creative Commons grant is not stated anywhere that was read.** The manual and the label give "CC BY 2011" and the manual says "Creative Commons Attribution license",
   with no version number, address or legal code. It matters to whoever wants to take the layouts further, not to playing the game. It would be settled by the authors
   (`docs/development/package/docs/M13_RIGHTS_CLARIFICATION.md` lists the questions the package would ask them).
3. **Pictures, sounds and music** are new. Nothing of the original's is used, but the page's layout of the screen (the status line, the bottom message, the floors, ladders and cabinets
   at the places the original has them) follows the original's, since the layouts do.
4. **The page and the pictures are not compared with the original** (level 3), nor what the sound test plays: it lists the page's own 16 sounds, not the original's 21 effects and 7 tunes, and the page has no music. The program's screens other than the three that
   were compared (the game over screen, the final screen) are cards that wait for a click, and the touch buttons (SELECT, B and A) were driven in an emulated phone, not on a real one.
5. **Answering a call by wisdom before any cabinet** is not covered (the source then indexes past an array; the port does not). The scenarios never answer in that state.
6. **The title screen's seed** was compared for two times on the title screen (16 and 55 iterations of its loop) and in one exploratory run (32); the rule is the same for all, and the generator is.
7. **Timing.** The port ticks at 50 a second, a fixed rate; a slow machine plays slower, not faster. How the original's pace feels on a console is not compared.
