# Heal'em All: original architecture

Status labels used in this file and in `GAMEPLAY-SPECIFICATION.md`:
**[S]** verified in source, **[X]** verified by execution, **[D]** documented but untested, **[?]** unknown.

## What the repository is

`krzysu/game-off-2013` at commit `66950cd` is a Yeoman `generator-webapp 0.4.2` project (Gruntfile header: "Generated on 2013-09-25")
holding a CoffeeScript game on top of the Quintus engine. [S]

| Path | Role |
|---|---|
| `app/index.html` | Page shell: loading splash, three Google Fonts `<link>`s (http://), Google Analytics snippet, three `<script>`s. [S] |
| `app/scripts/lib/quintus-all.js` | Quintus engine, all modules concatenated (146 KB). Header: MIT or GPLv2. [S] |
| `app/scripts/lib/stats.min.js` | mrdoob stats.js (FPS meter). Instantiated by `Game.initStats` but its DOM node is never appended. [S] |
| `app/scripts/game/**/*.coffee` | 48 CoffeeScript sources (2,782 lines): the game. [S] |
| `app/scripts/game.js` | Committed compile output of those 48 files. **The file the browser actually runs.** [S] |
| `app/styles/main.scss` | Styles for the loading splash and canvas background. Compiled CSS is **not** committed on `master`. [S] |
| `app/data/*.json` | Sprite-sheet frame maps (characters, items, hud, others, bullet). [S] |
| `app/data/level1..6.tmx` | Level maps made with the Tiled editor, 70 px tiles. [S] |
| `app/images/` | 9 runtime graphics + 2 promo images. [S] |
| `app/audio/` | 7 sounds, each as `.mp3` and `.ogg`, plus `missing_audio.txt`. [S] |
| `Gruntfile.js`, `package.json` | Dev build (coffee, compass, usemin, rev, imagemin...). Zero runtime dependencies. [S] |
| `LICENSE`, `README.md` | GPLv3 text; licensing statements added 2019-07-24. [S] |

Branch `gh-pages` (`2f8629d`, 2013-12-01) holds the author's *deployed* build: `index.html`, one uglified
`scripts/28f9db37.main.js` (108 KB), one minified `styles/ae2f2a90.main.css`, plus the same data, images and audio. [S]

## Build chain

1. `coffee:dist` compiles `init.coffee` first, then every other `.coffee` in alphabetical path order, into `app/scripts/game.js`. [S]
2. `compass` turns `main.scss` into CSS (needs Ruby + Compass). [S]
3. `usemin`/`uglify`/`rev` concatenate and fingerprint for `dist/`. [S]

**Reproducibility, tested.** Step 1 was re-run with `coffee-script@1.6.3` (the version grunt-contrib-coffee 0.7 pulls in)
mimicking the Gruntfile's file order. The output is identical to the committed `game.js` once CRLF line endings are normalised
(upstream committed the file with CRLF). [X] Details in `ORIGINAL-EXECUTION-REPORT.md`.
`npm install` of the full Grunt toolchain does **not** work today: it fails in the `gifsicle` post-install
(`ERR_INVALID_ARG_TYPE` on Node 24) and Compass needs Ruby, which is absent. [X] Neither is needed to run the game.

**Grunt and Node are development-only.** The runtime is three static scripts, a stylesheet, images, JSON/TMX and audio. [S][X]

## Runtime start-up (all in `game.js`, order = `init.coffee` first)

1. `window.Game = { init: ... }`; `Game.init()` is called at the bottom of `init.coffee`. [S]
2. `Quintus({development: true, audioSupported: ['ogg','mp3']})`, then `Q.include "Sprites, Scenes, Input, Touch, UI, 2D, Anim, Audio"`. [S]
3. `Q.setup({maximize: true, upsampleWidth: 640, upsampleHeight: 320})`: the canvas fills the window at load time. [S][X]
4. `Q.controls().touch()` (keyboard + on-screen touch pad), `Q.enableSound()`. [S]
5. Progress is read from `localStorage`: `zombieGame:availableLevel`, `zombieGame:levelProgress:<n>`. [S]
6. `load.coffee` calls `Q.load` for every image, JSON, TMX and audio, then compiles the sprite sheets and shows the `start` scene. The splash `<div id="loading">` is removed when `loaded == total`. [S][X]

Asset requests carry a cache-busting `?_t=<timestamp>` query (Quintus `development` behaviour). [X]

## Scene graph

`Game.stage*` helpers (init.coffee) swap scenes with `Q.clearStages()` + `Q.stageScene(...)`:
`start` → `levelSelect` → (`controls` first time) → `level1..6` (+ `hud` as stage 1) → `levelSummary` → next level or `end`;
`gameOver` returns to `levelSelect`. [S][X for start, levelSelect, controls, level1, level6, levelSummary, end, gameOver]

Sprite classes (each in its own `.coffee`): `Player`, `ZombiePlayer`, `Zombie` (+ `zombieAI` component), `Human`, `DeadZombie`,
`Bullet`, `Gun`, `Key`, `Door`, `Heart`, `ExitSign`; HUD/UI widgets under `sprites/hud` and `sprites/ui`;
`gun` component adds firing to the player. `Q.AudioManager` (audio_manager.coffee) wraps `Q.audio` with mute/loop bookkeeping. [S]

Collision groups are bit flags (`init.coffee`): NONE 0, PLAYER 1, TILES 2, ENEMY 4, BULLET 8, PLAYER_COLLECTIBLE 16, HUMAN 32, ZOMBIE_PLAYER 64. [S]

## Engine-level facts that matter for restoration

* Game loop: `requestAnimationFrame`, `dt` from `new Date().getTime()`; `Q.stageGameLoop(dt)` can be called by hand with a fixed `dt`. [S][X]
* Randomness: only `Math.random` (zombie facing after re-infection; random key/door/gun/heart layout in levels 2-6; Quintus shuffle). [S]
* Bullet range is `Q.width / 2`, so it depends on the window width at load. [S][X: Q.width was 1024 and 1278 in two runs]
* No resize handling beyond `orientationchange`; the canvas keeps its load-time size. [S][X]
* Quintus bundles Underscore.js (MIT) and John Resig's inheritance helper (MIT). [S]
* Text is drawn on the canvas with web fonts "Boogaloo" and "Jolly Lodger"; if the font is not yet loaded the canvas falls back silently. [S]
