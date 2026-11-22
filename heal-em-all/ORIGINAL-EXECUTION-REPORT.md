# Heal'em All: original execution report (M1.4)

Goal: run the **unmodified** historical source before touching anything. Result: it runs.

## Method

* `tools/serve-baseline.mjs` serves `reference/upstream-master/app` byte-for-byte. The only overlay is `/styles/main.css`, absent from `master`
  (Compass output), mapped to the CSS the author deployed on `gh-pages` (`ae2f2a90.main.css`). Every request is logged to `evidence/baseline-requests.log`.
* Real-time run: `tools/realtime-baseline.mjs` with Chrome 158 (headless, `playwright-core`, not a repo dependency): `evidence/realtime-baseline.json`, screenshots in `evidence/screenshots/`.
* Fixed-step run: `tools/probe-original.js` evaluated inside the page, stepping `Q.stageGameLoop(1/60)` with a seeded `Math.random`: `evidence/probe-original-result.json`.
* Also opened in the Claude desktop in-app browser (Chrome 156): loaded and played to level 1 with real Enter / click input.
* Host: Windows 11, Node 24.20.0.

## Results

| Check | Result |
|---|---|
| Page loads, splash removed, title scene shown | Yes (screenshot `01-title.png`) |
| JavaScript errors / failed requests / console messages | **None** (Chrome 158, desktop and mobile emulation) |
| All local assets | 5 JSON + 6 TMX, 8 images, 7 audio requests (`.ogg` chosen by the engine), all 200 |
| Frame rate | 61 `requestAnimationFrame` callbacks per second |
| Menu flow with real keyboard | Enter: title → level select; tomb click → controls; Enter → level 1 |
| Held keys | ArrowRight for 1 s moved the player 324.7 px (target speed 330); ArrowUp gave `vy -660` |
| Gun + Space | bullets 3 → 2, one bullet sprite; `P` pauses (`stage.paused = true`) |
| Touch | `Q.touchDevice = true` under touch emulation; `<`, `>`, `b`, `a`, pause and back buttons rendered (`12-mobile-gameplay.png`). Finger gameplay itself not exercised. |
| Audio | `Q.audio.type = "WebAudio"`; files fetch and decode. Audible output **not** checked (headless). |
| Summary / end / paused screens | Rendered (`06`, `08`, `09`) |
| Scripted gameplay (fixed step) | Two identical seeded runs gave identical positions: determinism confirmed |

## Network requests made by the original (all non-local ones are removable)

* `http://fonts.googleapis.com/css?family=Ubuntu | Boogaloo | Jolly+Lodger` (plain http, redirected to https, then `fonts.gstatic.com` woff2).
* `http://www.google-analytics.com/analytics.js` (site id `UA-9904630-18`): loaded and executed; `trackEvent` calls `ga(...)` on pause, mute, level summary, end, game over, unload.
* `og:image` points at `dl.dropboxusercontent.com` (metadata only, not fetched by the page).

Nothing else leaves the machine. Quintus did not need to be changed.

## Findings during the run

1. **Load-time sizing.** First load happened while the in-app browser pane was hidden (window width 0): the canvas became 0 px wide and the page was blank until a reload. `Q.setup maximize` reads the window size once. [X]
2. **No resize handling.** After the pane was resized the canvas kept its old size and scrollbars appeared. [X]
3. **Embedded-browser rAF throttling.** In the desktop in-app browser, `requestAnimationFrame` ran at 1-2 Hz, so real-time play could not be tested there; desktop Chrome (headless) ran at 61 Hz. Use real Chrome for timing tests.
4. **Muted start-up fails.** With all `/audio/*` answered 404 (`tools/serve-baseline.mjs --no-audio`, `evidence/muted-build-experiment.json`), the original throws `Error Loading: <file>.mp3` x7 and `EncodingError: Unable to decode audio data`; the loading bar stays at 44 % and the game **never reaches the title**. Details in `COMPATIBILITY-ISSUES.md` C5.

## Build reproducibility

* `coffee-script@1.6.3` reproduces `app/scripts/game.js` from the 48 `.coffee` files exactly (modulo CRLF). [X]
* `npm install` of the original `package.json` fails on Node 24 (`gifsicle` post-install via `grunt-contrib-imagemin`), and `grunt-contrib-compass` needs Ruby/Compass (not installed). Full `grunt build` not reproducible today. [X]
* The deployed `gh-pages` bundle is a historical artefact; not compared line by line against `master` (it predates the last two commits).

## Not done / limits

No audible-audio check, no finger-touch gameplay, no iOS/Safari or Firefox run, no https/GitHub Pages run (mixed-content behaviour of the `http://` font links is predicted, not observed), no scripted full playthrough of any level.
