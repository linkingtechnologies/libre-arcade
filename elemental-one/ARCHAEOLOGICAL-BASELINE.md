# Elemental One: archaeological baseline (M1)

Everything here was checked against the pinned upstream snapshot in
`reference/elemental-one-609636d/` unless marked *assumption*.

## What the project is (verified)

- **Author:** Zaven Muradyan, 49 commits from 2013-12-16 to 2015-08-16 (the pinned one), all authored by him (checked through the GitHub commits API; `package.json` lists him as the only contributor).
- **Origin:** a first platformer made along the Ludum Dare 28 theme "You Only Get One" (`IDEAS.md`: "One power! Elemental. Puzzle-platformer").
- **Pinned revision:** `609636d84f8abb20e49fdf00ab42428f4805d27b`, "Consolidate and demystify asset attribution and licenses. See #1". Acquired as the GitHub archive (SHA-256 `aa64f706…6ce7`, 12,142,335 bytes).
- **Stack:** HTML5 canvas, Phaser **1.1.3** (committed in `deps/`, unminified and minified), code split into CommonJS modules in `src/` and bundled with Browserify through Grunt into `build/all.js` (committed, so the game runs with no build).
- **Code licence:** MIT, Copyright (c) 2014 Zaven Muradyan (`MIT-LICENSE.txt`).

## Source layout (verified)

| File | Lines | Role |
|---|---|---|
| `src/main.js` | 695 | The whole game: states `boot`, `preloader`, `mainmenu`, `level1`…`level4`; player, input, items, blocks, emitters, level transitions, end screen |
| `src/data.js` | 667 | Level data (player start, goal, gems, blocks, help text, which element emitters exist) |
| `src/config.js` | 47 | Constants (800×600 canvas, 70 px tiles, gravity 20, move 210, jump 500, tile classes) |
| `src/overrides.js` | 534 | Monkey patches of Phaser 1.1.3 physics for top-only platforms, flipped particles, blockable bodies |
| `src/extensions.js` | 50 | Sloped-tile collider |
| `src/utils.js` | 18 | `range()` |

`build/all.js` was parsed and compared with `src/`: its six modules are the same programs as the six source files (AST-equal; `test/integrity.test.mjs`). So the committed bundle is a faithful build of the pinned source.

## How the game plays (read from `main.js`, `data.js`, `config.js`)

- **Goal:** walk and jump to the glowing star exit of each of **four** levels (`level1`…`level4`). The last level has `nextState: null` and shows a black "YOU WIN!" then "THE END" screen.
- **Controls:** arrows (left/right walk, up jumps when standing, down ducks), `Z` picks up a gem you overlap, `X` drops it, `Space` emits your element (only when standing still on the ground), `Enter` leaves the title.
- **Elements:** four gems (yellow air, blue water, green earth, red fire). You carry at most one. Each emits particles (own speed, gravity, lifespan). A **block** of the same element is destroyed (fades for 1 s) when a particle touches it; blocks of other elements are not affected. After `X`, the element is cleared once the last particle has died.
- **Physics:** Phaser Arcade bodies, player 30×75, gravity 20 (scaled by Phaser's `physicsElapsed*60`), jump 500, walk 210; floating tiles (24 kinds) are solid from above only, 12 tile kinds are slopes.
- **Not in the game:** no enemies, no health, no death, no lives, no score, no timer, no pause, no restart, no saved progress. Falling stops at the world edge. (The task text mentions enemies and deaths in general terms; none exist upstream, so none are restored or invented.)
- **Audio:** a looping theme at 0.3 volume, a jump sound, a pickup sound and one looping sound per element while firing.

## Does it still run unmodified? (verified, 2026-11-22)

Yes. `index.dev.html` served as-is from a static server runs in current Chrome (headless, Chrome 158): the title, the four levels and the end screen all work.
Findings:

1. **One uncaught promise rejection per run:** `DataCloneError: Cannot decode detached ArrayBuffer`. Phaser 1.1.3 asks the Web Audio API to decode a sound that it already handed over for decoding (`Sound.play` → `SoundManager.decode`), and current browsers refuse the second call. The first decode succeeds and the theme plays (checked: `isPlaying` is true), so this is a console error with no gameplay effect. It is left alone (changing Phaser is out of proportion) and tests treat exactly this message as known.
2. **`jump.wav` is not described in `ATTRIBUTION.md`** (licence unknown) and **Minecraftia is personal-use only**: both are blockers for redistribution, not for running (M2).
3. **`window.onload = boot`** in `main.js` means the game only starts if its scripts are loaded before the page's `load` event. Fine on the original page; the integration layer, which loads the game after a Play click, calls that handler itself once Phaser has booted (and only once; see `specs/design.md`).
4. No third-party network calls, analytics or ads exist in the upstream page (only the "Fork me on GitHub" link in the footer of `index.html`).

## Blockers and classification

| Item | Class | Resolution |
|---|---|---|
| Minecraftia font | **Licence blocker** | Not shipped; family name redirected to Jersey 10 (OFL) in CSS only |
| `jump.wav` (no licence on record) | **Licence blocker** | Not shipped; synthesized replacement at the same path |
| `starring.png` page background (no attribution) | Licence unknown, not needed | Not shipped |
| Sound files air/water/earth/fire/pickup | Licence declared upstream, bytes not matchable to a source page | Shipped on upstream's declaration; flagged in `LICENSE-AUDIT.md` |
| Phaser double decode error | Cosmetic defect | Documented, not changed |
| Footer, `index.html` styling | Not game | Replaced by the Libre Arcade shell |
| No restart/pause/mute/touch | Missing features | Added by the integration layer without touching game code |

## Verified facts versus assumptions

**Verified:** everything above under "verified"; Phaser version from `deps/phaser.js` (`VERSION: '1.1.3'`); `happy.mp3` is byte-for-byte the file on OpenGameArt's "Happy Arcade Tune" page (3,628,910 bytes, CC BY 3.0, rezoner).
**Assumptions:** that the sprite sheets are Kenney's CC0 work (upstream says so and the file names follow Kenney's pack; not independently matched); that the three PNGs in `assets/images/` are the author's own composites of Kenney tiles (the menu background visibly is); that the `.ogg` of the theme is a conversion of the verified `.mp3`.
