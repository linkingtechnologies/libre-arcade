# Heal'em All: compatibility issues (M1)

Nothing has been changed yet; this list is the *traceable* worklist for M2. Each fix must be isolated, commented and recorded in a
`specs/design.md`-style change log (collection convention for restored games). Severity: **B** blocks publication, **H** high, **M** medium, **L** low.

| # | Issue | Evidence | Sev | Proposed minimal fix (M2) |
|---|---|---|---|---|
| C1 | `styles/main.css` is not in `master` (needs Ruby/Compass from `main.scss`) | missing file; gh-pages has `ae2f2a90.main.css` | H | Hand-translate the 60-line SCSS (plain nesting/variables) or take the author's deployed CSS; record which. |
| C2 | Grunt toolchain cannot install on a current Node/OS | `npm install` fails in `gifsicle` post-install; Ruby absent | L | Do not revive it. Keep `.coffee` sources as reference; ship `game.js` (it reproduces exactly with coffee-script 1.6.3). |
| C3 | Fonts loaded from Google over `http://` | `index.html` lines 21-23; requests seen in baseline | B | Localise Boogaloo and Jolly Lodger (and decide on Ubuntu, unused) after reading their license files; `@font-face` + preload before first canvas text so the canvas never falls back. Plain-http CSS would be blocked as mixed content on https Pages (predicted, not observed). |
| C4 | Google Analytics snippet and `ga()` calls | `index.html`; `trackEvent` in `init.coffee` | B | Remove the snippet (privacy, offline). Define `window.ga = function(){}` so the 12 call sites do not throw. No gameplay effect. |
| C5 | **Original audio replaced (decision 2026-11-22); game cannot start without audio files** | `evidence/muted-build-experiment.json`: 7 `Error Loading`, loading stuck at 44 % | B | In `load.coffee` pass `errorCallback` to `Q.load` (supported by Quintus, `options.errorCallback`) and make `Q.audio.play` of a missing sound a no-op, or filter audio from `Game.assets.all` in a muted build. Engine stays untouched; verify that nothing else (e.g. `AudioManager`) throws. Replacements now exist in `replacement-audio/` (WAV): set `audioSupported: ['wav']` (Quintus supports it) so the engine requests `.wav`. Still harden `errorCallback` so a missing sound never hangs loading. |
| C6 | Canvas sized once from the window | blank 0 px canvas when loaded in a hidden pane; stale size after resize | M | Re-run `Q.setup`-equivalent on `resize` / `orientationchange`, or defer start until the window has a size. Must keep `upsampleWidth/Height` behaviour; bullet range depends on `Q.width/2` (see P4 in the test plan). |
| C7 | Cache-busting `?_t=<timestamp>` on every asset (Quintus `development: true`) | request log | M | Needed for offline caching: drop `development: true` or neutralise the timestamp so a Service Worker can cache. Check it does not change anything else (`development` also affects logging). |
| C8 | Remote `og:image`/`og:url` (Dropbox, `games.myviews.pl`) | `index.html` | L | Point to local/arcade URLs; metadata only. |
| C9 | `<script>`/CSS `lib` is old (IE conditional comments, no `lang`, no `doctype` issues) | `index.html` | L | Remove IE comments; add `lang`, keep viewport meta. |
| C10 | `Math.random` in level setup and re-infection makes runs non-deterministic | source | M (tests) | Keep original behaviour in the product; tests inject a seeded `Math.random`. |
| C11 | Autoplay policy: the WebAudio context starts suspended until a gesture | general browser behaviour, not observed because audio is quarantined | M | Resume the context on the first Enter/click/tap once audio exists. Out of scope while muted. |
| C12 | Level-3 `ExitSign` reads an undefined field | `level3.coffee`; probe shows a sign created | L | **Preserve**, document as an original quirk. |
| C13 | `map_tiles_70.png` referenced inside `.tmx` files but absent; the game uses `map_tiles.png` via a sheet | `level1.tmx`, file list | L | None; Quintus reads only the layer data. Do not "fix" the path. |
| C14 | `favicon.ico` of unknown origin | `LICENSE-AUDIT.md` | L | Drop or replace in M5 when the icon is checked. |
| C15 | Zombie mode controls state unverified | `GAMEPLAY-SPECIFICATION.md` Unknowns | M | Add a focused regression test before changing anything near it. |

## Status after M2 to M4
C1 (CSS), C3 (local fonts), C4 (analytics out, `ga` stub), C5 (replacement audio, `errorCallback`), C6 (start size and resize/rotation refit), C7 (no cache-busting), C8, C9, C14, C15 (zombie-mode controls verified) are **done**; C2 is left as is on purpose; C10 and C12 are preserved on purpose; C11 (autoplay) is handled by the engine on the first input and was not observed in a headless run.

## Things that are **not** problems

Quintus ran unmodified in Chrome 158 with zero console errors; touch detection works; `localStorage` progress works; the engine's `requestAnimationFrame` loop is fine. No Quintus change is required.

## Principle for M2

Smallest possible edits to `game.js` (or to the `.coffee` + a rebuild with coffee-script 1.6.3, whichever is cleaner and diffable), with the original file kept intact in `reference/`.
Prefer a thin `compat.js` loaded before `game.js` for the `ga` stub and font handling, so the upstream file stays byte-identical wherever possible.
