# Same Game Gravity: restoration design

A *restored* game in the sense of the collection's `AGENTS.md`: the 2011 code,
cleaned for current browsers. No `reference/` port-map: `public/game.js` is the
original `game.js`, transcribed. The untouched upstream is in `reference/`
only as a manifest and oracle.

## Files

| `public/` | Origin |
|---|---|
| `game.js` | upstream `game.js`, jQuery removed, deviations below |
| `game.desktop.js` | upstream `game.desktop.js` (controller), same |
| `i18n.js` | upstream `i18n.js` (en, fr) + our `it` and new keys |
| `index.html` | upstream `game.html`, services removed, new bar/overlay/toolbar |
| `game.css` | upstream `game.css` (compiled), prefixes dropped, new "RESTORATION" block |
| `Chewy.ttf`, `background.jpg`, `logo.png`, `rotate-right.png` | upstream, unchanged |
| `pop.wav`, `swosh.wav` | new, CC0, replace `pop/swosh.mp3/ogg` |

Dropped upstream files: `jquery*.js`, `jquery.jplayer.min.js` and its skin,
`modernizr.custom.js`, `md5.js`, `index.html`/`index.css` (the promo page),
`keys.png`, `scores_exemple.png`, `pbar-ani.gif`, `icons/*`, and the mp3/ogg sounds.

## Gameplay: unchanged

Board sizes, colour counts, random generation, group rule (>= 2, orthogonal),
gravity in four directions, the three animation durations (150/300/200 ms),
the 20 s countdown, the score formula, the end-of-game heuristic, the level
curve, the screen transitions and the 500 ms orientation delay are the original
code. `test/oracle.test.js` proves it for the engine and `reference/baseline/pixel-compare.js` for the canvas drawing (see `TEST_REPORT.md`).

## Deviations (every one)

Marked `RESTORATION:` in the code.

### Dependencies
- jQuery `bind/trigger/unbind` on the container → DOM listeners for input and a private emitter for `game-*` events (`Game.bind/trigger/unbind`). Per-game handlers, so an old game can never leak handlers into a new one.
- `$.extend`→`Object.assign`, `$.noop`→empty function, `.css/.text/.addClass/...`→DOM, jQuery templates → `createElement`.
- Modernizr gate and the "update your browser" page: removed (canvas, transforms, audio, storage are baseline).
- `window.onkeydown`/`keyCode` → `addEventListener('keydown')`/`e.key`.
- Vendor-prefixed `requestAnimationFrame` and CSS removed. PhoneGap `Media` branch removed.
- `hue2rgb` moved out of an `else` block (strict-mode safe), same maths.

### Removed services
Google Analytics, the remote scores widget, Twitter sharing and its md5 signature, "players scores", app-store links and QR code, Facebook meta, mobile download list, `same.greweb.fr` footer. Help page 3 ("scores system", Twitter) and 4 ("feedback", downloads) are gone; help is two pages (goal, gravity). The credits and history text is a separate "Credits" screen, opened from a link under the menu, so the instructions stay short.
The Libre Arcade GoatCounter beacon is added (collection rule).

### Bug fixes (no change for valid play)
1. `Grid.isDestroyable` guards missing cells (clicks beside the board froze the loop).
2. `endGame` uses the finishing game's colours (crashed after a reload + Continue).

### Input
- UA sniffing removed. Mouse keeps `click`; touch uses `pointerdown`; a `click` within 800 ms of a touch is ignored (the synthetic click of a tap). Hover highlight only for mouse pointers (`pointermove`, `pointerType === 'mouse'`). `touch-action: none` on the game screen.
- Arrow keys unchanged; added `P`/`Escape` (pause), `M` (mute).

### Added (not gameplay)
- **Pause**: button, `P`/`Esc`, and automatic when the tab is hidden (a hidden tab otherwise times out). Clocks are shifted by the paused time (`TimeProgression.shift`, `Game.shiftTimes`, `Timer.pause/start`), the countdown bar is pinned and resumed over the remaining time. The overlay hides the board.
- **Mute** (persisted), shared by the toolbar and the game bar.
- **Language**: EN, IT and the original FR; browser detection (`navigator.languages`), manual switch, choice remembered. New texts are i18n keys, including strings upstream hard-coded in English ("points", "Total", "record").
- **Seed**: `?seed=N` (and `samegame.setSeed`) for a reproducible board; off by default. `samegame.random`/`setRandom` is the single place the game draws random numbers.
- **Layout**: font size `clamp(15px, 5vmin, 30px)` (30 px as upstream on a normal window), a tighter menu for short landscape screens, rotation buttons under the board in portrait, safe-area insets, no scrolling. Game bar 40 px instead of 30 px (taller tap targets); the rotation buttons are vertically centred instead of at a fixed 265 px.
- **Storage**: keys prefixed `libre-arcade.same-game-gravity.` (one origin hosts the whole arcade), same shapes, in-memory fallback when `localStorage` is blocked.
- **Accessors**: `SameGame.getCurrentGame()`, `pause/resume/togglePause/isPaused`, `game.computeScore`, `game.Difficulty` (the table and the formula moved out of `endGame` unchanged, so they can be tested).
- **Visual**: the keyboard picture (`keys.png`) became text and two key caps, localised.

### Deliberately not changed
- Canvas resolution is not scaled for high-DPI screens (the original draws at CSS pixels); doing so would change the drawing code for a purely cosmetic gain.
- First launch still opens the help page, like upstream.
- `for..in` string indexes in `noMoreDestroyableForCurrentGravity`, the persisting orientation, the `sort(random - 0.5)` shuffle (whose distribution depends on the engine's sort).

## Saved games

"Continue game" keeps upstream's format (grid, colours, difficulty, destroyed groups). The elapsed-time clock restarts, as upstream.
