# Port map: Ri-li 2.0.1 (C++/SDL) to JavaScript

How the original's routines correspond to the page's functions, what was compared with the original and how, and what the comparison found. The original is the C++ source
release of Ri-li 2.0.1 (`reference/Ri-li-2.0.1.tar.bz2`: `loco.cc`, `jeux.cc`, `menu.cc`, `ecran.cc`, `sprite.cc`, `tableau.cc`, `utils.cc`, `main.cc` and their headers, and the data
files `sprites.dat`, `levels.dat`, `language.*`); the page is `public/` (`src/core.mjs` is the train and its rules, `src/session.mjs` the flow from level to level,
`src/renderer.mjs` the pictures, `src/app.mjs` the loop, the keys and the menus, `src/rng.mjs` the C library's random numbers, `src/levels.mjs` the reader of `levels.dat`,
`src/preferences.mjs` and `src/audio.mjs` what the browser adds).

## Verification level

Collection-wide levels (`AGENTS.md` at the root): 1 an executable oracle, 2 hand-computed values, 3 careful reading.

- **Level 1, for the game and its menus.** The original's own C++ is compiled and run, headless, on a virtual clock, with scripted keys, and the page's own code is run on the
  same clock with the same keys. After every frame of a game the two are compared in the state of the train and the board, the random numbers drawn, the sounds started, and
  the list of what was drawn (sprite, frame, position); in some frames, and in every picture of a menu, the 800 by 600 pictures are compared pixel by pixel (a channel off by up to
  3 of 255 is the rounding of a translucent sprite, which SDL and a browser do their own way). That covers the movement of the train, the wagons, the objects, the
  arrow, the keys, the pause, the death and the new life, the clear of a level, the quiz (all its answers and Escape), the next level, the table of scores with its name entry, the
  main menu, the level menu, the difficulty menu, the options screen, the menu of the game and what it leaves behind it. Section "What was run" has the numbers.
- **Level 3, for what is read and not compared.** The sound itself (the original's nine WAV effects are byte for byte the page's, and which one is played in which frame is compared, but the music, which the
  package converted from the tracker files to OGG by a way that is not recorded, was not compared with a rendering of them); the sounds of the menus (read in the source: every key of a menu makes the click);
  the place of a click or a tap (the original's boxes `Menu_Py`, which the page approximates); a frame that lasts more than 16 ms (the original
  adapts the train's step to it; the page's step is always 16 ms); fullscreen; everything the page adds around the game (the guide, the credits, the reset, the touch pad, the layout).
- **The pictures of the page are the original's own** and are checked against its data files pixel for pixel, apart from the oracle (`tools/check-assets.mjs`): the 2,506 sprite frames against `sprites.dat`, the 1,501
  label images of the 19 languages against their `language.XX` files, the 19 labels of the languages' names against `language.dat` (and the order of `public/src/languages.mjs` against its), and `levels.dat` against its SHA-256.

## How the oracle works

- **The original, built.** `tools/oracle/build.sh` compiles the original's own files unchanged with g++ (`-std=gnu++98 -fpermissive`), except for three tests `pointer <= 0` that C++ no longer
  accepts, which it writes `== 0` (it checks that exactly those three lines changed). `main()` is not run: `harness.cc` repeats its start-up with the same calls, except for the sound (`audio_stub.cc`
  records what the game asks to play), the video mode (the dummy driver reports 8 bits, the game wants 32) and the window title.
- **SDL is the real one.** SDL 1.2.15, built by `build-sdl.sh` from the official archive (checked by SHA-256), on its "dummy" video driver, which gives the original real software surfaces: the sprites are
  blitted by SDL's own code, so the original's pictures are SDL's. The video surface is double buffered, as the original's `SDL_DOUBLEBUF` asks and as its erase lists (`Ec[0]`, `Ec[1]`) need.
- **Time is virtual.** `SDL_GetTicks` returns a counter that moves only when the original sleeps (`Sleeping()` waits for 1000/60 ms: every frame lasts 16 ms), which makes the runs exact and fast. The original's
  own calls to the clock and to sleep are renamed at compile time; SDL's own are not.
- **The keys.** `SDL_PollEvent` hands out the scenario's events: for a game, in the frame they are for; for the menus, by the clock (the loops of the menus do not count frames alike, each screen has a
  set-up flip of its own), a key being read in the first frame that begins at or after its time. The page's clock starts at 1000 too.
- **What the original prints.** For each frame of a game: the distance of the head (the float's bits), the cell, the wagons, the score, the lives, the spacing, the speed, the timers, the order of the keys
  (`Touche[]`), the cell of the arrow, the pause, a hash of the board, the C library's `rand` count and the numbers it gave, the sounds, the original's own list of what was drawn (`Ec[NumVideo]`), and a hash of the picture;
  likewise for a frame of the quiz. For a menu: the picture. A wrapper around `Ecran::AfficheOptions` marks the frame; `rand` is wrapped to count and log.
- **The page, unchanged.** `tools/js-run.mjs` copies `public/src` to a temporary folder, appends one line to the copy of `app.mjs` (the state and the loop, as `globalThis.__rili`), and runs it in Node with a stand-in for the DOM,
  the images and a software canvas (`tools/canvas-shim.mjs`) that draws what the renderer uses. The page's own loop and its own key handlers are what run; the oracle gives them keys and a clock. `public/` is not changed.
- **Fixture.** `node tools/oracle.mjs record` plays the scenarios on the original and keeps, for each frame block of 25, a digest of what is compared, and for some pictures a thumbnail (the mean colour of 32 by 24 blocks of
  25 by 25 pixels); `npm test` replays them against the page, without WSL, a compiler or SDL (`test/fixtures/original-trace.json`, `tools/canonical.mjs`). `npm run test:live` plays the original again and says which frame and which value differ.

## The functions

| Original | Page | Notes |
|---|---|---|
| `Loco::Loco`, `Loco::Init` | `Oracle` (constructor), `#initLoco` (`core.mjs`) | the starting history of two cells; no arrow until the first `Avance` |
| `Loco::Avance`, `Loco::TestCase` | `Oracle.step`, `#testCase` | the game's time before the step; collisions with the picture of the frame before |
| `Loco::Go`, `Loco::TestDir` | `go`, `testDir` | the path as a list of cells and distances (`history`) |
| `Loco::DoFleche` | `doArrow` | the arrow follows the key order, and the player's direction while an arrow key is down |
| `Loco::FindPoint`, `Loco::Affiche` | `findPoint`, `trainGeometry`, `Renderer.renderTrain`, `Renderer.cable` | in single precision (`Math.fround`), as g++ compiles the original |
| `Loco::AddLoco` | `#addWagon` | the type of a new wagon takes a number from `rand` |
| `Jeux::Load`, `Jeux::DrawLevel` | `LevelSet` (`levels.mjs`), `GameSession.loadLevel`, `Renderer.renderBackground` | `levels.dat` is read as it is |
| `Jeux::PrendTouche`, `Jeux::BufTouche` | `applyHeldKey`, `gameKeyDown`, `Oracle.bufferKey` (`app.mjs`, `core.mjs`) | `Key`, `MasqueK`, `Touche[]` |
| `Jeux::TourneFleche`, `Jeux::TestFleche` | `rotateArrow` (a click), `Renderer.arrowFrame` | |
| `Jeux::SDLMain` | `GameSession.step`, `finishPause`, `tick` (`app.mjs`) | the pause, the death, the clear and the quiz are tested after the frame is shown |
| `Jeux::AfficheEcran`, `Ecran::*` | `Renderer.draw`, `renderObjects`, `renderHud`, `sprite` | the order in which things are drawn |
| `Menu::SDLMain` and `Affiche_Main(_Centre)` | the `menu` screen, `drawMainMenu`, `mainArrows`, `selectArrowsForUi` | |
| `Menu::SDLMain_Speed`, `Menu::SDLMain_Niveau` | `drawDifficulty`, `drawLevelMenu`, `confirmDifficulty`, `confirmLevel` | |
| `Menu::SDLMain_HR` | `GameSession.beginQuiz`, `answerQuiz`, `afterQuiz`, `skipQuiz`, `Renderer.drawQuiz` | the order of the numbers it takes from `rand` |
| `Menu::SDLMain_Score` | `GameSession.enterHighScore`, `insertScore`, `exitGame`, `Renderer.drawScores`, `drawNameEntry`, the `name_entry` keys | |
| `Menu::SDLMain_Options`, `InitMain_Options` | `optionsKey`, `changeVolume`, `Renderer.drawOptions` | |
| `Menu::SDLMain_Langue`, `LoadLangue` | `languageKey`, `chooseLanguage`, `Renderer.drawLanguage`, `Renderer.loadLanguage` | the 19 languages; the pictures of a language are loaded when it is chosen |
| `Menu::SDLMain_InGame`, `Affiche_InGame` | `ingameKey`, `openInGameMenu`, `Renderer.drawInGameMenu` | the screen as it was two frames before stays behind the panel |
| `rand`, `srand` | `GlibcRand` (`rng.mjs`) | the C library's generator; one for the whole visit |
| `Sprite::Load`, `sprites.dat`, `language.*` | `assets/`, `ui/`, `data/sprites.json` | decoded without loss (the sprites by the package, the 17 other languages by `tools/extract-languages.mjs`); checked by `tools/check-assets.mjs` |
| `Audio`, `Sons` | `audio.mjs` | the nine WAVs are the original's; the music is a conversion |
| `Pref` | `preferences.mjs` | `localStorage` instead of a file |

## What was run

- the 49 scenarios of `node tools/oracle.mjs check` (89,643 frames): the idle train on seven levels (1, 2, 7, 13, 26, 39 and 50) at three difficulties; random keys on six levels (1, 3, 9, 20, 33 and 45) with two seeds each; the mouse button on three levels (4, 15 and 28); the route of nine levels (1, 2, 5, 10, 17, 25, 33, 41 and 50) from the first cell to the last wagon; and the quiz after level 1 answered four ways (left, right, up and down, Escape) with the next level after it;
- the route of each of the 50 levels (122,275 frames), played before the last changes to the menus (which do not touch the rules of the game) and, for the nine levels above, again after them;
- 35 scenarios of the menus (150 pictures, pixel by pixel): the main menu and its choices, the table of scores, the options with the volumes, the difficulty and level menus, and inside a game Escape and the menu of the game, Options and back (with the options screen behind the panel), Continue, and Exit game with a name typed and the table of scores that follows; the language menu with its 19 labels at three moments, and Deutsch chosen (the options screen and then the main menu in German); and, for each of the 18 languages other than English, a tour of the main menu, the table of scores, the options, the difficulty menu, the start of a game and the menu of the game;
- the pictures of the game, 800 by 600 pixels, at 11 frames (0, 1, 2, 5, 40, 120, 300, 600, 900, 1200 and 1499) of three scenarios (the idle train on level 1, the route of level 1, random keys on level 33): 33 pictures, all within the tolerance of 3 of 255 in every channel, but for three pixels of the lives' icons in one frame of a death pause, where the original leaves a trace of the life just lost and the page draws it clean (a difference that is kept);
- the screen of the quiz (the question, the text of the article and the two answers) in Arabic, Japanese and German, at two moments each (`node tools/oracle.mjs quiz-pictures`), and the label pictures of all 19 languages against the original's data files (`tools/check-assets.mjs`).

No difference in the state of the train and the board, the random numbers, the sounds, the list of what was drawn or the pictures.

## What the oracle found in the package's page

The package agreed with the original in the data (the levels, the sprites, the pivots), in the geometry of the train and the wagons, in the rules for objects and collisions, in the quiz and in the insertion in the table
of scores. What differed was the order and the timing of things in a frame, how the keys are read, what the original keeps from one level to the next, a few roundings, and the menus.

- **A key is held, not pressed** (`app.mjs`). The original reads `Key` and `MasqueK` in every frame, and `PrendTouche` acts in each frame in which the train is not in a pause; with an arrow key down the arrow on the board shows the player's
  direction. The package acted on the key once. The first frame after "press any key" is the first move.
- **The order of the keys and the random numbers go on** (`core.mjs`, `session.mjs`). `Touche[]` and `rand` are never reset between levels or games in the original; the package began each level with a new order and each game from the seed. Wagon types and the choices that depend on them
  differ from the second level. The package's own list of keys for the 50 levels no longer holds in 14 of them (`test/package.test.mjs`).
- **No arrow before the first step** (`core.mjs`): `PInter` is -1 until the first `Avance`.
- **A frame later** (`session.mjs`): the end of the pause after a death or a clear (`Mort<Horloge`) and the end of the quiz's result (`Fini<Horloge`) are tested after the frame has been shown, and the second with the clock of the frame before. `DureeJeu` increases before the train advances.
- **Roundings** (`core.mjs`, `renderer.mjs`): `FindPoint`, `Loco::Affiche` and the cable (`AfficheCorde`) are in `float`, and g++ calls the single precision `sin`, `cos`, `atan` and `sqrt` for a `float`; the page used doubles and was a pixel off in places.
- **The table of scores, the options screen, the language menu and the menu of the game** were the package's own drawings (a dark band and the words YOUR SCORE or GAME OVER, volume steppers, a button that switched the language). They are the original's now, drawn by the
  original's own numbers (rows 51 pixels apart, the number's right edge at 740, the wagons 39 pixels apart, the arrows 25 pixels outside a button, 5 outside a language, ...), and agree with its pictures.
- **Escape.** In a game it opens the menu of the game (Continue, Options, Exit game), in the quiz it goes on without an answer, in the main menu it ends the program; the package left the game.
- **Faults of the oracle itself,** found and fixed on the way: the original does not compile today (three pointer tests, above); SDL's timer thread had to keep the real clock; the frame marker had to be a wrapper around `Ecran::AfficheOptions` (`Jeux::AfficheEcran` is called inside its own file); the menus'
  frames had to be compared by the clock; the double buffer had to be reproduced (the menu of the game copies the screen as it was two frames earlier, and after Options that is the options screen, not the game); a scenario had to start the menus with the levels unlocked that its
  `niveauMax` says (the original counts from 0).

## Known differences that are kept, on purpose

- **The pointer.** The original draws its own mouse pointer (a sprite) in its pictures; a browser shows the system's. That box is left out of the comparison.
- **The lives during a death pause.** The original does not completely erase the icon of the life that has just been lost while the pause lasts (three pixels of it stay in the picture, the largest difference being 18 of 255); the page draws it clean.
- **The arrow on the board (`Help`)** is saved between visits by the page; the original resets it for each game.
- **The page's own texts** (the bar, the guide, the credits, the status line) are in Italian and English; with the other 17 languages they are in English. The pictures (menus, dashboard, quiz) are in the language chosen. The button of the bar that opens the language menu from any screen, and the default language of a first visit (Italian), are the page's.
- **The level editor.** Typing `tide` in the main menu opens the original's level editor (`editeur.cc`); it is not ported.
- **A single-buffered SDL driver** would show the previous frame's sprites too and the menu of the game would have another background; the page reproduces the double-buffered behaviour that the code was written for.
- **Frame length.** The page steps the game by 16 ms. A slower machine makes the original's frame longer and its step longer with it; that is not compared.
- **The music.** The three tunes are OGG files made by the package from the original's tracker files; how is not recorded, and they were not compared with a rendering of the originals.
- **The page's additions:** the touch pad, the buttons of the bar (pause, arrow, language, menu, guide, credits), the reset of the saved data, the fullscreen of the browser, the status line, and the quit screen (the original ends the program).

## What the comparison does not cover

- The sound as heard, the music, and the sounds of the menus (the click) beyond the source's reading.
- The place of a click or a tap on a button, and what a touch does.
- A frame longer than 16 ms, a window that loses focus, the browser's own full screen, other browsers than Chromium-based ones.
- The sounds, the quiz and the game screen in the 17 languages other than the ones tried (the main menu, the table of scores, the options, the difficulty menu, the start of a game and the menu of the game are compared in every language; the quiz screen in three).
- Levels beyond the ones the scenarios play, apart from the 50 routes (one for each level, from the first cell to the last wagon, with the original's own arithmetic).
