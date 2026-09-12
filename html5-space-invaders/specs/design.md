# Space Invaders (html5-space-invaders) — design

## Structure

Single view, no wizard steps, no framework. `games/html5-space-invaders/` vendors [html5-space-invaders](https://github.com/toivjon/html5-space-invaders) (MIT, archived by its own author) — a single `<canvas>`, a single plain script (`game.js`, 2417 lines, one global namespace `SpaceInvaders`), one sprite sheet PNG, no bundler, no other vendored library. Fullscreen takeover in the Camila-hosted tab, same `#app{position:fixed;inset:0;z-index:9999}` mechanism every other game in this plugin already uses — centered via flexbox around the canvas, which is CSS-scaled (not resized) to ~90% of the viewport, preserving its native 672:768 aspect ratio.

```
┌──────────────────────────────────────────┐  <- browser viewport:
│   ┌────────────────────────────────────┐ │     #app is position:fixed; inset:0
│   │            SCORE<1>  HI-SCORE       │ │     while this dashboard tab is open;
│   │                                     │ │     canvas.width/height attributes stay
│   │        👾 👾 👾 👾 👾 👾            │ │     672x768 always (game.js's own
│   │        👾 👾 👾 👾 👾 👾            │ │     coordinate math assumes that), only
│   │                                     │ │     the canvas's CSS width/height (its
│   │       ▓▓▓  ▓▓▓  ▓▓▓  ▓▓▓            │ │     on-page display size) scales
│   │                                     │ │
│   │              🚀                     │ │
│   └────────────────────────────────────┘ │
└──────────────────────────────────────────┘
```

## Why CSS scaling, not canvas resizing (unlike html5-snake)

This plugin's other Snake game (`html5-snake`) resizes the canvas's `width`/`height` *attributes* at load time, because that game's `game.js` recomputes every position (`snake.size`, food placement, collision bounds) from `canvas.width`/`canvas.height` directly — see `specs/html5-snake/design.md`. This game's `game.js` does the opposite: it hardcodes absolute pixel positions throughout — `672`, `768`, `672 / 2`, `768 / 2`, `672 - 43`, `672 - 130`, and more (grep the literal numbers) — assuming a fixed 672×768 coordinate space, never reading `canvas.width`/`canvas.height` to derive a position anywhere. Changing the canvas *attributes* here would desync every one of those hardcoded positions from the actual drawing buffer and visibly break the game (aliens, shields, and UI text drawn as if the board were still 672×768, on a buffer that no longer is).

The correct technique for this specific game is the standard "canvas resolution vs. display size" split: leave `canvas.width`/`canvas.height` (the drawing-buffer resolution `game.js`'s coordinate math assumes) at their upstream values, and instead set the canvas element's **CSS** `width`/`height` (its on-page rendered size) — the browser scales the whole buffer uniformly to fit, which preserves every relative position exactly since the internal coordinate space never changes. `games/html5-space-invaders/scale.js` does exactly this: computes a size that's ~90% of the viewport, capped by whichever of width/height is the tighter constraint, keeping the canvas's own native 672:768 ratio (`canvas.width / canvas.height`, not a hardcoded literal, so it stays correct even if a future upstream version changes those defaults).

Loaded as an external `<script defer>`, same reasoning as `html5-snake`'s own `size.js`: an inline script at the canvas's own parse position would run synchronously, immediately — deferring instead guarantees it runs after the whole document has parsed, without needing to reason about exact tag placement.

## Why fullscreen

Same as every other game here: requested to match the established pattern, not because anything in this game's own layout demanded full viewport ownership (a boxed placement would have worked exactly as well, size-wise — CSS scaling doesn't care about its container being fullscreen vs. boxed).

## The sprite-sheet path problem, and how it's actually solved

`game.js`'s `init()` does `spriteSheet.src = "space_invaders_spritesheet.png"` — a plain relative URL. Per spec, a classic script's string-literal `.src` assignment always resolves against the **current page's URL** (Camila's own dashboard URL, e.g. `.../app/librearcade/cf_worktableN.php?dashboard=html5-space-invaders`), never against the script file's own location. Loaded as a normal external `<script src="games/html5-space-invaders/game.js">`, that reference would 404 in the Camila-hosted tab — it's only correct in the standalone `index.html` case, where the page itself *is* `games/html5-space-invaders/index.html` and the two happen to coincide.

Three options were considered:

1. **A `<base href>` tag** pointing at `games/html5-space-invaders/` — rejected: `<base>` is document-wide, not scopable to one game's markup, and would silently break every *other* relative reference already on the same Camila page (its own JS/CSS, other plugins' assets).
2. **An iframe**, so the game's own document naturally has the right base URL and every upstream file (including `game.js`) could be used 100% unmodified — rejected on the same grounds `dashboard-hextris.inc.php` already rejected it for this plugin (see that file's own comment); not repeated here.
3. **Rewrite the one known path reference, server-side, at print time** — the approach taken, and the same technique `dashboard-hextris.inc.php` already uses for its own `src="..."` attributes in extracted HTML markup (see that file), just applied to a JS string literal instead of an HTML attribute: `dashboard-html5-space-invaders.inc.php` reads `game.js`'s content, does one `str_replace('"space_invaders_spritesheet.png"', '"plugins/libre-arcade/games/html5-space-invaders/space_invaders_spritesheet.png"', ...)` (the exact literal is unique in the file, confirmed), and prints the rewritten content inline as a `<script>` block instead of loading it via an external `src`. **The on-disk vendored `games/html5-space-invaders/game.js` is never touched** — this rewrite only ever exists in the string PHP builds and prints per request; the standalone `index.html` continues to load the real, unmodified file via a normal external `<script defer src="game.js">`, where the relative path already resolves correctly on its own.

`game.js`'s top-level code (namespace and constructor definitions only — confirmed by reading it: no DOM access happens until `Game.prototype.init()` is actually called later) runs synchronously wherever this inline block sits in the page, so no ordering concern exists between it and the canvas markup around it.

## Why a separate `bootstrap.js` instead of upstream's own inline starter

Upstream's own `index.html` starts the game with a second, plain inline `<script>` right after `game.js`'s own tag:

```html
<script src="game.js"></script>
<script>
  var spaceInvaders = new SpaceInvaders.Game();
  spaceInvaders.start();
</script>
```

That works there because an un-deferred inline script runs synchronously, immediately after the classic `game.js` tag right before it. This plugin instead needs `game.js`'s own execution to happen via the inline, path-rewritten block described above (still synchronous, so the ordering guarantee is preserved) — but the *starter* code was moved into its own small local file, `games/html5-space-invaders/bootstrap.js`, loaded `<script defer src="...">`, listed after `scale.js`'s own tag. It doesn't strictly need to run after `scale.js` (the two don't interact), but it does need to run after `game.js` has already defined `window.SpaceInvaders` — guaranteed because deferred scripts only execute after the entire document has finished parsing, which is necessarily after the earlier synchronous inline `game.js` block has already run during that same parse.

## Local modifications

`game.js` on disk is byte-for-byte identical to upstream — the sprite-sheet path fix is a print-time rewrite in the PHP mount file only, not a file edit (see above).

| File | What, and why |
|---|---|
| `styles.css` | Both originally-bare selectors (`body`, `canvas`) scoped under `:where(#app)` — same reasoning and technique `specs/hextris/design.md` and `specs/html5-snake/design.md` document for the identical problem in those games. |
| `scale.js` (new file, not upstream) | CSS-scales the canvas to the viewport — see "Why CSS scaling..." above. |
| `bootstrap.js` (new file, not upstream) | Starts the game (`new SpaceInvaders.Game(); .start();`) as a deferred external script instead of upstream's own un-deferred inline one — see "Why a separate bootstrap.js..." above. |
| `dashboard-html5-space-invaders.inc.php` (Camila mount only) | Prints `game.js`'s content inline with its one sprite-sheet path literal rewritten — see "The sprite-sheet path problem..." above. Does not affect the vendored file on disk or the standalone `index.html`. |

**Not vendored from upstream**: `tests.html` (a dev-only unit-test harness, not a runtime dependency) and `Screenshots/` (README illustrations, not used by the game itself) — neither is needed to run the game, consistent with how this plugin vendors only what a game actually needs at runtime.

## State shape

None. This game keeps no state outside its own running JS objects and does not use `localStorage` — like `html5-snake`, upstream never implemented a persisted high score (the in-session "HI-SCORE" shown on the welcome scene resets on reload).

## Tables involved

None. No `WorkTableClient` calls — this game has no server interaction of any kind, and no PHP mount file injects `window.APP_CONFIG`/`window.I18N` for it (there's nothing for either to configure).

## License

html5-space-invaders ships under the **MIT license** — same permissive family as `react-simple-snake` and `html5-snake`, unlike Hextris's GPL-3.0. No compatibility question to resolve. Reproduced verbatim into `games/html5-space-invaders/LICENSE`, including its own blank copyright-holder line exactly as upstream shipped it.

## Other technical notes

- **No CDN, no external calls at runtime, verified**: nothing in `game.js`/`styles.css`/upstream's own `index.html` ever references an external URL (confirmed by reading `game.js` directly — no `XMLHttpRequest`, `fetch`, or hardcoded `http(s)://` calls anywhere, aside from one comment linking to a reference doc, which is not a network call).
- **No i18n of its own**: this game renders no HTML text at all — every UI element (menus, score, "game over", instructions) is drawn directly on the canvas by `game.js` itself. The Home tile's `html5spaceinvaders.title`/`html5spaceinvaders.mission` are entirely owned by the tile.
- **One or two players, turn-based**: a feature of upstream itself (see its own `README.md`), not something added or altered here — the welcome scene's own on-canvas menu lets the player choose.
