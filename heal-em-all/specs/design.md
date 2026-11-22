# Heal'em All: design of the restoration (M2)

A *restored* game (see the root `AGENTS.md`): the original JavaScript, kept as the authors shipped it, with the smallest changes that let it run in a browser today.
`reference/` holds the frozen upstream snapshot; `scripts/derive-public.mjs` rebuilds the upstream-owned files in `public/` from it and `npm test` fails if they drift.

## Every change from upstream, and why

| # | Where | Change | Reason (issue in `COMPATIBILITY-ISSUES.md`) |
|---|---|---|---|
| 1 | `public/scripts/game.js` | `development: true` removed | Quintus used it only to append `?_t=<time>` to every asset request, which defeats caching and offline use (C7). |
| 2 | `public/scripts/game.js` | `audioSupported: ['ogg','mp3']` → `['wav']` | The replacement sounds are WAV; the engine already supports `wav` (C5). |
| 3 | `public/scripts/game.js` | `errorCallback` added to the `Q.load` options: shows "Error loading <file>" in the splash | The engine otherwise throws and the loading bar stalls silently (C5). |
| 4 | `public/index.html` | Rewritten from upstream's: IE comments, three Google Fonts links, Google Analytics, og:url/og:image removed; `lang="en"`; `compat.js` instead of a direct `game.js` tag; no favicon | C3 (remote fonts, now local), C4, C8, C9, C14. |
| 5 | `public/compat.js` (new) | (a) no-op `window.ga` so the 12 `ga(...)` calls of the original do not throw; (b) loads `game.js` only once the window has a size; (c) waits up to 3 s for the two canvas fonts | C4; C6 (0 px canvas when started in a hidden window); canvas text must not render in a fallback font. |
| 6 | `public/styles/main.css` | Upstream's own deployed CSS (`gh-pages`, byte for byte) | `master` has only the SCSS (Compass output) (C1). Same rules, no change. |
| 7 | `public/audio/*.wav` | The 14 original files (mp3 and ogg) replaced by 7 WAVs: 4 Kenney CC0, 3 synthesised | The originals have no recoverable licence (`LICENSE-AUDIT.md`). They are **not** in `public/` and must never be. |
| 9 | `public/fonts/`, `public/styles/fonts.css` (new) | Boogaloo and Jolly Lodger as local TTF + `@font-face`; Ubuntu (declared, never used) dropped | C3: the original loaded them from Google over plain http. OFL texts shipped. |
| 10 | `public/i18n.js` (new) + hooks in `compat.js` | English (default) and Italian string table; a label is translated when its sprite measures it (`Text.calcSize`) or is created (`Button.init`). Italian when the browser language is Italian, `?lang=it` / `?lang=en` override. | M4. Text only: sizes, positions, timing untouched. Italian strings were checked on every screen (no English label left). |
| 11 | `public/compat.js` | Canvas refit on `resize` / `orientationchange` with the same sizing rules as `Q.setup`, then the current screen is rebuilt (in a level only the HUD and touch pad are rebuilt, the world keeps running; not while paused) | M4, C6. The original sized the canvas once. |
| 12 | `public/index.html` | Link to Libre Arcade (top-centre strip) and the collection's GoatCounter snippet | Collection rules (`AGENTS.md`). GoatCounter is the one remote request left, and it is optional for play. |
| 8 | not shipped | `favicon.ico`, `images/promo*.png`, `images/bg-blured.jpg`, the CoffeeScript sources, Grunt files | Unknown origin / unused at runtime / kept in `reference/` for history. |

Everything else is byte-identical to upstream at `66950cd`: `quintus-all.js`, `stats.min.js`, the eight runtime images, the five sprite maps and six level maps. The line-level difference of `game.js` is checked by `test/public.test.mjs`.
`game.js` is now the source of truth for the running game; the `.coffee` files in `reference/` are history (the compile step was proven reproducible in M1 but the changes above are made on the JavaScript).

## Deliberately *not* done in M2

* **No gameplay change.** Same physics, AI, levels, random layouts (`Math.random`), timings. Parity with the original is *measured*, see below.
* No change to HUD layout or art. Italian text is drawn in the same fonts and boxes (two Italian strings were shortened where they touched: "Usa le frecce", "Trova la pistola").
* Resizing in a level rebuilds only the HUD, so very small windows can still look cramped: the original never supported them either.
* Nothing else: fonts are now local (row 9).

## Verification (what is and is not claimed)

* `tools/browser-gate.mjs` (Chrome): the restored page loads with 0 console errors, 0 failed requests, 0 non-local requests, reaches the title scene, decodes all 7 sounds.
* The same script runs the M1 fixed-step probe (`tools/probe-original.js`) on the **unmodified original** and on `public/`, at the same viewport, and compares the outputs: levels, movement, healing and re-infection, contact damage and zombie mode, zombie sight, random variants, progress keys. Result in `evidence/m2-browser-gate.json`. **Identical** for all seven probes.
* M3 probes P4 and P9-P12 (`tools/probe-m3.js`, `tools/m3-gate.mjs`, `evidence/m3-parity.json`) run on the original and on `public/` at 1024x768, 1280x720 and 800x600: identical. Bullet range is `Q.width / 2` (+ up to one step), stars follow the 0.5 / 0.9 thresholds, progress unlocks the next level and never lowers a score, fall damage and the out-of-map penalty, key/door/summary flow, zombie-mode controls (speed 140, jump -500, humans touched turn into ordinary zombies).
* `tools/m4-check.mjs` (`evidence/m4-check.json`): finger input through the on-screen pad (touch events, move and jump), resize and rotation, every screen in Italian and English with no untranslated label.
* Not covered: audible quality of the new sounds (needs a person), Firefox and Safari, a full playthrough of the six levels, the out-of-map restore position (the probe cannot tell it from one step of gravity).
