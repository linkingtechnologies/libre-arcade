# What was changed in the package's files, and why

The files of `public/` started as the files of the restoration package `rili-m18.zip` (SHA-256 `b7b771b46c098a161d50842f075964b46433854a38f245da3c5c37e0d79ad127`,
its folder `Ri-li-2.0.1-M18-final-audit`): its `index.html`, `styles.css`, `src/`, `data/`, `ui/`, `assets/` and `audio/`. They were put next to the original program
itself (the C++ of `reference/Ri-li-2.0.1.tar.bz2`, compiled and run on a virtual clock) and corrected where the comparison showed that they differ from it. Everything
else in `public/` is the package's, unchanged. `docs/development/package/` keeps the package's own documents, tests and data exactly as they came (its checksum list,
`SHA256SUMS.txt`, names every file), and `test/package.test.mjs` runs its tests against the files as they are now: eight still pass, and the four that do not are listed there with the reason.

The comparison is described in [`../../specs/port-map.md`](../../specs/port-map.md). It plays the original and the page side by side with the same keys on the same clock and compares the
state, the random numbers, the sounds, the list of what was drawn and, for the menus and the game, the pictures themselves; each change below is one that it made necessary, and the scenario that
shows it agrees afterwards. The package was right about a great deal: the levels, the sprites, the geometry of the train and its wagons, the rules for picking up an object, the
collisions, the quiz and the insertion in the table of scores are the package's own code and agree with the original (`port-map.md`, "What the oracle found"). What differed was in the order and the timing of
things within a frame, in how the keys are read, in the state that the original keeps from one level to the next, in a few float roundings that move a sprite by a pixel, and in the menus.

## Where the files stand

<!--HASHES-->
| File | The package's SHA-256 | Now |
|---|---|---|
| `public/index.html` | `20cc62642323765db6128d11d9d623c78e5b32b95463b2ca60d72480d3263c2a` | `550c708af5e7f7662ffd94d3fae20e71a0707ebd28eac53c1f062c87326d9a67` |
| `public/styles.css` | `3f0e96210ed9455899fac3fa373186d0978e7c18abc44dfd27a34a74ad454cfc` | unchanged |
| `public/src/app.mjs` | `18ef260a01c49a99a4d5904e16113c5c922e8c987283a06e9ef7c2a9cbd9085f` | `3d820c992ea4468694d50f1960fe1faf67cfd5b487045e502295b275c2fb0b45` |
| `public/src/audio.mjs` | `e7f4cdf2abddf9836fe7b978fc30c67fdb61848fa15997a1b3a2c78efd2b7066` | `166a795c137fad42de9b15bdeca9d7710184ef00e112a058fb0f118be458bf44` |
| `public/src/core.mjs` | `2676b66a86ca056f53ea087ab4fe268c79d540415f4a315756e4b1cf2a0a5bff` | `c2fe1e07bf1fe27226c2c1910b84e4b4959d26bd7b9add9df3ffb59375fee1f7` |
| `public/src/index.mjs` | `f9252a3ecc557f45d6e8d9dc0e9faa4f8343bca35483a5257d31dee189006259` | unchanged |
| `public/src/levels.mjs` | `b2dbd72fb1fa188ef8cf500f67e41b4679437d7ceb66ab3dfcf498e6d28bf759` | unchanged |
| `public/src/preferences.mjs` | `42446f58dadc3cec1afb24bb4ef47eb35a759fb30944efb604e8673e76f5cecc` | unchanged |
| `public/src/renderer.mjs` | `6046f46b17b99e5c3650e728ab44cbe4687c07402d6e9f273ce84075ca84e8df` | `aa696f4db3482f727ab05db29faf07d7ed135f206a107e3e3b1fe86f29f1d2a4` |
| `public/src/rng.mjs` | `98ce153a56ba3cad5c9411057e208a895c1bc472eea398e742cd209d4819bf0c` | unchanged |
| `public/src/session.mjs` | `39cc9b36f4d5004981e75b8bba314afdf549bbda2c7723be69c1c1f0ae2f5df5` | `2cd9d28bc94a285a34f02d2a4322d9af2cbeb07a962fa86efc84e299662e51b6` |
| `public/data/sprites.json` | `6f55e22fee8f06fbaa88d3670e7761e36baa3408a232a10067d01ed525ce561e` | unchanged |
<!--/HASHES-->

`public/data/levels.dat` is the original's `levels.dat` (SHA-256 `d88a4a1c3f8bb7eab580cb4a0225602b2f96b71fd34404ad230d37f0c6ee774f`); the package kept it in `reference/` and the page asked for it there, and it is now in
`public/data/` so that `public/` is complete by itself (the package's copy is in `package/reference/levels.dat`, unchanged). The pictures (`assets/`, `ui/`), `data/sprites.json` and the nine WAV effects
are the package's, unchanged, and `tools/check-assets.mjs` compares the pictures with the original's `sprites.dat` and `language.*` pixel for pixel.

## What a player could see (and did not match the original)

- **The pause and the keys** (`app.mjs`). In the original a key that is down is read every frame (`Jeux::SDLMain` keeps the last key pressed, `Key`, and which arrows are down, `MasqueK`, and
  `PrendTouche` acts on it in each frame in which the train is not in a pause); while an arrow is down the arrow drawn on the board keeps the player's direction instead of the train's
  (`Loco::DoFleche`). The page acted on the key once, when it went down. The page now holds the keys, ignores the browser's repeat, drops them when the window loses focus, and a key that
  starts the game from "press any key" is also the first move, as in the original.
- **The order of the keys, and the random numbers, go on from one level to the next** (`core.mjs`, `session.mjs`, `app.mjs`). The original's `Touche[]` (the order in which the four directions
  are preferred at a junction) and the C library's `rand` are never reset between levels or between games; the page made a new order for every level and began again from the seed for every game. A
  wagon type or the choice of a route could differ from the second level on, and from the second game. The page now keeps one generator for the whole session of the page and gives each level the
  order the last one ended with. (The package's own routes through the 50 levels were found with the old behaviour: 14 of the 50 no longer hold, `test/package.test.mjs`.)
- **The arrow on the board** (`core.mjs`). The original has no arrow (`PInter` is -1) until the first `Avance`; the page drew one from the start, which can differ by the cell it points to and by what a key does
  before the first step.
- **One frame later** (`session.mjs`). The original tests the end of the pause after a death or a clear (`Mort<Horloge`) and of the result of the quiz (`Fini<Horloge`) after the frame has been drawn and shown,
  with the clock of the frame before; so the quiz, the table of scores and the next level begin one frame after the page began them. The page now does what the original does. The time of the game
  (`DureeJeu`) is also increased before the train advances, not after, and it advances in the frame in which a pause ends.
- **The sprites a pixel off** (`core.mjs`, `renderer.mjs`). The original works in `float` (the position of a point on a straight stretch, the angle of a wagon, the cable between wagons, `sin` and `cos` of an angle), and
  g++ does that arithmetic in single precision; the page used doubles, so a wagon or a point of the cable could land on the next pixel. The page now rounds each of those steps to single precision (`Math.fround`).
  The sprites of the board and the label images are placed with the original's integer arithmetic (`x - (width >> 1)`).
- **The table of scores** (`renderer.mjs`). The page drew its own table: a dark band behind the new score, the words YOUR SCORE and GAME OVER or 50 LEVELS COMPLETED, rows 51.4 pixels apart, the numbers in
  another font. The original draws the eight rows one every 51 pixels in its letters' font, the number on the right edge, dots where there is no name, the name being typed with an arrow on each side of it, and nothing else. The page does the same.
  Both the table from the menu and the one after a game agree with the original's picture.
- **The options screen** (`app.mjs`, `renderer.mjs`). The original's screen has the loudspeaker and the music note that turn, a train of wagons for each volume, the full screen and window buttons, the world that turns and
  the button that goes back, with the arrows round the chosen one; it starts on the button that goes back, and every key is a click. The page drew its own screen. It is now the original's, drawn with
  the original's own numbers (the wagons are 39 pixels apart; the volume is the number of wagons). The full screen button asks the browser for its full screen where the original asks SDL for a video mode.
- **The language menu and the 19 languages** (`app.mjs`, `renderer.mjs`, `preferences.mjs`, `languages.mjs`, `public/ui/`). The original opens a menu of its 19 languages in three columns (7, 7 and 5 rows), one label each, with the arrows 5 pixels outside the chosen
  label, from the options screen, starts on the language in use, and loads the language file when another is chosen. The package had two of the languages and switched between them with a button. The page now has the 17 others, extracted from the original's own `language.XX` files
  (`tools/extract-languages.mjs`, pixel for pixel by `tools/check-assets.mjs`), loaded when a language is chosen (79 PNG, about 0.7 MB), a menu like the original's, and a button in the bar that shows the language's code and opens the menu from any screen (the game pauses). The saved language can be any of the 19. The page's own texts
  (bar, guide, credits, status line) are in Italian and English only and are in English with the other 17 languages.
- **Escape in a game** (`app.mjs`). In the original it opens the menu of the game (`Menu::SDLMain_InGame`): Continue, Options and Exit game, over the last picture of the game. Continue (or Escape again) goes back to the game, which waits for a key. Options is the options
  screen and back; the menu then has the options screen behind it, as the original does (it copies the back buffer, which holds the picture of the frame before the last one). Exit game goes to the table of scores, to type a name if the score is one of the eight best. The page left the game and
  went to the main menu. The button "Menu" of the page's own bar still does that.
- **The decorations of the quiz** (`session.mjs`). Around the panel of the question the original puts a locomotive and four small pieces, each with a random frame and a random offset, in a call `Sprites[deco].Affiche(100, 160 + rand() % 130, rand() % 18, ...)`. C++ does not fix the order in which the arguments of a call are computed, and g++ takes the last first, so the frame is the first number
  and the offset the second. The page took them the other way round: the same numbers were used up (which is all that the comparison of the random numbers sees), and the four pieces stood in the wrong place with the wrong frame. This was found by comparing the picture of the quiz, which the lists of what was drawn do not cover.
- **Escape in the quiz and in the main menu** (`app.mjs`, `session.mjs`). In the quiz the original goes on without an answer (the next level, no bonus). In the main menu it ends the program; the page shows the screen it has for Quit.
- **The mouse** (`app.mjs`). The buttons of the options screen, of the menu of the game and of the language menu answer a click or a tap; the places that answer are rounded boxes of the page's own, not the original's (`Menu_Py`), and the pointer is not compared with the original.

## What a player would hardly notice, or not at all (and the oracle sees)

- The first frame after "press any key" was lost when a key that was already down started the game (the page's clock was reset); the key now starts the game without losing the frame.
- Every key of the options screen, the language menu and the menu of the game makes the click sound (`sClic`), as in the original (the page had it for the arrows only).
- The window that loses focus pauses the game as before; the keys that were down are let go.

## What was added around the page

- `public/index.html`: an empty icon link (the page asked for `/favicon.ico` and got a 404) and the collection's visit counter before `</body>`.
- `public/src/app.mjs`: the guide mentions Escape (Italian and English).
- `public/src/audio.mjs`: the first key or click of a visit unlocks the sound by starting the menu music, and the page waited for `play()` to answer, which it does only when the tune has started (the OGG of the menu is 1.2 MB): on a slow connection that key was lost for seconds, and in headless Chrome without an audio device it was lost for good. It no longer waits.
- `public/data/levels.dat` (see above).
- `public/ui/<code>/`, `public/ui/lang/<code>.png` and `public/src/languages.mjs`: the other 17 languages (see above).
- Everything else of this folder: the oracle (`tools/`), the recording of it (`test/fixtures/`), the tests, the documents, the checksums, the screenshots and the collection's scaffolding.

## What is not changed, and differs

See `../../specs/port-map.md`, "Known differences that are kept". In short: the original draws its own pointer, a browser shows the system's; three pixels of the icon of the life just lost stay in the original's picture while a death pause lasts (an artifact of the original, not
reproduced); `Help` (the arrow on the board) is remembered between visits by the page and reset for each game by the original; the page's own texts are in Italian and English only (in English with the other 17 languages); the original's hidden level editor (`tide` in the main menu) is not ported; the page has a touch pad, a button for the full screen, a guide, credits and a reset of the saved data;
the page steps the game by 16 ms, the original's frame, and a longer frame (a slow machine), which makes the original's step longer, is not compared.
