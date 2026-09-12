# Breakout (html5-breakout) — design

## Structure

Single view, no wizard steps, no framework. `games/html5-breakout/` vendors [html5-breakout](https://github.com/toivjon/html5-breakout) (MIT, archived by its own author) — a single `<canvas>`, a single plain script (`game.js`, ~1100 lines, one IIFE-scoped `breakout` global), no images, no audio, no bundler, no other vendored library. Fullscreen takeover in the Camila-hosted tab, same `#app{position:fixed;inset:0;z-index:9999}` mechanism every other game in this plugin already uses — centered via flexbox around the canvas, CSS-fit to ~90% of the viewport.

```
┌──────────────────────────────────────────┐  <- browser viewport:
│         ┌──────────────────────┐         │     #app is position:fixed; inset:0
│         │ 1P  22  HISCORE  0   │         │     while this dashboard tab is open;
│         │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │         │     canvas.width/height *attributes*
│         │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │  ~0.8:1  │     are whatever game.js's own init()
│         │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │  ratio,  │     already set them to; CSS width/
│         │                      │  CSS-fit │     height (this integration's only
│         │           ⚪         │  to      │     addition, scale.js) then fits that
│         │        ▬▬▬▬▬         │  viewport│     into ~90% of the viewport
│         └──────────────────────┘         │
└──────────────────────────────────────────┘
```

## Already the most self-contained game in this plugin — and why that's not quite enough on its own

Unlike `html5-space-invaders` (hardcoded absolute pixel positions throughout) or even `html5-snake` (positions derived from `canvas.width`/`canvas.height`, but with a hardcoded fixed size in the markup that this plugin had to make dynamic), this game's own `game.js` **already**:

- Derives every position from `canvas.width`/`canvas.height` (confirmed by reading the whole file: no hardcoded `800`/`950` literals anywhere in its body, only ratios and divisions of those two properties).
- Sizes the canvas itself, unprompted, in its own `init()`: `canvas.height = window.screen.availHeight - 100; canvas.width = canvas.height * 0.8;` — upstream's own author already built this to adapt to the screen it's running on.

So none of the fixes the other three games needed (attribute resizing, CSS scaling to work around hardcoded positions, tile-grid alignment) are needed for the *positioning* problem here — upstream solved that already. The one real gap is `window.screen.availHeight`: the **physical monitor's** available height, not this browser tab's own viewport height. Inside Camila's `#app{position:fixed;inset:0}` takeover (bound to the browser viewport, not the screen), a canvas sized off the full screen can end up taller than what's actually visible, clipped by the viewport edge with no scrollbar to recover it — genuinely broken in exactly the hosting context this plugin embeds every game into, even though it works fine for upstream's own standalone page (a normal browser tab, where the assumption "screen height ≈ available viewport height" is closer to true, especially maximized).

Three ways to close that gap were considered:

1. **Monkey-patch `window.screen.availHeight`** (`Object.defineProperty`) to report a smaller value before `game.js` runs, so its own math produces a smaller canvas — rejected: solely to feed one file a different number, this modifies a global browser API for the whole page, risking side effects on anything else that might read the real screen size, for a saving that a plain CSS fit already achieves more simply.
2. **Edit `game.js` directly** to read `window.innerHeight` instead of `window.screen.availHeight` — rejected on the same grounds every other game in this plugin rejects touching vendored logic: `game.js` stays byte-for-byte identical to upstream, full stop (see `CREDITS.md`).
3. **CSS-fit the canvas after the fact**, the same technique `html5-space-invaders`' own `scale.js` uses — the approach taken. `games/html5-breakout/scale.js` leaves `canvas.width`/`canvas.height` (the drawing-buffer resolution, and everything game.js derives from it) exactly as `game.js`'s own `init()` set them, and only sets the canvas element's **CSS** `width`/`height` to fit ~90% of the actual viewport, preserving whatever aspect ratio resulted (read live from `canvas.width / canvas.height`, not assumed to be the original `0.8` literal — correct even if a future upstream version changes that math).

## Ordering: scale.js has to run AFTER game.js here, not before

`html5-space-invaders`' own `scale.js` runs *before* that game's `game.js`, because that game never touches `canvas.width`/`canvas.height` itself — sizing it first, independently, is safe. This game is the opposite: `game.js`'s own top-level code (`breakout.start();`, its very last line) calls `init()` synchronously, which sets `canvas.width`/`canvas.height` unconditionally — so `scale.js` must run **after** that assignment, or it would read (and fit around) whatever the canvas's original HTML-attribute fallback values were, not what the game itself actually chose. Both `game.js` and `scale.js` are loaded `<script defer>`, with `scale.js`'s tag listed *after* `game.js`'s — deferred scripts execute in document order, so this guarantees `game.js`'s own synchronous `breakout.start()` call (and the `init()` it runs, including the canvas sizing) has already completed before `scale.js` ever reads `canvas.width`/`canvas.height`.

`defer` itself is required for the same reason it was for `html5-snake`: `game.js`'s own top-level code calls `document.getElementById("game-canvas")` synchronously (inside `init()`, called by the top-level `breakout.start()`), so without `defer`, `camila_add_js()` not guaranteeing script-tag position relative to the `#app`/canvas markup could throw the same "canvas element not found" class of error `html5-snake` hit live before `defer` was added there.

## Why fullscreen

Same as every other game here: requested to match the established pattern, not because anything in this game's own layout demanded full viewport ownership.

## No separate bootstrap file needed, unlike html5-space-invaders

`game.js`'s own last line is `breakout.start();`, inside the same file, at its own top level — the game starts itself the moment the script runs; there's no separate "construct and start" call upstream's own `index.html` had to make afterward the way `html5-space-invaders`' did. One fewer file than that integration needed.

## Local modifications

| File | What, and why |
|---|---|
| `game.js` | **The first vendored-logic edit in this plugin** — every other game so far kept `game.js`/equivalent byte-for-byte identical to upstream. Requested live: upstream's own `endGame()` (reached after every ball is lost) never draws any "GAME OVER" text and never offers a way back to the welcome scene — `courtScene` was written to be entered exactly once per page load, with reloading the page as the only way to play again. Three additive changes, all confined to `courtScene`, none altering how the game is actually played: (1) a `KEY_ENTER` constant; (2) `draw()` now shows a "GAME OVER" / "Press [enter] to return to the menu" overlay once `ball.endGameMode` is true (set by upstream's own `endGame()`, untouched); (3) `onKeyUp()` now returns to `welcomeScene` on Enter, but only while `ball.endGameMode` is true — same `setScene(...)`-on-keyup pattern `welcomeScene`'s own transition into `courtScene` already used, so no new mechanism was introduced, just a symmetric use of an existing one. See "Returning to the welcome scene: the state-leak this actually required fixing" below for the one non-trivial part of this change. |
| `styles.css` | Both originally-bare selectors (`body`, `canvas`) scoped under `:where(#app)` — same reasoning and technique every other game in this plugin uses for the identical problem. |
| `scale.js` (new file, not upstream) | CSS-fits the canvas to the viewport, after `game.js`'s own sizing has already run — see "Already the most self-contained game..." above. |

## Returning to the welcome scene: the state-leak this actually required fixing

Adding a path back to `welcomeScene` isn't just a draw call and a key handler — `courtScene.enter()` was never exercised a second time by upstream's own code (there was no way to trigger it twice), and it turns out not to have been written to support that. `playerScoreDigits`/`playerBricks` are populated with `.push()` onto arrays declared once, outside `enter()`, and never cleared — a second `enter()` call would push a fresh set of digits/bricks on top of the previous game's already-exhausted ones, and the fixed-index/fixed-count code that reads them (`playerScoreDigits[activePlayer][0..3]`, a `for (i < 112)` loop over `playerBricks[...]`) would keep reading the *first* (stale, from the previous game) set, never the newly pushed one — a second playthrough would show a blank brick field and the previous game's score. `playerScores`/`activePlayer`/`playerLevel`/`playerBallIndex` had the same problem, just without the array-growth symptom (they'd simply carry their final value into the next game). `courtScene.enter()` now resets all five to their initial values before rebuilding anything, making it safe to re-enter — `ball` and `paddle` didn't need this fix, both are unconditionally reassigned to a `new Ball(...)`/`new Paddle(...)` already, on every `enter()` call, upstream's own code, untouched.

**Not vendored from upstream**: `Screenshots/` (README illustrations, not used by the game itself) — not needed to run the game.

## State shape

None. No `localStorage` (confirmed by reading `game.js`) — the in-session high score shown on the welcome scene resets on reload, same as every other vendored game in this plugin.

## Tables involved

None. No `WorkTableClient` calls — no server interaction of any kind, and no PHP mount file injects `window.APP_CONFIG`/`window.I18N` for it (there's nothing for either to configure).

## License

html5-breakout ships under the **MIT license**, same permissive family as `react-simple-snake`, `html5-snake`, and `html5-space-invaders` — unlike Hextris's GPL-3.0. No compatibility question to resolve. Reproduced verbatim into `games/html5-breakout/LICENSE`, including its own blank copyright-holder line exactly as upstream shipped it (same template the author used for `html5-space-invaders`' own `LICENSE`).

## Other technical notes

- **No CDN, no external calls at runtime, verified**: nothing in `game.js`/`styles.css`/upstream's own `index.html` ever references an external URL or any local asset file (confirmed by reading `game.js` directly — no `XMLHttpRequest`, `fetch`, hardcoded `http(s)://` calls, `new Image()`, or `.src` assignment of any kind, anywhere).
- **No i18n of its own**: this game renders no HTML text at all — every UI element is drawn directly on the canvas by `game.js` itself. The Home tile's `html5breakout.title`/`html5breakout.mission` are entirely owned by the tile.
- **One or two players, turn-based**: a feature of upstream itself (see its own `README.md`), not something added or altered here.
