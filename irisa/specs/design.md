# Irisa: restoration design

Category: **Restored** (the game's own JavaScript, vendored and adapted), with
a frozen `reference/` kept because the view layer was replaced and the tests
need upstream's own code as an oracle.

## What upstream is

See [`../reference/SOURCE.md`](../reference/SOURCE.md). A Vue 2 page over about
300 lines of game logic, built by webpack/Babel/cssnext into a committed
75 KB bundle. 20 levels on a 10x10 board, turn based.

## Decision: keep the bundle or not

Not kept. The bundle is Vue 2 (end of life) plus the game, and it cannot take
a pause, a second language, a touch pad or an in-page end screen without
editing minified code. The game's own source is small and has no dependency
on Vue except for drawing, so it was kept (not rewritten) and only the
drawing was replaced. No build step is needed afterwards: the page loads the
modules directly.

## Layout of `public/`

| Path | Origin |
|---|---|
| `js/game/levels.js`, `constants.js`, `glyphs.js`, `gamestate.js`, `keycodes.js` | upstream, unchanged |
| `js/game/entities.js` | upstream; `./glyphs` became `./glyphs.js` |
| `js/game/util.js` | upstream; `playSoundEffect` and its Chrome check removed |
| `js/game/store.js` | upstream with the marked changes below |
| `js/render.js` | replaces Vue's `index.js` and `components/*` |
| `js/clock.js`, `sound.js`, `i18n.js`, `app.js` | new (GPL-3.0-only) |
| `css/app.css` | upstream's `style.css`, cssnext compiled by hand, plus new rules |
| `assets/img`, `assets/audio` | upstream, byte for byte |

## Changes to the game logic (`store.js`)

1. `setTimeout` became `this.clock.after`, so timers can be paused and cancelled.
2. `playSoundEffect(X_AUDIO)` became `this.playSound('x')`; the audio elements moved to `sound.js`.
3. `alert(...)` plus `location.reload()` at the end became `this.onAllComplete()`; the page shows a finish screen.
4. **Defect fix.** `loadLevel` now cancels pending timers, unlocks movement and clears the freeze counter. Upstream did none of these, so pressing R within 100 ms of a move made the old move's follow-up (enemies stepping) run on the new level, and pressing R while enemies were frozen started the new level frozen. Shown by `test/oracle.test.mjs` (last test). Nothing else differs: the other tests run both versions side by side.

## Other fixes to browser behaviour

- Sound played only if the user agent contained "chrome": Firefox and Safari got none. Now it plays everywhere, after the first user gesture. (Upstream's reason was Safari slowness in 2017; not re-measured.)
- A key released while the window had no focus stayed "held" and was then ignored; the set is cleared on blur.
- The level dots (2vmin) get an invisible larger tap target and labels; unreachable ones are `disabled`.
- `outline: none` removed (keyboard focus is visible).
- `prefers-reduced-motion` stops the decorative spins and pulses.

## Behaviour kept on purpose (odd, but upstream's)

- Enemies do not move while frozen, and the win/loss check lives in the enemy move, so stepping on the door while frozen wins only on the first move after the freeze ends.
- A freeze of N skips the move that picks it up and the next N-1.
- The Reverse pickup swaps enemies and walls and adds one frozen move.
- The hidden `localStorage.dev = "true"` switch that unlocks every level dot.
- Progress is not saved; a reload starts at level 1.
- Mouse-click movement existed in an early upstream commit and is not in the final one; not added.

## New UI

Title screen (instructions, credits, language), top bar (back to arcade, pause,
restart, sound, language), touch pad (shown on touch devices), swipe on the
board, pause screen, finish screen. Language: stored choice under the arcade's
own key `libre-arcade-lang`, else Italian for browsers whose first language is
Italian, else English. Pause also happens when the tab is hidden. The board
size is `min(width, height)` of the free area, so nothing scrolls.

## Verification levels

- Level 1 (oracle): upstream's `store.js` run from `reference/` and compared after every action with the port: a winning line through all 20 levels (236 moves) and 39,000 random actions with 213 wins and 3,330 losses.
- Level 1: exhaustive search shows each of the 20 levels is winnable.
- Not compared with the oracle: the page itself (Vue render versus plain DOM). That is checked by `test/browser-session.test.mjs` in headless Chrome and by screenshots, not against the original page.
