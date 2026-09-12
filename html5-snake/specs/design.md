# Snake Classic (html5-snake) — design

## Structure

Single view, no wizard steps, no framework of any kind. `games/html5-snake/` vendors [html5-snake](https://github.com/JDStraughan/html5-snake) (MIT) — a single `<canvas>`, a single plain script (`game.js`), no bundler, no build step, no other vendored library (not even jQuery). `game.js` itself is the simplest integration in this plugin by a wide margin; the one thing added locally is a small sizing script (`size.js`, see below). Fullscreen takeover in the Camila-hosted tab (requested live, "anche questo a fullscreen per iniziare"), same `#app{position:fixed;inset:0;z-index:9999}` mechanism `dashboard-hextris.inc.php` and `dashboard-react-simple-snake.inc.php`'s `#snake-backdrop` both already established — centered via flexbox around the canvas, which is now sized to the viewport (see below), not the game's original fixed 320×240.

```
┌──────────────────────────────────────────┐  <- browser viewport:
│  ┌──────────────────────────────────────┐│     #app is position:fixed; inset:0
│  │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ ││     while this dashboard tab is open;
│  │ ▓▓▓🟩🟩🟩🟩▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ ││     canvas ~80% of viewport, 4:3,
│  │ ▓▓▓▓▓▓▓▓▓▓🟦▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ ││     grid-aligned to 40px tiles
│  │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓215▓▓▓▓▓ ││
│  └──────────────────────────────────────┘│
└──────────────────────────────────────────┘
```

## Why fullscreen, and why sizing turned out to not be the easy case after all

Unlike hextris (canvas explicitly sized off `window` from the start) or react-simple-snake (chasing a responsive `percentageWidth` through Bulma's own box model — see `specs/react-simple-snake/design.md`), this game's `<canvas width="320" height="240">` shipped as a **hardcoded, fixed size in the markup itself** — confirmed by reading `game.js` directly: every position/collision calculation derives from `canvas.width`/`canvas.height`, read once at module-load time and never recomputed from any container or window dimension. Fullscreen was originally added here purely as a presentation choice (matching the other two games' own takeover, requested live), not a fix for anything — until actually seeing a fixed 320×240 board centered in an otherwise-empty fullscreen viewport made it read as tiny ("è minuscolo"). That was first just enlarged to a fixed 640×480, then replaced with viewport-based dynamic sizing entirely (requested live, "non posso calcolare le dimensioni a partire dalla dimensione della finestra? basta mantenere aspect ratio") — see `size.js` and its own header comment for the resulting logic (canvas ≈80% of the viewport, capped by whichever of width/height is the tighter constraint, `COLS` forced to a multiple of 4 so both dimensions land on exact multiples of the 40px tile `snake.size` derives from, same "grid-alignment" lesson `specs/react-simple-snake/design.md` documents for a similar bug there).

`size.js` is loaded as its own external `<script defer>`, with its tag placed before `game.js`'s — not as an inline script run synchronously at its own position in the markup, which is how this was first written. That first version worked when actually screenshotted in a real browser, but produced a suspicious `160×120` (the hardcoded `Math.max(4, ...)` floor) against a real `1280×720` window when checked in this project's own local browser-preview tool. Investigating traced that specific `160×120` reading to the tool itself, not the sizing code: `window.innerWidth`/`innerHeight` read `0` in that tool whenever its Browser pane isn't actually displayed/composited (confirmed via its own `screenshot` command erroring with exactly that explanation) — a pre-existing, documented quirk of this local tool, unrelated to how any real browser tab behaves. The inline-vs-deferred-external change was kept anyway on its own merits: it matches the same `defer`-for-classic-scripts pattern already established for `game.js` itself (see `dashboard-html5-snake.inc.php`'s own comment on why that was needed), and removes a synchronous inline script that had to be positioned just so relative to the `<canvas>` tag. Whether the dynamic sizing itself renders correctly end-to-end still wants confirming in a real, visible browser tab (standalone `index.html`, or the Camila-hosted dashboard) rather than trusting this local tool's own numbers.

## Local modifications

`game.js` itself is completely untouched:

| File | What, and why |
|---|---|
| `index.html` (`<head>`) | Removed a dead IE-conditional `<script src="http://html5shiv.googlecode.com/svn/trunk/html5.js">` — Google Code shut down in 2016, the domain no longer resolves, and this plugin already requires a modern browser (Chrome/Edge) everywhere else. No CDN reference of any kind remains. |
| `page.css` | Every originally-bare selector (`body`, `h1`, `p`, `canvas`) scoped under `:where(#app)` — same reasoning and same `:where()`-not-plain-`#app` technique `specs/hextris/design.md` documents for the identical problem there (an ID-selector-scoped rule would carry more specificity than upstream's own bare selectors ever had, risking silently outranking some other rule). `h1`/`p` rules themselves were dropped rather than scoped — this integration doesn't render the page's original title/instructions/credits text at all (see below), so there's nothing left for those two rules to style. |
| `size.js` (new file, not upstream) | Sizes the canvas from the viewport instead of upstream's own hardcoded 320×240 — see "Why fullscreen..." above for the full history and reasoning. Loaded via `<script defer>`, before `game.js`'s own tag. |

**Not modified**: `game.js` — byte-for-byte identical to upstream.

## What's NOT carried over from upstream's own `index.html`

Upstream's page includes a title (`<h1>html5-snake</h1>`), a one-line description, playing instructions, and an author/source credit line, all as visible page text around the canvas. None of that is rendered here — the tab bar (`conf/menu.xml`) and Home tile already name the game, this plugin's own `specs/*/use-case.md` files are where "how to play" documentation belongs for every game here (not on-page text), and author credit lives in `CREDITS.md` instead, matching every other vendored game in this plugin. This is a presentation choice consistent with how this plugin handles every vendored game's own promotional/descriptive chrome, not a removal of anything functional.

## State shape

None. This game keeps no state outside its own running JS (`game`/`snake`/`food` objects, entirely in-memory) and does not use `localStorage` at all — unlike hextris/react-simple-snake, there is no persisted high score here; upstream never implemented one.

## Tables involved

None. No `WorkTableClient` calls — this game has no server interaction of any kind, and no PHP mount file injects `window.APP_CONFIG`/`window.I18N` for it (there's nothing for either to configure — see `dashboard-html5-snake.inc.php`'s own comment).

## License

html5-snake ships under the **MIT license** — same permissive family as react-simple-snake and this plugin's own code, unlike Hextris's GPL-3.0. No compatibility question to resolve. Upstream has no separate `LICENSE` file; the license text lives inline in its `README.md`, reproduced verbatim into `games/html5-snake/LICENSE` here.

## Other technical notes

- **No CDN, no external calls at runtime, verified**: the only external reference anywhere in the original repo was the removed IE/html5shiv `<script>` tag (see "Local modifications" above); nothing else in `game.js`/`page.css`/upstream's own `index.html` ever referenced an external URL.
- **No i18n of its own**: this game renders no text at all beyond the score number drawn directly on the canvas (`context.fillText(game.score, ...)`) — there is nothing to translate even in principle. The Home tile's `html5snake.title`/`html5snake.mission` are entirely owned by the tile.
- **Gameplay differs from react-simple-snake on purpose, not by integration accident**: this game ends on wall contact (`isCollision()` checks `x < 0 || x > canvas.width || y < 0 || y > canvas.height`, no wrap-around); react-simple-snake's own vendored logic wraps the snake around every edge instead. Both are faithful to their respective upstream projects' own original design — not something to "fix" into consistency with each other.
