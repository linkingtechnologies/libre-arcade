# The software archaeology behind Ri-li

This is the recovery story of this one game. The philosophy shared by every game in the collection (preserve the reasoning and not just the artifact, verify by execution rather than resemblance, record provenance instead of erasing it) is in [`../SOFTWARE_ARCHAEOLOGY.md`](../SOFTWARE_ARCHAEOLOGY.md).

## A toy train from 2006

Ri-li is a game by Dominique Roux-Serret, with music by Maf464. The `NEWS` file of the source release keeps its dates: the first version, 1.0.0, for Linux and Windows, on 23 June 2006, after the first autoconf files on 18 June; a version that compiles on Mac OS X on 27 June; a help for the player on 19 July; version 2.0.0 on 16 October 2006, with ten new levels (fifty now), the Dutch, Hungarian, Polish and Turkish translations and a limit of 60 frames a second "to relieve the CPU"; and version 2.0.1 on 1 November 2007, with the Korean translation, the control of the train with the left mouse button, a patch by E. Hikory that gives a player who completes the last level 100 points for each life left, and a change of licence to "GNU GPL Version 2 or Version 3". The README says it runs on Windows, Linux, Mac OS X and AmigaOS 4, in 19 languages.

The game is a wooden toy train that never stops. It follows the rails by itself and the player chooses the way at the junctions, collecting the wagons that lie on the track, each one making the train longer, until there are none left. A wagon, a shrinking or a stretching sign, a speed-up and an extra life are objects on the rails; touching one's own train is a crash. After each level a question on human rights (which article is this?) gives 50 points. The train does not move by squares: its head advances by a distance, a straight rail is 40 pixels and a curve 31.416, and each wagon is placed where the head was some distance ago. The program is plain C++ of 2006, with SDL 1.2, a frame of 1000/60 milliseconds, and its own tables of sprites and levels in binary files.

## What the restoration package had

A restoration package, `rili-m18.zip`, came with the request. It held a JavaScript page, 2,506 sprite frames decoded from the original's `sprites.dat`, the 50 levels, the original's English and Italian label pictures, the nine sound effects (byte for byte the original's) and three tunes converted from the tracker files, 12 test scripts, reports, and the source archive. Its notes called the result "certified": 1,042 of 1,042 wagons collected by a list of keys for every level, and 16,265 comparisons without a mismatch against a trace of the original's logic.

The data was right, and so was most of the game's geometry. But the tests had a narrow reach. The 16,265 comparisons are one level (the first), one seed, ten seconds, read from two recorded traces of a C++ run, whose program is not in the package. The "certified" playthrough is a list of keys that the page follows, and says nothing about whether the original follows it. And the menus were not drawn as the original draws them: the table of scores, the options and the language button were the package's own drawings.

## The original, and what it took to run it

The source release is the file the package kept (`reference/Ri-li-2.0.1.tar.bz2`, 13.7 MB, from SourceForge's folder of version 2.0.1); `reference/SOURCE.md` says what is known about it and what is not (SourceForge shows no checksum, and the Debian archive's own `orig` tarball has another compression). The headers say "either version 2 or version 3" of the GPL, with no "or later", and the music has its own notice, version 3.

It was not made to be compiled by today's compilers. Three tests of a pointer against zero (`ptr <= NULL`, which C++ no longer accepts) had to be written `== NULL` (the build checks that those are the only lines it changes), the pre-standard `<iostream.h>` needed a stand-in, and the sound library's calls needed declarations. With g++ in C++98 mode, and a copy of SDL 1.2.15 built from the official source archive (SHA-256 checked) on its dummy video driver, the original builds and runs on a machine with no screen.

## The oracle

The harness runs the original as it is and takes its own place in the program only where it must: the clock, the keys, the random numbers' log, the sound and the video mode.

- **A virtual clock.** The original sleeps until 1000/60 milliseconds have passed in every frame (16 ms); the harness lets that sleep move a counter instead. A run of a thousand frames takes a second.
- **Real SDL, double buffered.** The sprites are blitted by SDL's own code, so the original's pictures are SDL's. The original asks for two buffers and keeps two erase lists, one for each, which it empties two frames after they were drawn. The harness gives it two buffers. This turned out to matter in an unexpected place: when the menu of the game opens, the original copies whatever the screen holds into its own background, and the screen is the back buffer, which holds the picture of two frames before. After a visit to Options, that is the options screen, and so the options screen is what is seen around the panel of the menu.
- **The frame.** After each frame the harness prints the state of the train and the board, the random numbers that the frame drew from the C library's `rand`, the sounds, the list of what was drawn and, when it is asked, the picture.
- **The page, unchanged.** The page's own scripts run in Node on the same clock, with a stand-in for the DOM, and a small software canvas that draws what the renderer needs. The page's own loop, its own key handlers and its own menus are what run.
- **The menus by the clock.** Each screen of the original's menus has its own set-up flip, so the loops do not count frames alike. The scenarios for the menus give the keys and the pictures by the clock instead.

## What it found

- **A held key acts every frame, and nothing is reset.** The original reads the key that is down in each frame and keeps the order of the four directions at a junction (`Touche[]`) and the random numbers from one level to the next and from one game to the next. The package pressed a key once, began each level with a new order and each game from the first random number. The package's own routes through the 50 levels (14 of them) stop holding when the page does what the original does.
- **One frame late.** The end of the pause after a death or a clear and the end of the quiz's result are tested after the frame has been shown. The quiz, the table of scores and the next level began a frame too early in the page.
- **Single precision.** The original computes the position of a point on the rail, the angle of a wagon and the cable between two wagons in `float`, and g++ calls the single precision `sin`, `cos`, `atan` and `sqrt` for them. The page used doubles and put a wagon a pixel off now and then; it now rounds each step as the original does, and the sprites agree to the pixel.
- **The menus.** The table of scores had a dark band and words of its own; the options screen and the way of changing the language were the package's own drawings and buttons; and Escape in a game left to the menu where the original opens a menu of three buttons (Continue, Options, Exit game). They are the original's now, and compared with its pictures after every key.
- **Seventeen languages already there.** The package used two of the 19 language files of the original, and the other 17 were in the archive it kept. They are decoded from it (`tools/extract-languages.mjs`), compared with it pixel for pixel, and the screens that show them are compared with the original running in each language.
- **Nothing in the rules.** The levels, the geometry of the train, the objects, the collisions, the quiz and the table of scores were already the original's.

## Checked against the original

`specs/port-map.md` has the numbers: the scenarios of the game (the idle train on seven levels and three difficulties, random keys, clicks, the route of every level to its last wagon, the quiz answered four ways), the pictures of the menus and of the game, the in-game menu and what it leaves behind, the table of scores with a name typed, and the check of the language menu's layout, all agreeing with the original frame by frame.

## What stays open

- **Where the source archive comes from.** It is the package's copy; the size agrees with SourceForge's listing, and no checksum was found to compare it with (`reference/SOURCE.md`).
- **The music.** The three tunes are OGG files made by the package from the original's tracker files, how is not recorded, and they were not compared with a rendering of the originals. The nine sound effects are the original's bytes.
- **The page's own words.** The pictures are in all 19 languages, the original's own; the buttons, the guide, the credits and the status line are in Italian and English only, and in English with the other 17. The original has a hidden level editor (`tide` typed in the main menu) that is not ported.
- **What the page adds** (the touch pad, the buttons of the bar, the guide, the credits, the reset of the saved data, the browser's full screen, the quit screen) is not compared with the original, which has nothing like it. The place of a click on a button is the page's own approximation of the original's boxes.
- **The pointer and the pace.** The original draws its own mouse pointer in its picture and takes a longer step in a longer frame; the page shows the system's pointer and steps by 16 ms.
