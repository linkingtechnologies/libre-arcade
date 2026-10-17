# The oracle: the original Ri-li, run headless

`harness.cc` runs the original Ri-li 2.0.1 (the C++ in `reference/Ri-li-2.0.1.tar.bz2`: `loco.cc`, `jeux.cc`, `ecran.cc`, `sprite.cc`, `menu.cc`,
`tableau.cc`, `utils.cc`, `main.cc`) on a virtual clock with scripted keys, and prints what the game has become after every frame as a line of JSON.
`tools/oracle.mjs` plays the same scenario on the page and compares the two.

## What is the original's and what is not

- The game, its rules, its random numbers (the C library's `rand`, seeded with `srand`), its drawing code and its data files (`sprites.dat`, `language.*`,
  `levels.dat`) are the original's, compiled by `build.sh` as they are in the archive. The one change to their text: three tests `pointer <= 0`
  (sprite.cc twice, tableau.cc once) that C++ no longer accepts are written `pointer == 0`. `build.sh` checks that exactly those lines changed.
- SDL 1.2.15 is the real library (`build-sdl.sh` builds it from the official archive, checked by SHA-256), on its "dummy" video driver, which draws nothing on a
  display but gives the program real software surfaces: the sprites are blitted by SDL's own code.
- Time is virtual: `SDL_GetTicks` returns a counter that moves only when the game sleeps (`Sleeping()` waits for 1000/60 ms: every frame lasts 16 ms) or when
  the scenario makes a frame longer. Input is scripted: `SDL_PollEvent` gives out the scenario's events in the frame they are for. The calls to the clock
  and to sleep that the game makes are renamed at compile time (`-DSDL_GetTicks=rili_GetTicks`); SDL's own are not.
- The video surface is double buffered, as the original's `SDL_DOUBLEBUF` asks and as its erase lists (`Ec[0]` and `Ec[1]`, each cleared two frames after it
  was drawn) need. A video driver that ignores `SDL_DOUBLEBUF` shows the sprites of the previous frame as well; that is not what the code means, and is not reproduced.
- `main()` is not run (`main.cc` is compiled with `main` renamed): its start-up is repeated in `harness.cc` with the same calls, except for the sound
  (`audio_stub.cc` keeps the original's bookkeeping and records what the game asks to play), the video mode (the dummy driver says 8 bits, the game refuses
  that) and the window title. The language is chosen by the scenario instead of by the menu.
- The glibc `rand` is what the original used on Linux; the page's `GlibcRand` makes the same numbers (the oracle checks that).

## Building

```sh
SDL_PREFIX=$HOME/.cache/rili-sdl tools/oracle/build-sdl.sh                 # once
SDL_PREFIX=$HOME/.cache/rili-sdl RILI_BUILD=$HOME/.cache/rili tools/oracle/build.sh
```

Run them on Linux or in WSL (bash, g++, make, curl, and bzip2 or python3 to unpack the source archive). The data files of the original are 135 MB unpacked.
Then, from Windows or Linux, `node tools/oracle.mjs check`; `RILI_ORACLE` is the path of `rili-oracle` as the shell that runs it sees it, and `RILI_WSL` the WSL
distribution (`none` on Linux).

## The scenario file

One directive per line (written by `tools/scenarios.mjs`): `mode game`, `level N`, `difficulty easy|normal|hard`, `seed N`, `language it|en`, `frames N`,
`dt MS`, `dt-at FRAME MS`, `keydown FRAME KEY`, `keyup FRAME KEY`, `click FRAME`, `dump FRAME PATH`, `dumpall DIR EVERY`. A key press in frame f acts in frame f.

`mode menu` starts the original at its main menu, as `main()` does, and plays the whole program: the menus, the game, the quiz, the table of scores. The loops of the menus do not count frames alike (each screen has a
set-up flip of its own), so such a scenario gives its keys and its pictures by the clock, which starts at 1000: `tdown MS KEY`, `tup MS KEY`, `tclick MS`, `tdump MS PATH`. A key is read in the first frame that begins at or after its time.
`node tools/oracle.mjs menus` plays the scenarios of `menuScenarios()` (tools/scenarios.mjs) on the original and on the page and compares the pictures; `RILI_PNG=folder` writes the original, the page and the differences side by side.
`node tools/oracle.mjs quiz-pictures [code ...]` compares the screen of the quiz in some languages (the original is started in a language with the scenario's `language`, the end of the name of its file: `de`, `jp`, ...; its `data` folder must have all the `language.*` files, which `build.sh` unpacks from the archive).

## The output

One line of JSON per frame (`"k":"g"`), or per frame of the quiz after a won level (`"k":"q"`), of the menus (`"k":"m"`), of the menu inside a game (`"k":"i"`) and of the table of scores (`"k":"s"`). A game frame has the state
(distance of the head as the float's bits, cell, wagons, score, lives, spacing, speed, the timers, the keys' order, the arrow's cell, the pause, the hash of
the board), the random numbers and the sounds of the frame, the original's own list of what was drawn (`Ec[NumVideo]`: sprite, frame, x, y), and a hash of the picture.
