# Dependency audit

Assessed 22 November 2026 against the original at `25ee169`.

## What the original depended on

| Dependency | Version | Used for | Decision | Replacement |
|---|---|---|---|---|
| CraftyJS | 0.6.3 (2012 sources: 0.5.3 / 0.5.4) | Entities, sprites, animations, collision (`hit`), keyboard, fixed 50 fps timer, canvas/DOM rendering, scenes, audio | Removed | `sim.js` (state, collision, timing), `render.js` (canvas), `main.js` (loop, keyboard), `audio.js`. The behaviours the game relied on are listed in `SOFTWARE_ARCHAEOLOGY.md` and are checked by the oracle |
| jQuery | 1.9.1 | DOM for the HUD and menus, dialogs, fades | Removed | Standard DOM and CSS |
| jQuery UI | 1.9.2 (+ "le-frog" theme) | Dialogs | Removed | Panels in `index.html` |
| Backbone.js | 0.9.2 | `Model` base for the game objects (attributes, `get`/`set`, shared `defaults`) | Removed | Plain classes and objects |
| Underscore.js | 1.4.2 | `_.where`, `_.size`, `_.each`, `_.shuffle` | Removed | Array methods; `_.where`'s strict equality kept where it matters (`spawnAt`) |
| RequireJS | 2.1.1 | Loading the scripts | Removed | ES modules |
| Modernizr | 2.6.2 custom | `Modernizr.touch` | Removed | `matchMedia("(pointer: coarse)")` |
| javascript-astar (graph, astar, binary heap) | as vendored | Enemy path finding | **Kept, transcribed** | `src/astar.js`: same algorithm, tie-breaking and quirks (the grid is indexed `[row][column]` and the nodes' `x`, `y` are therefore tile row and column, which the enemy code swaps back) |
| QUnit + jquery-latest | | In-browser tests of the old hiscore storage | Removed | `node --test` |
| Game Jolt API client (`gj-js-api-min.js`) | | Online scores. Contains the author's game id and key | Removed, **not even kept in the repository**; hash only | Local best score |
| Playtomic, Clay.io, Facebook SDK (PHP, `channel.php`, `all.js`) | | Online scores / login | Not applicable to the game; not ported | |
| YUI Compressor, `build.sh`, `urchin` analytics | | Minification, tracking | Removed | `npm run build` is a copy of `public/` |
| Server side (PHP `index.php`, `.htaccess`) | | The Facebook fork's page | Not needed. Gameplay is entirely client side | Static files |
| Cloud9 IDE | | The author's editor | n/a | |

## What this version depends on

- **Runtime:** a browser with ES modules, `<canvas>`, Pointer Events and (for sound) Web Audio and `<audio>` with
  Ogg Vorbis. No library, no server, no CDN.
- **One network call:** the collection's analytics beacon (`gc.zgo.at/count.js`, GoatCounter) required of every
  game of this collection by its `AGENTS.md`. The game works without it (it is `async` and the Content
  Security Policy allows only that host). No Facebook, no advertising, no other telemetry, and nothing is
  loaded from any other host. `scripts/gate.mjs` fails if anything else is referenced.
- **Development only** (`devDependencies`): `eslint` and `@eslint/js`, pinned. Tests use Node's own test
  runner. The oracle and smoke tests use whichever Chromium-family browser is installed (Edge or Chrome),
  with no npm package.
- `reference/` keeps verbatim copies of Crafty (MIT or GPL), Underscore and Backbone (MIT) so that the oracle can
  be reproduced; they are not shipped (the gate refuses library files in `public/`).

## Security notes

- The original's `index.html` and the Game Jolt client contained an embedded game key; neither is used.
- `public/index.html` carries a Content Security Policy: scripts from `self` and GoatCounter only; no inline script or
  style; `connect-src` to GoatCounter; `base-uri 'none'`; `form-action 'none'`.
- The only persistent state is two `localStorage` keys (language, best score), read and written inside `try`.
