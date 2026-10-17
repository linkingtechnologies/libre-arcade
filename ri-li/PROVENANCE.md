# Provenance

## What this is

*Ri-li* is an arcade game made by Dominique Roux-Serret (design, programming, graphics) with music by Maf464 (Charcosset B.), in C++ with SDL 1.2: a wooden toy train that follows its rails by itself, 50 levels,
three lives, three difficulties, and a question on human rights after each level. The first release is dated 23 June 2006 in the source release's `NEWS`; the version followed here is **2.0.1, of 1 November 2007** (the
source archive on SourceForge is dated 7 November 2007). This folder is a restoration for the browser, in JavaScript, with the original's pictures, levels and sound effects.

It started from a restoration package, `rili-m18.zip` (SHA-256 `b7b771b46c098a161d50842f075964b46433854a38f245da3c5c37e0d79ad127`, its folder named `Ri-li-2.0.1-M18-final-audit`), which carried a
JavaScript page, the original's sprites decoded into 2,506 PNG frames, 12 test scripts and reports, and which called the result certified: a list of keys for each of the 50 levels that the page follows to the last wagon, and 16,265
comparisons of the page's core with two recorded traces of a C++ run. The traces cover the first level for ten seconds with one seed, and the program that made them is not in the package. What was done here is a comparison with the original program itself,
compiled and run, that can be repeated, and the corrections it made necessary.

## Where each thing comes from

| Thing | Source | Evidence |
|---|---|---|
| `public/index.html`, `public/styles.css` | the package's; `styles.css` unchanged, `index.html` with an empty icon link and the visit counter added | `docs/development/CHANGES.md` (hashes) |
| `public/src/core.mjs`, `session.mjs`, `renderer.mjs`, `app.mjs`, `audio.mjs` | the package's, corrected | the oracle (`specs/port-map.md`); every change is in `docs/development/CHANGES.md` |
| `public/src/index.mjs`, `levels.mjs`, `preferences.mjs`, `rng.mjs` | the package's, unchanged | the page runs on them in every comparison |
| `public/assets/` (2,506 PNG), `public/data/sprites.json`, `public/ui/en`, `public/ui/it`, `public/ui/lang/en.png`, `public/ui/lang/it.png` | the package's, unchanged: the frames of `sprites.dat`, the label pictures of `language.En`, `language.It` and `language.dat` | `tools/check-assets.mjs`, pixel for pixel against the original's data files (`test/assets.test.mjs`, with `RILI_DATA`) |
| `public/ui/<code>/` (17 languages, 79 PNG each) and `public/ui/lang/<code>.png` (17) | new: the pictures of the other 17 language files of the original, decoded without loss by `tools/extract-languages.mjs` | `tools/check-assets.mjs`, pixel for pixel against `language.XX` and `language.dat`; the main menu, the table of scores, the options, the difficulty menu, the start of a game and the menu of the game compared with the original in each language, the quiz in three |
| `public/src/languages.mjs` | new: the 19 codes in the order of `language.dat` | `tools/check-assets.mjs` |
| `public/data/levels.dat` | the original's, moved here from the package's `reference/` | SHA-256 `d88a4a1c3f8bb7eab580cb4a0225602b2f96b71fd34404ad230d37f0c6ee774f`, the original's (`test/reference.test.mjs`) |
| `public/audio/*.wav` (9) | the original's `Sounds/*.wav`, byte for byte | `test/reference.test.mjs`, against the copies the package kept, which were also compared by hand with the unpacked archive (17 October 2026: the nine WAVs and the three tracker files are the archive's) |
| `public/audio/*.ogg` (3) | the package's conversions of the original's tracker files (`menu.mod`, `jeu1.xm`, `jeu2.xm`) | how they were made is not recorded; not compared with a rendering of the originals |
| `docs/development/package/` | the package's documents, tests, reports and reference, unmodified | its `SHA256SUMS.txt`; `test/package.test.mjs` |
| `reference/Ri-li-2.0.1.tar.bz2` | the original's source release, as the package kept it | SHA-256 in `reference/SOURCE.md`; the size agrees with SourceForge's listing; no checksum to compare with was found (open point 1) |
| `tools/oracle/` (`harness.cc`, `audio_stub.cc`, `build.sh`, `build-sdl.sh`, `stubs/`) | new | the oracle runs the original with them (`specs/port-map.md`) |
| `tools/oracle.mjs`, `js-run.mjs`, `scenarios.mjs`, `canvas-shim.mjs`, `canonical.mjs`, `png.mjs`, `check-assets.mjs`, `language-layout.mjs` | new | `npm test`, `npm run test:live` |
| `test/fixtures/original-trace.json` | a recording of the original by `node tools/oracle.mjs record` | replayed by `test/oracle.test.mjs` |
| `screenshots/` | headless Chrome, on a temporary copy of the page with a hook that fast-forwards a game and shows the quiz | looked at |

## The licences

**The original** is licensed by its author under the **GNU GPL version 2 or version 3**. The header of every C++ file of the source release says: "This program is free software; you can redistribute it and/or modify it under the terms of
the GNU General Public License as published by the Free Software Foundation; either version 2 or version 3 of the License", and the `NEWS` of 2.0.1 says "License upgrade to 'GNU GPL Version 2 or Version 3'". It does not say "or any later version",
so no later version is assumed (the collection's rule: never assume "or later"). The source archive's `COPYING` is the text of version 3, the music's `COPYING.Music` carries version 3 too, and this restoration uses the original under version 3.
Evidence of the kind "the source headers read in the archive itself", not a secondary source.

**The music** is the musician's: `COPYING.Music` says "Copyright (c) 2006 - Maf464 - Charcosset B." and gives the GPL version 3. The three OGG files of `public/audio/` are conversions of the three tracker files and are under the same licence.

**The sound effects** have no author named in the source release (its `README`, `AUTHORS` and `COPYING.Music` do not mention them). They are in `public/audio/` byte for byte, and the source archive puts the program they came in under the GPL. No author is invented here.

**The code of the page** (`public/index.html`, `public/src`, `public/styles.css`) is the package's, **GPL-3.0-only** (its own notice says so), and the corrections made here are under the same licence, which is also that of `tools/`, `test/` and `scripts/`.

## How it was checked

**The oracle** compiles the original's own C++ (the archive's eight `.cc` files, unchanged but for three pointer tests that C++ no longer accepts) with g++ and links it against SDL 1.2.15 built from the official archive, on its "dummy" video driver. It runs
on a virtual clock (a frame is 16 ms, the length the original's loop sleeps) with scripted keys, and prints after every frame the state of the train and the board, the random numbers the frame drew, the sounds, the list of what was drawn and, when asked, the picture.
The page's own code (its loop, its key handlers, its menus) runs in Node on the same clock and the same keys, and the two are compared (`specs/port-map.md` says how, and what each scenario is).

**What was run, against the original, and agreed in every frame:** 

- the 49 scenarios of `node tools/oracle.mjs check` (89,643 frames): the idle train on seven levels (1, 2, 7, 13, 26, 39 and 50) at three difficulties; random keys on six levels (1, 3, 9, 20, 33 and 45) with two seeds each; the mouse button on three levels (4, 15 and 28); the route of nine levels (1, 2, 5, 10, 17, 25, 33, 41 and 50) from the first cell to the last wagon; and the quiz after level 1 answered four ways (left, right, up and down, Escape) with the next level after it;
- the route of each of the 50 levels (122,275 frames), played before the last changes to the menus (which do not touch the rules of the game) and, for the nine levels above, again after them;
- 35 scenarios of the menus (150 pictures, pixel by pixel): the main menu and its choices, the table of scores, the options with the volumes, the difficulty and level menus, and inside a game Escape and the menu of the game, Options and back (with the options screen behind the panel), Continue, and Exit game with a name typed and the table of scores that follows; the language menu with its 19 labels at three moments, and Deutsch chosen (the options screen and then the main menu in German); and, for each of the 18 languages other than English, a tour of the main menu, the table of scores, the options, the difficulty menu, the start of a game and the menu of the game;
- the pictures of the game, 800 by 600 pixels, at 11 frames (0, 1, 2, 5, 40, 120, 300, 600, 900, 1200 and 1499) of three scenarios (the idle train on level 1, the route of level 1, random keys on level 33): 33 pictures, all within the tolerance of 3 of 255 in every channel, but for three pixels of the lives' icons in one frame of a death pause, where the original leaves a trace of the life just lost and the page draws it clean (a difference that is kept);
- the screen of the quiz (the question, the text of the article and the two answers) in Arabic, Japanese and German, at two moments each (`node tools/oracle.mjs quiz-pictures`), and the label pictures of all 19 languages against the original's data files (`tools/check-assets.mjs`).

No difference in the state of the train and the board, the random numbers, the sounds, the list of what was drawn or the pictures.

**What it found in the package's page** (`specs/port-map.md`, "What the oracle found"; `docs/development/CHANGES.md` has each change): the keys, which the original reads in every frame and the page read once; the order of the four directions and the random numbers, which the original carries from one level to the next
and from one game to the next and the page began again; an arrow on the board before the first step; the end of a pause and of the quiz's result, a frame too early; single precision where the original's arithmetic is in `float`, which put a wagon or a point of the cable a pixel off; the table of scores,
the options screen, the language menu and the menu of the game, which were the package's own drawings and were the original's in nothing but the sprites; Escape, which left the game where the original opens a menu, goes on without an answer in the quiz, and leaves in the main menu; and, found in a browser and not by the oracle, the first key of a visit,
which waited for the music to start. The package agreed with the original in the data, the geometry of the train and the wagons, the rules for objects and collisions, the quiz and the insertion of a score.

**Faults of the oracle itself,** found and fixed on the way: the original does not compile with today's g++ (three tests of a pointer against 0); SDL's own timer thread must keep the real clock while the original's calls to the clock are renamed; the frame has to be marked by a wrapper around `Ecran::AfficheOptions`, because
`Jeux::AfficheEcran` is called inside its own file; the menus' loops do not count frames alike, so their scenarios are by the clock; the double buffer had to be reproduced (the menu of the game copies the back buffer); and a scenario had to say how many levels are unlocked (the original counts from 0).

**What the package claimed, and what was found.** The "certified" playthrough of all 50 levels is a list of keys that the page follows; 14 of the 50 lists stop holding when the page's arithmetic and the order of the keys are the original's (`test/package.test.mjs`). The 16,265 comparisons are one level for ten seconds with one seed. Neither claim is wrong about what it measured,
and neither measured the original running. Its notes are kept, unmodified, as history.

**Level of confidence** (the collection's levels are in the root `AGENTS.md`). Level 1, an executable oracle, for the rules, the timing, the sounds' calls, the lists of what is drawn and the pictures of the game and the menus. Level 3, reading and trying it in a browser, for the music, for the sounds in the menus, for the places that answer a click, for the 17 languages that the page does not have
and for what the page adds around the game. No claim is made beyond that: the page is not "certified". The comparison stops where `specs/port-map.md` says it does.

**The page** was driven in headless Chrome (a Chromium-based browser; no Firefox or Safari) with real key and mouse events: the menus, the options screen with its volumes, the language menu, a game started and played, Escape and the menu of the game with its three choices, Options inside it and back, the click on Exit game and the table of scores. No error reached the console. The five screenshots in
`screenshots/` (1280 by 800 and a 390 by 844 phone at 2x) come from these runs; a game was fast-forwarded in the page for the first and the last, and the quiz was shown by a call, so that the screenshots could be taken without playing a level.

## Open points

1. **The source archive's own provenance.** It is the package's copy of `Ri-li-2.0.1.tar.bz2`. SourceForge's page of the folder lists a file of that name, 13.7 MB, dated 7 November 2007, which agrees with its size (13,745,398 bytes); SourceForge shows no checksum, and the author's website was not consulted. The Debian archive has the same release as `ri-li_2.0.1.orig.tar.gz`; unpacking it and comparing its files with this archive's would settle it, and was not done (it needs a download).
2. **The music** is a conversion of the tracker files, made by the package in a way that is not recorded, and is not compared with a rendering of the originals. If someone has the original program playing the tunes, a comparison by ear or by spectrum would close it.
3. **The page's own texts in the 17 languages that the package did not have.** The pictures (menus, dashboard, quiz) are the original's in all 19 languages, but the bar, the guide, the credits and the status line were written in Italian and English only, and are in English with the others. The original's hidden level editor (the word `tide` typed in the main menu) is not ported.
4. **A frame longer than 16 ms.** The original's step follows the length of the frame; the page steps by 16 ms. A slow machine is not compared.
5. **The pointer and the clicks.** The original draws its own pointer in the picture, which is left out of the comparison; the places that answer a click on a button are the page's own boxes, not the original's `Menu_Py`, and a click was tried in a browser, not compared.
6. **Escape during the pause after a death or a clear.** The original's clock goes on behind the menu of the game; the page's pause waits. This edge was not compared.
7. **What the page adds** (the touch pad, the bar's buttons, the guide, the credits, the reset of the saved data, the browser's full screen, the quit screen) is not compared with the original, which has nothing like it, and the touch pad was tried in an emulated phone, not on a real one.
8. **A single-buffered SDL driver.** The original draws on the back of two buffers; a driver that ignores `SDL_DOUBLEBUF` would show the sprites of the previous frame as well, and the menu of the game would copy another background. The page reproduces the double-buffered behaviour that the code was written for.
