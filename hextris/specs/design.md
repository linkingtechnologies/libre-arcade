# Hextris — design

## Structure

Single view, no wizard steps, no lit-html involvement. `games/hextris/` is [Hextris](https://github.com/Hextris/hextris) (GNU GPL-3.0 — see "License" below), vendored with the local modifications listed in this file. Fullscreen takeover, not a boxed tile — see "Why fullscreen, not boxed" below.

```
┌──────────────────────────────────────────┐  <- browser viewport, not a content box:
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │     #app is position:fixed; inset:0 while
│ ▓▓▓▓▓▓▓▓▓▓▓▓ #canvas (hex board) ▓▓▓▓▓▓▓▓ │     this dashboard tab is open — Camila's own
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │     tab bar sits behind it, not visible during
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │     play (upstream's own design, not something
└──────────────────────────────────────────┘     this integration added)
```

## Why fullscreen, not boxed

Unlike `games/grugnetto-go/` (built by us, deliberately sized to sit inside a bounded content box — see its own `#grugnetto-go-wrapper`'s `aspect-ratio`/`calc(100vh - 100px)` rules), Hextris assumes it owns the whole browser viewport, pervasively:

- `js/main.js`: `canvas.width = $(window).width(); canvas.height = $(window).height();` — the canvas is sized off the window, not a container element, and `settings.scale` (used throughout the game's own physics/hit-testing) is derived from that same window-relative size.
- `style/style.css`: `#helpScreen`, `#openSideBar`, `#pauseBtn`, `#restartBtn`, `#gameoverscreen`'s children etc. are `position:fixed`/`position:absolute` anchored with `top:0`/`left:0`/`right:0`/`bottom:0`/`50%`-of-viewport offsets throughout — a genuinely viewport-relative layout system, not a handful of isolated rules.

Making this sit inside a small tile like grugnetto-go would mean rewriting the canvas-sizing JS to read a container element instead of `window`, and reworking every fixed/absolute rule to be container-relative instead of viewport-relative — a deep rewrite of vendored logic the game's own scoring/collision math depends on (real regression risk), not a scoping exercise. Decided live: keep it fullscreen, exactly as upstream, and only fix what would otherwise leak into or break the surrounding Camila page (see "Local modifications" below). Confirmed safe: nothing in Camila's own page CSS (`camila/css/*.css`) sets `transform`/modern `filter`/`contain`/`will-change:transform` on any ancestor, so Hextris's `position:fixed` elements genuinely anchor to the real browser viewport as designed, with no surprise containment.

## Standalone / Camila-hosted duality

`games/hextris/index.html` is the single source of truth for both contexts, same pattern as `games/grugnetto-go/index.html` — but a different mechanism, because Hextris has no ES-module entry point to `import()` the way `grugnetto-go/app.js` does (see "Local modifications" for why: it's classic, non-module `<script src>` tags in global scope, reading fixed DOM ids already present in the page).

`../../dashboard-hextris.inc.php` reads `games/hextris/index.html` at request time, extracts everything between that file's own `<!-- APP-CONTENT-START -->`/`<!-- APP-CONTENT-END -->` HTML comments (the `<div id="app">` fragment — markup + the full `<script src="...">` list, verbatim), rewrites every relative `src="..."` in that fragment to resolve against `games/hextris/` instead of the Camila page's own URL (classic `<script src>`/`<img src>` resolve against the *page*, unlike an ES module's own relative imports), and prints the result into the page. One HTML fragment, one script list, no second copy to drift out of sync when `games/hextris/index.html` is updated. Do not rename the `#app` id or the two marker comments without updating the PHP extraction to match.

## State shape

None owned by this integration. Hextris's own vendored `js/save-state.js`/local `highscores` array persist state via `localStorage` under upstream's own, unprefixed key names — not renamed here (vendor unmodified except where actually necessary, see "Local modifications"). `localStorage` is scoped per-origin, not per-path, so these keys sit in the same store as every other same-origin page including the rest of this Camila app and any other vendored game; a future game using the exact same bare key names would collide. Accepted risk, not preemptively fixed — flag it if it actually happens.

## Tables involved

None. No `WorkTableClient` calls anywhere in this integration or in the vendored game itself.

## License

Hextris ships under the **GNU GPL-3.0** (`games/hextris/LICENSE.md`) — a copyleft license, unlike `games/grugnetto-go`'s own code (ours). Decided live: the wider `librearcade` project itself will be published under GPL-3.0 on GitHub, which makes this a non-issue — a GPL-3.0 project including GPL-3.0 code is straightforwardly compatible, no "does it force the rest of the app open too" question to resolve. Before that publish actually happens, still worth a pass confirming every OTHER vendored dependency in this app (the camila-php-framework itself, and the PHP libraries under `nginx/html/vendor/` — adodb, mpdf, phpoffice, phpseclib, etc.) is GPL-3.0-compatible too (permissive licenses like MIT/BSD/Apache-2.0 generally are; anything LGPL or more restrictive needs a closer look) — not specific to this game, but this is the reason the question came up.

## Local modifications

Every change from upstream Hextris, and why — kept to the minimum needed to (a) run safely embedded in this plugin, (b) make no calls to any third party. Everything not listed here is byte-identical to upstream.

**Removed outright (telemetry/ads/remote code execution — not a "scope it" fix, a straight deletion):**

| File | What was removed |
|---|---|
| `index.html` (`<head>`) | Google Fonts `<link>` (redundant anyway — `style/style.css` already self-hosts "Exo" via local `@font-face`, `style/fonts/Exo2-*.otf`), Google AdSense `<script data-ad-client=...>`, inline Google Analytics snippet, `apple-itunes-app` meta (triggers iOS's native "install this app" banner for the original mobile Hextris app), `manifest.webmanifest` link (PWA installability for the public site, not vendored/relevant here), all `og:*`/`twitter:*`/app-store applink meta (pointed at hextris.github.io and the original mobile apps — meaningless for this internal, non-public embedded copy) |
| `js/initialization.js` | A second, independent Google Analytics loader + `ga('create', 'UA-51272720-1', ...)`/`ga('send', 'pageview')` calls (different tracking ID than the one in `index.html` — upstream had two) |
| `js/main.js` | `$.get('http://54.183.184.126/' + String(score))` inside `checkGameOver()` — silently POSTed every final score to a raw third-party IP on every game over. Also: a dynamic `<script src="http://hextris.io/a.js">` injector — arbitrary remote code execution on every page load, regardless of what that script currently does |

**Removed outright (social/promotional, requested live — "togliamo i riferimenti ai social che tanto non sono più validi"):**

| File | What was removed |
|---|---|
| `index.html` (game-over screen) | The "SHARE MY SCORE!" Twitter-popup SVG button, the Facebook/Twitter `rrssb` share buttons + their Russian-locale (VK) variant inline script, and the Google Play/App Store badges — all pointed at the public hextris.github.io project/its mobile apps. `#buttonCont`, the wrapping div, is kept but now **deliberately empty** — not purely cosmetic scaffolding: `js/main.js`'s `setBottomContainer()`/`set_score_pos()` (both called from `scaleCanvas()`, i.e. every window resize) read `$("#buttonCont").offset().top` to vertically position `#bottomContainer`/`#container`; jQuery's `.offset()` returns `undefined` for a selector matching nothing, and `undefined.top` throws — found live, removing this div entirely crashed on the next resize |
| `style/rrssb.css`, `vendor/rrssb.min.js` | Deleted outright (files, not just references) — nothing loads them anymore once the buttons above were removed |
| `images/android.png`, `images/appstore.svg` | Deleted outright — the Play/App Store badge images, unreferenced once the badges markup was removed |
| `style/style.css` | `#socialShare`, `#androidBadge`, `#iOSBadge` rules deleted — dead CSS once their elements were removed from `index.html` |
| `dashboard-hextris.inc.php` | Stopped linking `style/rrssb.css` (deleted, see above) |

No CDN, no telemetry, no remote script loads, no promotional/social chrome anywhere in this integration — verified by re-grepping the vendored tree for `http(s)://`/bare-protocol references after making these changes; everything remaining is either a vendored local asset path, or an inert outbound link a user could click (the "By Logan Engstrom & Garrett Finucane" author credit in the help panel — kept, plain attribution rather than promotion) or a code comment/license URL.

**Scoped under `#app` (CSS collision risk, not telemetry) — `style/style.css`:**

Bare, page-global selectors that would otherwise restyle the surrounding Camila page, not just this game's own elements, once loaded unscoped into a shared DOM:

- `* { ... user-select:none; padding:0; margin:0; ... }` (two separate occurrences upstream) → `:where(#app) * { ... }`. The most dangerous one of all: unscoped, a universal `margin:0;padding:0;` reset would have wiped Bulma's own spacing on every component across the whole Camila page.
- `body { color; font-family; background-color; }` and a second `body { overflow:hidden; }` → merged onto `#app` itself, which also gets `position:fixed; inset:0; z-index:9999;` here — this is the actual fullscreen-takeover mechanism (see "Why fullscreen, not boxed" above), replacing what `<body>` ownership implicitly gave upstream's own standalone page.
- `a { color:#232323; }` → `:where(#app) a { ... }`.
- `button { ... }` / `button:focus { ... }` → `:where(#app) button { ... }` / `:where(#app) button:focus { ... }`.
- `.navbar` / `.navbar li` → **deleted entirely**, not scoped — grep confirms this class is dead CSS in upstream (no element in this game's HTML/JS ever gets `class="navbar"`), and it's also the single most dangerous name collision if left in: Bulma's own top navigation component in the surrounding Camila page is called exactly `.navbar` too.

**`:where(#app)`, not plain `#app`, on every one of those descendant rules — found live, the hard way:** a plain `#app *`/`#app a`/`#app button` carries an ID selector's specificity, which upstream's own bare `*`/`a`/`button` never had. That's a problem because several of upstream's own MORE SPECIFIC rules are *supposed* to win against those bare selectors — e.g. `.overlay`'s `margin-left:-50%` (its half of the classic `left:50%; margin-left:-50%` centering trick) needs to beat the universal reset's `margin:0`, and `#restart`'s own `left:calc(...)`/positioning needs to beat `button`'s styling. Scoped as plain `#app *`/`#app button`, the reset's ID-boosted specificity silently won instead — reported live as the pause overlay text rendering off-center to the right, and (relatedly, see below) the restart button and score box reading as misaligned. `:where(...)` always contributes **zero** specificity no matter what selector is inside it, so `:where(#app) *` still only ever matches inside `#app`, but no longer changes which upstream rule wins a cascade conflict — the exact specificity relationships upstream already relied on are preserved, just scoped.

Every other rule in `style/style.css` (the large majority — `#openSideBar`, `#pauseBtn`, `#helpScreen`, `#gameoverscreen` and everything else) is untouched: all ID-scoped or otherwise specific enough that upstream already only ever matched this game's own markup.

**One genuine layout fix, not a bug** — `#restart { left:calc(50% - 124px); ... }` → `left:50%`. The `-124px` offset was upstream's own layout, leaving room for the share-button row that used to sit to this button's right (see the removal above). With that row gone, the old offset just left the restart button sitting visibly off-center to the left (reported live as "anche... il tasto replay non sembrano allineati") — centering it outright is correct now that it's the only element left in `#bottomContainer`, not a workaround for something else.

**`HEXTRIS_BASE`, a local addition (not upstream) — `index.html` + `js/main.js`/`js/view.js`:** `main.js`/`view.js` set a few button icons (`#pauseBtn`, `#openSideBar`) at *runtime* via e.g. `$("#pauseBtn").attr('src', './images/btn_pause.svg')` — string literals inside separate `.js` files, which the PHP path-rewrite (see "Standalone / Camila-hosted duality" above) can't reach, since it only touches `src="..."` attributes physically present in the extracted HTML fragment. Printed into the Camila-hosted page verbatim, those literals resolved against the *page's* URL instead of `games/hextris/`, 404ing (reported live as `GET .../app/librearcade/images/btn_pause.svg 404`). Fixed by computing the real base **once**, in an inline `<script>` right after the `vendor/hammer.min.js` tag (`window.HEXTRIS_BASE = document.currentScript.previousElementSibling.src.replace(/vendor\/hammer\.min\.js$/, '')` — reads that script's own browser-resolved `.src`, correct in either context, no PHP rewrite involved), then prefixing all 10 call sites with it. The few call sites that *compare* the current `src` (e.g. `showHelp()`'s open/close toggle) were changed from exact string equality to `.endsWith('btn_back.svg')`-style filename checks instead of also duplicating `HEXTRIS_BASE` into the comparison — agnostic to whichever convention produced the current value (the PHP-rewritten initial markup vs. this JS-set one), so it can't drift out of sync the way two independent absolute-path constructions could.

**`js/initialization.js`: `$(window).unload(fn)` → `$(window).on('unload', fn)`** — needed once this game started sharing Camila's own jQuery (next point) instead of its vendored 1.9.1: `.unload(fn)` as an event-binding shorthand was removed in jQuery 3.0. `.on('unload', fn)` is the direct modern equivalent, identical behavior either way — this is the only jQuery-1.9-vs-3.7 API gap found in this game's own code (checked: no `.size()`, `.andSelf()`, `.live()`, `.die()`, `$.browser`, or similar removed/legacy APIs anywhere else in `js/*.js`).

**`vendor/jquery.js` (jQuery 1.9.1) is dropped when Camila-hosted, kept when standalone — `dashboard-hextris.inc.php`:** found live — Camila's own page already loads its own jQuery (3.7.1, `camila/js/jquery/jquery.min.js`) plus the `x-editable` plugin (`$.fn.editableform`) that `camila.js`'s own page-wide init relies on. A second, later `<script src="...vendor/jquery.js">` silently *replaces* `window.jQuery`/`$` with a fresh instance carrying no plugins, so by the time Camila's own `DOMContentLoaded`-triggered init ran, `$.fn.editableform` was gone — crashed as `Cannot set properties of undefined (setting 'buttons')` in `camila_instantedit2.js`. The PHP extraction now strips this game's own `vendor/jquery.js` `<script>` tag from the Camila-hosted fragment only (regex match on `src="vendor/jquery.js"`), so this game's scripts share Camila's 3.7.1 instead there; verified no other vendored Hextris lib (`hammer.min.js`, `keypress.min.js`, `js.cookie.js`, `jsonfn.min.js`, `sweet-alert.min.js`) registers a `jQuery.fn` plugin that could be lost the same way. The standalone `games/hextris/index.html` page (no Camila jQuery to reuse) is untouched — still loads its own bundled 1.9.1, unaffected by any of this.

**`vendor/` audited and cleaned up (requested live) — unused libraries removed, vulnerable ones upgraded:**

| File | Change | Why |
|---|---|---|
| `vendor/hammer.min.js` (Hammer.js 1.1.2) | **Deleted** | Grep confirmed zero references anywhere in this game's own code (no `Hammer`/swipe/pan usage) — pure dead weight |
| `vendor/sweet-alert.min.js` (SweetAlert v1) | **Deleted** | Grep confirmed zero references (no `swal(`/`sweetAlert(` call) — dead weight, and superseded upstream by SweetAlert2 besides |
| `vendor/jquery.js` | **1.9.1 → 3.7.1** | 1.9.1 carries known CVEs (CVE-2019-11358 prototype pollution via `$.extend`, CVE-2015-9251 cross-domain-AJAX XSS, general untrusted-HTML XSS in versions <3.5.0). Practical exploitability in this game's own code was low (no untrusted user string ever reaches `.html()`/`.append()`/`$.extend()` — only hardcoded strings and the numeric score), but the CVEs are real; upgrading is close to free here since the only jQuery-1.9-vs-3.7 API gap in this game's code (`$(window).unload(fn)`) was already patched (see above) for the Camila-hosted jQuery-sharing case, so this bundled copy needed no further changes. Now the same version Camila's own page already loads, though that's incidental, not load-bearing — the two are still loaded as fully independent instances (see the jQuery-sharing point above; a matching version does not by itself avoid the plugin-clobbering problem, since a fresh `<script>`-loaded instance never inherits another instance's registered plugins regardless of version) |
| `vendor/js.cookie.js` | **2.0.0-pre → 3.0.5** | 2.0.0-pre is affected by CVE-2026-46625 (prototype pollution enabling cookie-attribute hijacking, fixed in 3.0.7 — 3.0.5 predates that fix too, but the vulnerable code path is the `assign()` helper merging a `JSON.parse`-derived object, which this game's own single call site — `Cookies.set("visited", true)`, a hardcoded literal, never a parsed/attacker-influenced object — never exercises; upgraded anyway since a current release was trivial to swap in). API-compatible with this game's only usage (`.set(name, value)`/`.get(name)` — unchanged surface between v2 and v3 for this simple case, verified live: `Cookies.set("visited", true)` still round-trips through `.get()` correctly) |
| `HEXTRIS_BASE`'s anchor script (`index.html`) | Re-anchored from `vendor/hammer.min.js` to `vendor/js.cookie.js` | `hammer.min.js` (the previous anchor, being the first script tag) no longer exists — `js.cookie.js` is now first in the list instead. See that inline `<script>`'s own comment. |

**Fonts audited too (requested live) — three genuinely unused, one wrongly flagged as unused and restored:**

| File | Change | Why |
|---|---|---|
| `style/fonts/Lovelo.otf`, `style/fonts/QuattrocentoSans-Regular.ttf`, `style/fonts/roboto.woff` | **Deleted** | Grep confirmed zero references anywhere (no `@font-face`/`font-family` mention in `style/style.css` or any `ctx.font =`/`renderText(...)` call in `js/*.js`) — dead weight in upstream, not something this integration introduced |
| `style/fa/` (Font Awesome 4.1.0) | **Deleted, then restored** — see below | First deletion was a mistake: grepped only for the HTML-usage pattern (`fa fa-*`/`class="fa ..."`), found none, concluded "unused." Wrong — `js/view.js` and `js/render.js` draw the play-triangle/arrow-key icons **directly onto the `<canvas>`** via `ctx.font = "...FontAwesome"` + `fillText(String.fromCharCode(0xf04b))`, a usage pattern grepping for CSS class names can never catch. Reported live as the Play button's icon going invisible (`#startBtn` itself — the click target — was untouched and still worked; only its glyph, drawn separately on the canvas, vanished, since `0xf04b` is a Private Use Area codepoint with no visual glyph in any font but FontAwesome's own). Restored: re-fetched the exact same version (4.1.0, confirmed via the CSS's own header comment) and its 4 font formats (eot/woff/ttf/svg) referenced by its `@font-face` rules; verified via a direct pixel-sampling test (draw the `0xf04b` glyph on an isolated canvas after `document.fonts.load()`, confirm non-background pixels actually render) rather than trusting `document.fonts.check()` alone — that API reported "unloaded" for `FontAwesome` even after a successful, visually-confirmed render, and reported the same false "unloaded" for `Exo` (definitely working, confirmed visually since page load) — canvas-triggered font loads apparently don't reliably update the `document.fonts.check()`-visible status the way DOM-triggered ones do, at least not immediately, so don't trust that API alone for a canvas-only font's load state. |

**Lesson for future audits of this file**: a game that draws its own icons on `<canvas>` (rather than via `<i class="fa-*">`-style DOM icon fonts) can depend on an icon font in a way no HTML/CSS-class grep will ever surface — check `ctx.font =`/`fillText(...)` call sites across every `.js` file too before concluding any font is unused.

See [`CREDITS.md`](CREDITS.md) (in this same folder) for the full, current list of vendored libraries/fonts, their versions, and licenses.

**Not modified**: `js/Block.js`, `js/Hex.js`, `js/Text.js`, `js/checking.js`, `js/comboTimer.js`, `js/input.js`, `js/math.js`, `js/render.js`, `js/save-state.js`, `js/update.js`, `js/wavegen.js`, `vendor/jsonfn.min.js`, `vendor/keypress.min.js`, `style/fa/*` (deleted then restored — see above; the restored files are the same version, not modified from what upstream itself bundles), `style/fonts/Exo2-*.otf`, all remaining image assets — byte-identical to upstream. (`js/main.js`, `js/view.js`, `js/initialization.js`, `index.html`, and `style/style.css` are each modified as described above — no longer byte-identical to upstream. `vendor/jquery.js`/`vendor/js.cookie.js` are upgraded, not upstream-identical, either — see the audit table above.)

## Other technical notes

- **No CDN, no external calls at runtime, verified** (see the removals tables above) — every asset (`js/*.js`, `vendor/*.js`, `style/*.css`, `style/fonts/*` — the Exo2 webfont, `style/fa/*` — Font Awesome, `images/*`) is the literal file vendored from upstream (or, where noted, edited/deleted/upgraded locally), nothing fetched from a third party at runtime.
- **The "ad-free" pause-screen messages in `js/view.js`'s `showText()` are now stale, not yet addressed**: `pausedAndroid`/`pausediOS`/`pausedOther` all say some version of "Don't like ads? ... buy one of the ad-free mobile versions!" — text that made sense next to upstream's own AdSense (removed above), but now advertises a feature (ads) this build never shows and a purchase (the mobile apps' ad-free unlock) unrelated to this embed. Not fixed yet — flagged here since it's the same category of "stale reference to the public project" as the social/badge removal above, just not yet requested live.
- **A hidden dev-tools panel (`js/main.js`'s `toggleDevTools()`/`exportHistory()`, gated on `window.devMode` — hardcoded to `0` in `js/initialization.js`, and on DOM ids `#devtools`/`#devtoolsText`/`#clickToExit` that don't exist anywhere in this vendored `index.html`) is pre-existing dead code in upstream itself, not something this integration added or needs to fix — `devMode` never being `1` means `toggleDevTools()` never fires from `js/input.js`'s key handler, and even if it did, every jQuery selector involved matches nothing, so every call is a harmless no-op. Left as-is (out of scope — this is upstream's own leftover, unrelated to anything this integration touched).
