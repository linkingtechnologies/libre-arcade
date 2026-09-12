# Snake (react-simple-snake) — design

## Structure

Single view, no wizard steps. `games/react-simple-snake/` vendors [react-simple-snake](https://github.com/MaelDrapier/react-simple-snake) (MIT), a React component library — the one game in this plugin that uses React, an explicit, requested exception to AGENTS.md's "no React" rule (see `AGENTS.md`'s own "Exception — react-simple-snake" note). **Fullscreen takeover in the Camila-hosted tab** (changed live from an initial boxed-tile attempt — see "Sizing and Bulma collisions" below for why), same `#app{position:fixed;inset:0;z-index:9999}` mechanism `dashboard-hextris.inc.php` established, just centered via flexbox around a fixed-size board instead of filling the viewport with a canvas. The standalone `index.html` stays a plain centered box — no Bulma there to collide with, nothing to escape.

```
┌──────────────────────────────────────────┐  <- browser viewport, not a content box:
│                                            │     #snake-backdrop is position:fixed;
│         HIGH-SCORE: 12   SCORE: 4         │     inset:0 while this dashboard tab is
│      ┌──────────────────────────┐        │     open — Camila's own tab bar sits
│      │ ░░░░░░░░░░░░░░░░░░░░░░░░ │        │     behind it, not visible during play
│      │ ░░░░░░░░🟩🟩🟩🟩🍎░░░░░░ │        │     (same as Hextris's own fullscreen
│      │ ░░░░░░░░░░░░░░░░░░░░░░░░ │        │     takeover)
│      └──────────────────────────┘        │
│                                            │
└──────────────────────────────────────────┘
```

## Why a hand-wrapped CJS shim, not a straight ESM vendor copy

Every other vendored JS library in this plugin (`games/grugnetto-go/vendor/lit-html-*.js`, `games/hextris/vendor/react.esm.js` — wait, that one's this game's own — see below) is either upstream's own ESM build, or a CDN `+esm`-transformed static copy (the pattern `games/grugnetto-go/vendor/melonjs-*.esm.js` and this game's own `vendor/react.esm.js`/`vendor/react-dom.esm.js`/`vendor/object-assign.esm.js`/`vendor/scheduler.esm.js` all follow — fetched once from jsDelivr's `+esm` endpoint, then had every cross-package `/npm/<pkg>@<version>/+esm` import specifier rewritten to a local relative filename, so nothing is fetched from a CDN at runtime).

`vendor/react-simple-snake.esm.js` couldn't follow that same pattern: the package itself ships only a CommonJS/webpack bundle (`lib/snake.js`, built via `npm run build:lib` before publish — confirmed via its own `package.json`'s `main`/`prepack` fields), no ESM or UMD build of its own. jsDelivr's `+esm` auto-conversion, which worked cleanly for react/react-dom/object-assign/scheduler, produces a genuinely broken result for this specific package — verified live (`curl` against `https://cdn.jsdelivr.net/npm/react-simple-snake@0.2.2/+esm`, `Content-Length` matches bytes received so it isn't a network truncation, but the response has no top-level `export` statement anywhere in it, checked with a precise substring search, not just a fooled-by-line-wrapping `grep`). Likely cause: Rollup's static CJS-to-ESM interop can't cleanly analyze this package's own `module.exports=(()=>{...})()` immediately-invoked-function shape.

Fix: vendor the npm-published `lib/snake.js` byte-for-byte (fetched via the plain npm registry tarball, `registry.npmjs.org/react-simple-snake/-/react-simple-snake-0.2.2.tgz` — not built locally; this project has no Node/npm available to run `webpack` itself), and wrap it in the smallest possible CJS shim: a local `module`/`require` pair defined right above the pasted-in bundle, where `require("react")` resolves to the already-imported `react.esm.js`'s own default export, and a final `export default` pulls `module.exports.default` back out as a real ES export. See `vendor/react-simple-snake.esm.js`'s own header comment for the exact reasoning, inline. The library's source (`src/SnakeGame.jsx`/`src/GameOver.jsx`/`src/SnakeGame.css`) itself is not touched or re-vendored anywhere — only its own already-compiled, already-published output is.

## Sizing and Bulma collisions (three real bugs, found live, in sequence)

`react-simple-snake`'s own `<Snake percentageWidth={n} />` sizes itself once, synchronously, inside `componentDidMount`, by reading `document.getElementById("GameBoard").parentElement.offsetWidth`, forcing that down to the nearest lower multiple of 30, then deriving `blockWidth`/`blockHeight`/starting positions from it — no resize listener, no retry, no recomputation after the fact, confirmed by reading the vendored bundle directly. Three separate problems fell out of this, discovered one at a time as each was fixed and the next became visible:

1. **Mount-timing race.** Mounting immediately on module execution can land before the browser has committed a layout pass for a freshly loaded page; when it does, that one `offsetWidth` read comes back near-zero, and the component permanently clamps itself to its own hardcoded 30×20px minimum-size fallback for the rest of the session — read as "the snake exits the board" (the block grid's own math assumes the real, larger computed size). Confirmed live: re-invoking the mounted instance's own `initGame()` after the page had settled recomputed the correct size every time — purely about what `offsetWidth` read at that one mount-time call. **Fix, in `app.js`:** poll `root.offsetWidth` (bounded retries, `setTimeout` between each) and only call `ReactDOM.render(...)` once it reports a real, nonzero value — not a single blind deferral (a fixed one-macrotask `setTimeout(fn, 0)` was tried first and fixed this in isolation, but was still a guess at how long Camila's own page — stylesheets/tab bar/other chrome all loading and reflowing at once — takes to stabilize; polling removes the guesswork). `requestAnimationFrame` was tried before that and rejected separately: confirmed live it never fires at all in a backgrounded/non-composited browser tab (this project's own browser-preview tooling doesn't composite frames for an unfocused pane) — `setTimeout` has no such dependency, which is why the retry loop uses it too, not rAF.

2. **Floating-point drift from a non-multiple-of-30 container width.** Even once mount timing was fixed, a `percentageWidth`-of-a-Bulma-`.box`'s-actual-rendered-width is essentially never an exact multiple of 30 in practice (Bulma's own responsive `.container`/`.box` width depends on viewport size). `blockWidth` then comes out as a repeating/imprecise floating-point value, and since every subsequent tick ACCUMULATES position by adding/subtracting that one imprecise value rather than recomputing fresh, the error compounds over enough moves until a segment's position drifts outside `[0, width)` — read as the snake or apple sitting visibly outside the board after playing for a bit. This plugin's own standalone `index.html` (a plain, fixed 640px parent — an exact multiple of 30) never showed it. **Fix:** give the mount point an explicit, fixed pixel width that IS an exact multiple of 30 (360px), and pass `percentageWidth={100}` so the component's own math has nothing left to compute an imprecise fraction of.

3. **Bulma's global `box-sizing: border-box` reset, inherited straight through.** The actual root cause behind what looked like the same "leaves the board" symptom even after (2) was fixed: Bulma sets `*, *::before, *::after { box-sizing: inherit }` and `html { box-sizing: border-box }` — inherited by every element in the page's DOM regardless of position or z-index, including `#GameBoard` itself (rendered by the vendored component). `#GameBoard`'s own `render()` sets an explicit `border-width` (`width/50`, 7.2px at 360px) alongside its `width`/`height` — under `border-box`, that border is carved OUT of the 360×240 already accounted for, shrinking the *actual* content area below what every position calculation assumes, so blocks computed to sit near the edge render outside the visibly smaller real box. The standalone page never loads Bulma, so it never hit this either — confirmed live as the real culprit once box-sizing specifically was singled out and checked, distinct from (2)'s drift (a real, separate issue, but not what was actually still showing after (2) alone was fixed). **Fix, in `dashboard-react-simple-snake.inc.php`:** force `box-sizing: content-box` back on `#GameBoard` and its descendants, restoring the box model the component's own math was written against regardless of what the surrounding page sets globally.

A fourth thing was tried and reverted along the way: `overflow: hidden` on `#GameBoard`, meant to visually clip the brief (one-tick) out-of-bounds render some other library-internal state transitions can still cause. Rejected — `#GameBoard #Score` (the HIGH-SCORE/SCORE text) is positioned via `position: relative; top: 105%`, deliberately placed *below* the board's own box by design; `overflow: hidden` on the parent clips that too, indiscriminately (reported live as the score disappearing). Not reinstated — accepted as a very brief, cosmetic-only artifact of the wrap-around transition, same as the library ships upstream, not something to chase further at the cost of the score display.

## State shape

None owned by this integration or exposed to it — the vendored component manages 100% of its own React state internally (snake position, direction, score, colors, etc.), never surfaced outside itself. The only persistence is the component's own `localStorage.getItem/setItem("snakeHighScore", ...)`, called directly from inside the vendored bundle — not routed through any wrapper of ours.

## Tables involved

None. No `WorkTableClient` calls anywhere in this integration — see `app.js`'s own header comment for why one isn't even initialized (per AGENTS.md's SPA Entry Point rules, a purely local game doesn't need one at all).

## License

react-simple-snake ships under the **MIT license** (`games/react-simple-snake/LICENSE`) — same permissive family as most of this plugin's other vendored dependencies (2048's own MIT, grugnetto-go's vendored libraries), unlike Hextris's GPL-3.0. No compatibility question to resolve here.

## Local modifications

| File | What, and why |
|---|---|
| `app.js` | Not upstream at all — this plugin's own entry point (see AGENTS.md's Manual Mount Pattern). Mounts with a `setTimeout(fn, 0)` deferral — see "Sizing" above. |
| `vendor/react-simple-snake.esm.js` | Upstream's own published `lib/snake.js`, byte-for-byte, wrapped in a minimal CJS shim (`module`/`require` locals + a final `export default`) — see "Why a hand-wrapped CJS shim" above. The wrapped payload itself is unmodified. |
| `vendor/react.esm.js`, `vendor/react-dom.esm.js`, `vendor/object-assign.esm.js`, `vendor/scheduler.esm.js` | jsDelivr `+esm` output, fetched once and vendored — cross-package `/npm/...` import specifiers rewritten to local relative filenames only (same "no CDN at runtime" pattern `games/grugnetto-go/vendor/melonjs-*.esm.js` already established in this plugin) — otherwise byte-identical to what jsDelivr served. |

**Not modified**: nothing else — there is no other JS/CSS in this game; the component injects its own already-scoped CSS (`#GameBoard`-prefixed, see `specs/react-simple-snake/design.md`'s "Other technical notes") at runtime via the same style-loader mechanism the original webpack build baked in.

## Other technical notes

- **No CDN, no external calls at runtime, verified**: every `import` specifier across every vendored file resolves to a local relative path — grepped after the fact to confirm no `/npm/`, `http://`, or `https://` string remains anywhere except harmless jsDelivr provenance comments (`* Original file: /npm/react@17.0.2/index.js`, etc.) at the top of each `+esm`-derived file.
- **No CSS scoping fixes needed, unlike Hextris/2048**: react-simple-snake's own CSS (bundled into `vendor/react-simple-snake.esm.js`, injected into `<head>` at runtime via a `style-loader`-style helper also bundled in) is already fully scoped — every rule is `#GameBoard ...` or `#GameBoard #SomeChild ...`, never a bare `body`/`a`/`button`/`*`. Checked directly in the bundled source before deciding no `:where(#app)`-style rewrite was needed.
- **No i18n of its own**: this game's UI (`HIGH-SCORE`, `SCORE`, `GAME OVER`, `Press Space to restart`) stays English-only, unmodified — same stance as Hextris's own vendored UI text (see `specs/hextris/design.md`). The Home tile's `reactsimplesnake.title`/`reactsimplesnake.mission` are owned by the tile, not borrowed from the game.
- **No standalone-page language switcher, no fullscreen toggle, no touch controls** — unlike grugnetto-go's own `games/grugnetto-go/index.html`, this game has none of those features to expose either way; its standalone `index.html` is deliberately minimal (see that file's own comment).
