# XO World

**[▶ Play here](https://linkingtechnologies.github.io/libre-arcade/xo-world/public/index.html)**

HTML5 port of **XO World**, the 10×10 five-in-a-row applet from JavaGames 1.0 by Milan Babuškov (archive dated 2007, code copyright 2000 to 2007). You play X against the original computer player, ported rule for rule from the Java source and checked against the original code itself.

## Play

- Mouse or touch: choose an empty square. Keyboard: the arrow keys move the cursor on the board, Enter or Space plays.
- You move first. Make five X in a row, horizontally, vertically or diagonally, before the computer makes five O. The highlighted O is the computer's last move.
- At most 50 X can be placed; if the board fills up, the game is a draw.
- **New game** starts again, **IT/EN** switches the language (the choice is remembered), **?** opens the help and credits.

## What is preserved

The decision logic of the computer player is the original's: a fixed ladder of tactical detectors (immediate five, open and closed fours, double threats, small patterns) that includes a bounded forced-sequence search seven moves deep, and a random move next to existing stones when no detector applies. The rule order, the board indexing and the original's quirks are unchanged. The board is drawn procedurally: none of the original images is redistributed (see [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md)).

Where each Java method went, and what was checked, is in [`specs/port-map.md`](specs/port-map.md); the sources, their licence and the evidence are in [`PROVENANCE.md`](PROVENANCE.md).

## Run

```sh
npm run dev      # serve public/ at http://localhost:8080
```

There is no framework and no build step to play: `public/` is plain HTML, CSS and JavaScript. Any static web server works (`python3 -m http.server 8080` from `public/`, nginx, GitHub Pages). `npm run build` packages `public/` into a gitignored `game/` folder for standalone deployment; `npm start` builds and then serves `game/`.

The engine lives in `src/` as CommonJS so that Node can test it; `public/xoworld-bundle.js` is generated from it (`npm run bundle`) and a test checks that the committed copy is current.

## Test

```sh
npm test         # node --test: all tests, no Java needed
npm run lint
npm run check    # lint + test
npm run test:live   # runs the original Java applet again and compares afresh (needs a JDK and a display)
```

`npm test` includes the replay of a recorded run of the original applet: 2,000 games, 27,287 clicks, every reply identical in the port. See [`specs/port-map.md`](specs/port-map.md) for what that proves and what it does not.

## License

GPL-3.0-or-later. The game logic is a port of GPL-2.0-or-later code, whose "or later" grant was read in the header of the preserved source file. The original source and its licence text are in `reference/javagames-1.0/` and keep their own notices.
