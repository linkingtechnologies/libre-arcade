# Technical audit (M0 and M1)

Source: upstream commit `8fc4b57` (see [`reference/SOURCE.md`](reference/SOURCE.md)).

## The nine questions

1. **Engine files.** `game.js` (utilities, `Color`, `Grid`, `GameCanvasRenderer`, `Game`, storage, level bar, timeline) and `game.desktop.js` (orientation, the screen controller `SameGame`, score screen). `i18n.js` holds the texts. The other 17 files are jQuery, plugins, assets or the unused jPlayer skin.
2. **Board generation.** `Grid.generate`: every cell is `floor(nbColors * Math.random())`. Easy 8x8 with 3 colours, Normal 12x12 with 4, Hard 16x16 with 5. The colours come from `Colors.get(n)`, which shuffles five fixed colours with `sort(() => Math.random() - 0.5)` and keeps `n`.
3. **Groups.** `Grid.computeDestroy`: recursive flood fill over the four orthogonal neighbours, same colour. A ball is playable (`isDestroyable`) when at least one orthogonal neighbour has its colour, so the removal threshold is 2.
4. **Gravity.** Four directions, set by the board rotation (arrow keys or the side buttons turn it by 90 degrees; the logical orientation follows 500 ms after the CSS rotation). After a removal, balls fall along the current direction; when the direction changes, the whole board slides. `computeGravity` builds the movement, `applyGravity` commits it.
5. **Randomness.** Unseeded `Math.random()`, no deterministic mode. The restoration adds an optional one (`?seed=N`, `samegame.setSeed`).
6. **Score and end.** Per game: `floor(2*w*h*(colours-1)/(1+ballsLeft))` + (sum of the four biggest groups x (colours-2)) + `floor(50*exp(-t*ln2/(w*h*800 ms)))`. The game ends when `noMoreDestroyable()` says so (a documented heuristic: "probably finished") or when 20 s pass without removing a group. 0 balls left shows "Congratulations", otherwise "Game over". Total score, best score per difficulty and a level (`850s + 150s^2`) are kept in `localStorage`.
7. **Animation and input.** A `requestAnimationFrame` ticker runs `Game.render()`: removal fade 150 ms, fall after removal 300 ms, fall after a rotation 200 ms, all driven by wall-clock `TimeProgression`. Screens slide with CSS transitions, the rotation is a 1 s CSS transform, the countdown bar a 20 s CSS width transition. Input: `click` on desktop and `touchstart` on iPhone/iPad/Android (user-agent sniffing), `mousemove` for the white hover highlight, arrow keys for rotation.
8. **Obsolete.** jQuery 1.5.2, `jquery.tmpl`, `jquery.ba-hashchange`, `jquery-css-transform`, jPlayer (loaded, never used) and its skin, Modernizr 2.0, `md5.js` (anti-tamper hash for tweeted scores), Google Analytics (`ga.js`), the remote scores widget (`same.greweb.fr`), Twitter intent sharing, Android Market / App Store links, a Google Chart QR code, Facebook meta tags, PhoneGap `Media` branch, vendor-prefixed `requestAnimationFrame` and CSS, the "update your browser" page.
9. **Runs today?** Yes. The untouched original loads and plays in a current Chromium. It logs failed requests (`ga.js`, `same.scores.js`, images from `same.greweb.fr`, all unresolvable) and one `ReferenceError` from the dead scores widget, none blocking.

## Latent bugs found in the original

| # | Bug | Evidence | What the restoration does |
|---|---|---|---|
| 1 | A click beside the board (the black margin of a wide window) calls `isDestroyable` with a column that does not exist, throws a `TypeError` inside the frame loop and **freezes the game**. | Reproduced in the original in a browser (`Cannot read properties of undefined`); `test/game.test.js` reproduces it with the original code. | `isDestroyable` returns `false` off the board. Identical for every on-board cell (oracle). |
| 2 | After "Continue game" in a new session, finishing the game throws, because the score screen reads the colours of the last *new* game (a module variable, `undefined` after a reload). | Source reading: `endGame` uses `colors[...]`, set only in `newGame`. Not run in the browser. | Uses the colours of the game being finished. |
| 3 | `noMoreDestroyableForCurrentGravity` iterates with `for..in`, so `x` and `y` are strings and `x+1` concatenates. | Source reading. Harmless: every adjacent pair is also seen from the other side with `x-1`. | Left as is, on purpose. |
| 4 | The orientation (and the board's CSS rotation) survives into the next game. | Source reading. Consistent, so not a bug in play. | Left as is. |

## Dependency decisions (M1)

Every item of the list above is either removed or replaced by a browser API.
There is no runtime dependency, no CDN, no server component. Details and the
line-by-line list of deviations are in [`specs/design.md`](specs/design.md).

## What is verified, and how

See [`TEST_REPORT.md`](TEST_REPORT.md). In short: the engine against the real
original code (level 1), the score formula against a transcription (level 3),
the canvas drawing by a frame-by-frame pixel hash comparison against the
original in a browser (534 frames, identical), the UI by running it.
