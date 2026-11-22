# Test report

Run on 2026-11-22, Node 24, `npm run check`: ESLint clean, **33 tests, 33 passing**, ~3 s.

## Automated (`npm test`)

`test/oracle.test.js` is the executable oracle: the untouched 2011 `game.js` and the restored one are loaded in separate `vm` contexts with a virtual clock and driven through identical scripted games (3 difficulties x 4 seeds, 4000 frames, clicks and rotations through all four gravities). Renderer calls, `game-*` events and the grid after every frame must match line by line. It also compares `Grid` operations (destroyable, groups, the four gravities, end detection) on 300 random grids, the colour maths and the level curve.

`test/game.test.js` covers: connected groups, invalid moves (including the upstream crash, reproduced on the original code), group deletion, gravity in four directions, score formula against a transcription of upstream's, game completion, the difficulty table, seeded reproducibility and the unseeded default, restart/state reset, mouse and touch resolving to the same brick, EN/IT/FR dictionaries complete and every key the page uses present, responsive CSS rules, every referenced asset present, valid WAV files, no remote dependency but the arcade beacon, pause clock shifting, storage without `localStorage`.

Passing tests:

```
✔ connected groups: orthogonal only, same colour only
✔ invalid moves: single ball, empty cell, outside the board (upstream threw)
✔ group deletion leaves nulls and touches only the group
✔ gravity in the four directions
✔ score formula equals the upstream endGame() arithmetic
✔ game completion: no pairs left, checkerboard rectangle, and a played game
✔ difficulty table and timeouts
✔ seeded mode is reproducible, default mode is not seeded
✔ restart gives a fresh state
✔ mouse and touch resolve to the same brick
✔ i18n: IT and EN are complete, and every key used by the page exists
✔ i18n.get substitutes parameters and falls back to English
✔ responsive page: viewport meta, no scroll, portrait and short-landscape rules
✔ assets: every local file the page references exists and is non-empty
✔ audio: the two sounds are valid PCM WAV files
✔ no remote dependency except the arcade analytics beacon
✔ pause: shifting a clock keeps animations from jumping
✔ storage and scores work without a localStorage
✔ test\helpers\harness.mjs
✔ oracle: difficulty 0, seed 1, rotations and clicks
✔ oracle: difficulty 0, seed 2, rotations and clicks
✔ oracle: difficulty 0, seed 3, rotations and clicks
✔ oracle: difficulty 0, seed 12345, rotations and clicks
✔ oracle: difficulty 1, seed 1, rotations and clicks
✔ oracle: difficulty 1, seed 2, rotations and clicks
✔ oracle: difficulty 1, seed 3, rotations and clicks
✔ oracle: difficulty 1, seed 12345, rotations and clicks
✔ oracle: difficulty 2, seed 1, rotations and clicks
✔ oracle: difficulty 2, seed 2, rotations and clicks
✔ oracle: difficulty 2, seed 3, rotations and clicks
✔ oracle: difficulty 2, seed 12345, rotations and clicks
✔ oracle: Grid operations on 300 random grids, all four gravities
✔ oracle: colour lightness maths and level curve
```

## Browser checks (built-in browser, Chromium)

Done by hand-driven scripts, with no console errors:

- Menu, help, scores, game and score screens load in English and Italian; language switch is live and remembered.
- A seeded Normal game (`?seed=12345`) plays: group removal, gravity, score screen with the Italian texts.
- A click in the margin beside the board no longer freezes the game (the same click freezes the original).
- Pause: the countdown stops for 2.5 s and resumes from the same value; overlay shown and hidden.
- Viewports 390x780 (portrait phone) and 740x360 (landscape phone): menu, three help pages, scores and the score screen fit with no scrolling; canvas fills the width on the portrait phone.

## Pixel comparison with the original (browser)

[`reference/baseline/pixel-compare.js`](reference/baseline/pixel-compare.js) was run on the untouched original and on the restored game, same 1000x700 viewport, virtual clock, same seed, `render()` stepped by hand. It hashes both canvases (balls and hover highlight) after **every one of 534 frames**: initial gravity, hover, three removals (fade and fall), then rotations of 90, 180, -90 and 0 degrees, each followed by a removal. Every section and the overall hash are identical (`4cf48959b488`), canvas 670x670 in both. This covers `GameCanvasRenderer`, so the drawing code is verified against the original, not just read.

(An earlier attempt with real animation frames was dropped: the hidden browser pane throttles them and the two runs had different sizes.)

## Not covered, honestly

- **No real touch device and no audible playback check.** Touch is covered by event-level tests and the code path, sounds by file validity.
- Mouse-versus-touch double handling on old Safari (a `click` without `pointerType`) is handled by a time window and not tested on that browser.
- The CSS (layout, screen transitions, countdown bar) and the DOM controller are not pixel-compared: the restored page deliberately differs (game bar, buttons, toolbar).
- The score *screen* is tested through the pure `computeScore`; the DOM that prints it was only looked at.
