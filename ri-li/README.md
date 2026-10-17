# Ri-li

**[▶ Play here](https://linkingtechnologies.github.io/libre-arcade/ri-li/public/index.html)**

HTML5 restoration of **Ri-li 2.0.1**, the arcade game that Dominique Roux-Serret made in 2006 and 2007 (C++ and SDL, music by Maf464). A wooden toy train follows its rails by itself and never stops; you choose the way at the junctions, take every wagon that lies on the track, and the train grows with each one. There are 50 levels, three lives, three difficulties, and after each level a question on human rights for 50 more points. The page is the one that a restoration package built; here the original program itself was compiled and run next to it, headless, on a virtual clock with the same keys, and the page was corrected wherever the two differed. The pictures, the levels and the sound effects are the original's.

## Play

- **Goal.** Take all the wagons on the board without running into your own train. Some objects on the rails make the train shorter or longer, or faster, or give a life.
- **Keyboard.** The arrow keys say which way to turn at the next junction, and holding one keeps that choice. **Enter** or **Space** choose in the menus and start the game after "press any key"; **P** pauses; **H** shows or hides the arrow on the board; **Esc** opens the menu of the game (Continue, Options, Exit game), skips the question after a level, and in the main menu leaves.
- **Mouse and touch.** A click or a tap on the board turns the arrow to the next way that is open (the original's "drive the train with the left mouse button"); on a phone there are four arrow buttons under the picture. The buttons above are pause, the arrow, the language (it shows the code of the language in use and opens the language menu), the menu, the guide and the credits.
- **Menus.** Play, Scores, Options, Quit. Options has the volume of the effects and of the music, the full screen, the language (a menu of the original's 19 languages, in three columns), and Menu to go back; every key makes the click sound, as in the original. A game starts on Easy, Normal or Hard, and from a level that you have already reached.
- **Scores.** The eight best scores are kept in the browser, with a name that you type when your score is one of them (Backspace deletes, Enter or Esc finishes). After the last level each life that is left is worth 100 points.

## What is preserved

The original program decides what is right. A very large part of what is on the screen is the original's own data run by a page that was compared with it:

- **The levels.** All 50 boards, from the original's `levels.dat` unchanged, and the objects on them.
- **The train.** It moves by distance and not by squares (a straight rail is 40 pixels, a curve 31.416), the wagons follow where the head has been, the junctions are decided by the order of preference of the four directions, a held key acts in every frame, and the order of preference of the four directions, like the C library's random numbers, goes on from one level to the next and from one game to the next. The arithmetic is in single precision where the original's is.
- **The pictures.** The 2,506 frames of `sprites.dat` and the 1,501 label pictures of the 19 languages (the menus, the dashboard, the question and the 30 articles of the quiz), pixel for pixel; the drawing of the board, the train, the cable between the wagons, the menus, the table of scores, the options screen, the menu of the game and the language menu, to the pixel (a channel off by up to 3 of 255 is the rounding of a translucent sprite).
- **The timing.** The pause after a death or a clear, the quiz and its result, the next level and the table of scores begin in the same frame as in the original. The page steps the game by 16 ms, the length of the original's frame.
- **The sound.** The nine effects are the original's bytes and are played in the same frames; the three tunes are the package's conversions of the tracker files.
- **The quirks that the original has.** The pause after a death ends a frame later than its clock says; the menu of the game keeps behind it whatever the screen showed two frames before (after Options, the options screen); Escape in the question after a level goes on without an answer.

What was checked, and how far, is in [`specs/port-map.md`](specs/port-map.md); where everything comes from, the licences and the open points are in [`PROVENANCE.md`](PROVENANCE.md). The pictures of the game are in any of the original's 19 languages (German, English, Spanish, French, Arabic, Chinese, Japanese, Russian, Slovak, Italian, Breton, Portuguese, Swedish, Esperanto, Hungarian, Turkish, Polish, Dutch and Korean); the page's own texts (the bar, the guide, the credits, the status line) are in Italian and English, and in English with the other 17. The guide, the credits, the buttons, the touch pad and the saving of the options are the page's own and are not compared with the original.

## Run

```sh
npm run dev      # serve public/ at http://localhost:8080
```

There is no framework and no build step to play: `public/` is plain HTML, CSS and JavaScript (modules). Any static web server works. `npm run build` packages `public/` into a gitignored `game/` folder for standalone deployment; `npm start` builds and then serves `game/`.

## Test

```sh
npm test         # node --test: the page against a recording of the original, the package's own tests, the data
npm run lint
npm run check    # lint + test
npm run test:live  # plays the original again and compares it with the page (needs WSL or Linux with g++, see tools/oracle/README.md)
```

`npm test` does not need the original: `test/fixtures/original-trace.json` is what the original did, recorded by `node tools/oracle.mjs record` (the state, the random numbers, the sounds and the list of what was drawn for each block of 25 frames, and the pictures as thumbnails), and the page's own code is run in Node on the same scenarios and has to give the same. The recording holds 14 scenarios of the original (idle, random keys, routes, the quiz, and menus including the menu of the game and the table of scores); `node tools/oracle.mjs record` with no names records all 64 (an hour or more), and `RILI_FULL=1 npm test` replays whatever the recording holds. `RILI_DATA=<the original's data folder> npm test` also compares the page's pictures with the original's data files, The original itself is in this repository as the source archive, `reference/Ri-li-2.0.1.tar.bz2`, which `tools/oracle/build.sh` compiles; the numbers are in [`specs/port-map.md`](specs/port-map.md).

## License

The original game is licensed by its author under the **GNU GPL version 2 or version 3** (his source headers say "either version 2 or version 3", with no "or later"); its music is by Maf464 under the GPL version 3; the nine sound effects have no author named in the source release. The pictures, the levels and the effects are in `public/` unchanged, the source release is in `reference/`, and this restoration (the page, the tools, the tests) is **GPL-3.0-only**, as the package it started from is. See [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md) and [`PROVENANCE.md`](PROVENANCE.md).
