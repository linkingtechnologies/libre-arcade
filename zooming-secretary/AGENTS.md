# AGENTS.md

- **Two licences, and neither is to be changed.** The code (`public/src`, `public/web`, `tools`, `test`) is **GPL-3.0-or-later**. `public/data/`
  holds the layouts of the stages, derived from the original, under the original's Creative Commons Attribution grant **with its version
  unspecified** (`public/data/LICENSE.txt`); it is not GPL and must never be given a version (3.0, 4.0) or called public domain. A new
  data file carries `SPDX-License-Identifier: LicenseRef-Zooming-Secretary-CC-BY-Unspecified`, a new code file the GPL one;
  `test/production.test.mjs` fails otherwise. The root `AGENTS.md` says never to assume "or later" for a copyleft *original*: here the
  original is not copyleft, and "or later" is only the licence of the new code.
- **No byte of the original is in this repository** (`reference/README.md`): no ROM, no source, no picture, no music, no manual, no
  label. `test/reference.test.mjs` fails if a `.nes`, `.chr`, `.ftm`, `.pdf`, `game.c`, `npc.h` or `neslib.*` turns up. The oracle needs
  the ROM as a file (`ZS_ROM`) and checks its SHA-256 (`tools/ram-map.mjs`, `ROM_SHA256`); `npm test` replays a recording and does not.
- **The ROM is the specification, and the oracle is how it is read.** `node tools/rom-oracle.mjs check` (or `npm run test:live`) runs
  the ROM on `tools/nes-machine.mjs` next to the port, gives both the same buttons, and compares about a hundred variables after every
  iteration of the program's main loop; it also plays whole campaigns, from the title screen to the ending. `list` names the scenarios,
  `check <name>` runs the named ones, `--rounds N` more of them, `--no-chains`, `--no-scenarios`, `--no-pauses` and `--no-front` leave a part out, `coverage` shows
  what they do on the port (no ROM). After any change to `public/src/` run `npm test` (the recording) and, if the behaviour of the game
  could have changed, `npm run test:live`. Do not "improve" a rule, a number or a quirk: if the oracle says the port is wrong, the port is
  wrong. If a change to the tools is made on purpose, `test/rom-oracle.test.mjs` says the recording is stale: run `npm run test:live`,
  read what it says, and `node tools/rom-oracle.mjs record --rounds 3` again (about an hour).
- Run the oracle **alone**: it is one Node process, but the machine this was done on had little free memory, and a browser or a second
  oracle next to it is a reason for it to be killed.
- **How the ROM's variables are found** (`tools/ram-map.mjs`): cc65 puts the source's `static` variables, in the order they are declared,
  from $0300 on; the table is that order anchored on `map` ($0347, 704 bytes). A new variable to compare is added at the place the source
  declares it. The compiler's own temporaries are not in the table.
- **Things that look like bugs and are the original's** (the oracle shows each; `specs/port-map.md` lists the rest): `player_dir` keeps its
  last value when no direction is pressed and `player_ladder` stays set on a ladder (the player cannot walk sideways on one), and a
  climbing segment that has just run out starts the next in the same iteration; the Chief never slows the player when he is left of
  x = 32 (cc65 compares `px-32` as an unsigned 16-bit number); ManBox and Dibrov take their position as an unsigned byte for the
  contact test, so at x from -8 to -1 they touch whoever is at the right edge; hearts take two numbers from the generator only when
  one of eight slots is free, and each lives 24 to 31 updates (twice as many iterations, as half the slots are updated each time); the
  factoid index is `($0600 | rand8) % count` (a stale X, found by the package); the random generator is never reseeded between stages, nor
  after a game over; a stage leaves its character's unused variables as they were (the Geek of Day 5 starts with the Ghost's `npc_wait`).
- **The pause, and what is read when.** The pause is START (`Simulation.tick`: `pause` is 50 in the pass that reads START, counts down to 25 in
  passes that count no frame and do nothing, waits at 25 for a new START, and after it ends is 24 down to 0, in which START does nothing). Two reads
  of the pad matter and the ROM shows both: the pass that reads START at the top of the loop's body reads the pad of its own iteration, and the
  waiting pass (`pause` at 25) reads, at the top of the loop, the pad as it was left at the end of the pass before (`lastMask`), so a START
  held through the pause does not end it. `pad_trigger` is "down now and not down at the previous read", and the previous read is the previous
  call, not the previous pass (`PadPoll`); a stage begins with `padPolled`, what the pad was at the last read before it (START, if the
  player came from a screen that START leaves).
- **The oracle reads the state at the top of the loop.** `tools/rom-run.mjs` copies the ROM's RAM each time the program is at the first
  instruction of the loop (found by its bytes, `findLoopTop`) and compares that, not what the program has a moment later, so an iteration is
  one pass of the loop whether or not it counted a frame. The front end (`front: true`) is read at each call of `ppu_waitnmi`. If you change a
  file that is hashed into the recording (`TOOL_FILES` in `tools/rom-oracle.mjs`, `oracle-front.mjs` among them), run `npm run test:live` and
  record again; the long run takes one to two hours.
- **The front end** (`public/src/frontend.js`): the title screen's random numbers (two for each pass but the one that START ends), the code
  (B, A, B, A, LEFT, UP, B, A, each a new press of that button alone, or the code starts again), the sound test (it opens if A, B, SELECT and
  START were all down at the read in which START was pressed: the program does not read the pad during the wait that follows), the choice of
  the level (LEFT and RIGHT between 0 and 8, START, A or B leave; both directions in one pass do one of each), and the passes each screen takes
  (72, 1, 150, 1). `test_mode` stays until the program is switched off, the allowance of missed calls is the program's for every stage (3, and
  2 more each time the Dream is won, whichever stage is chosen next), and the final screen (level 8) leads back to the title in the program
  and to Day 1 in the page. The page uses the same functions (`stepCode`, `stepLevelSelect`, `stepSoundTest`, `Frontend`) but its screens are
  cards, so the waits and the fade are not there. The code, the sound test and the choice of the level are reached from the keyboard and from the
  touch pad (SELECT, B and A buttons beside the arrows, in `index.html`; START is a tap on the title, the Pause button or a card's button), and
  the page's strings do not mention them (`test/production.test.mjs`); `README.md` does.
- **The sound test lists the page's own sounds** (`web/sounds.js`, 16 effects and no music), not the original's 21 effects and 7 tunes, which are
  not here; `test/production.test.mjs` checks that the list is what `web/audio.js` can make. The oracle compares the sound test's selection
  with the ROM's (`effects: 21, tunes: 7`), which is the rule, not the sounds.
- **Time.** The game runs 50 iterations of its loop a second on both kinds of television (on a 60 Hz console its library skips one frame
  in six: the oracle counts about one extra frame in five per iteration). `FixedStepClock({hz: 50})` in `web/app.js` is that rate;
  do not make it 60.
- **The package's own tests** (`docs/development/package/tests`, 24 runners) are run unmodified against `public/` by
  `test/package.test.mjs`, in a temporary copy of the package's layout. Thirteen cases are expected to fail and nothing else may (the list and
  the reasons are at the top of that file): the six that pin the bytes of the gameplay core, the two that pin the old wording of the
  credits, the one that tests the Chief's old behaviour, the two that look for the line `futureMissLimit=5`, and the two that look for the
  title screen's old way of advancing the random generator. Never edit the package's tests or documents; change the list if a later,
  deliberate change of behaviour needs it, and say why.
- Player-visible text has no development vocabulary (`test/production.test.mjs` looks at the page's strings). The credits are in
  plain language in English and Italian (`web/app.js`). The page's title is "Zooming Secretary — Libre Arcade Restoration" on purpose
  (`docs/development/package/docs/M25_TITLE_REVIEW.md`).
- The page was measured in English and Italian, on the title, the intro, in play and in the credits, at 320 by 568, 360 by 640, 390 by 844,
  568 by 320, 812 by 375, 1024 by 600, 1280 by 800, 700 by 700, 900 by 700 and 1100 by 800: no scroll, every control inside the window. Do
  the same after touching `public/index.html`, `public/web/style.css` or the layout code, and check that every card (the eight days, the Dream's
  and the pause's) fits its board without scrolling inside itself: the card's text is sized by the height of the board (container queries on
  `.canvas-wrap`, with the window's own media queries as the fallback), and its button stays in view (`position:sticky`). The picture is 256 by 240 and the browser scales it with
  nearest-neighbour; its text is a pixel font drawn from rectangles (`PIXEL_GLYPHS` in `web/renderer.js`), never canvas text, which that scaling
  would cut.
- The renderer and the audio engine are new work and are not compared with the original. Do not copy pixels, tiles, tunes or sound data from
  the original into them, and do not add a picture or a recording to `public/`.
- `docs/development/` holds the restoration package's own notes (milestone labels, old paths) and `CHANGES.md`, the list of what was
  changed in its JavaScript. Leave the notes as history; the facts of this integration are in `PROVENANCE.md`, `specs/port-map.md` and
  `CHANGELOG.md`.
