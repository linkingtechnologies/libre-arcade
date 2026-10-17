# The Lost Path: design

*Restored* game: upstream's JavaScript is vendored, not re-implemented. No
`reference/` folder, no port map.

Upstream: https://github.com/wrksp8/TheLostPath (author Ghazi, `@mgks`; the
repository was moved from `mgks/TheLostPath`), MIT, snapshot commit
`767e15d8a1cdb689e0ac56d703ccbe7fde977605` of 2025-01-08. It is a v1.0
"experimental" game; the README's v2/v3 roadmap (collectibles, enemies,
music, touch) was never built.

## Structure

`public/index.html` plus `public/src/{script.js,style.css,touch.js}`,
icons and a web manifest, as upstream laid them out. A single `<canvas>`,
one plain script, no framework.

## Local modifications

| File | Change and why |
|---|---|
| `index.html` | Removed the Google tag (the Tag Manager script and its inline config): no Google tracking in this collection. Added the shared GoatCounter snippet. Dropped `crossorigin="use-credentials"` from the manifest link (the manifest is same-origin, so it did nothing). The floating title, the "Developed by @mgks" footer and the "GitHub Repo" link are gone from the page: the toolbar carries the title, and the Credits dialog carries the author credit and a link to the current repository address `wrksp8/TheLostPath`. |
| `src/app.webmanifest` | Upstream shipped empty `name`/`short_name` and white theme colours. Filled in the name and set the colours to the game's own `#0b0b0b`. |
| `src/style.css` | `touch-action: none` on `body`, so dragging on a phone does not scroll or zoom the page; plus a rule for the torch layer (below). |
| `src/touch.js` (new, not upstream) | Touch controls. Upstream reads only arrow-key `keydown`/`keyup` on `document`, so a drag on the canvas (14 px dead zone, any of 8 directions) dispatches those same events. `script.js` needed no change. |

| `src/torch.js` (new, not upstream) | A torch. Upstream paints walls and corridors in the background colour, so the maze is invisible unless Shift+D is on (its README calls the mode a way to make the maze "easier to navigate" and lists a "Player Torch" under the unbuilt v2). This adds a transparent canvas over the game canvas that lights the corridors within 3.5 tiles of the player, fading with distance, blended with `mix-blend-mode: screen` so the player, trail and finish dots underneath stay visible. It reads `script.js`'s globals (`maze`, `player`, `tileSize`, `debugModeCheat`) and never assigns them (a test checks that); it turns itself off in debug mode. Added after the first browser check showed an apparently empty black screen. |

| `src/menu.css`, `src/i18n.js`, `src/menu.js` (new, not upstream) | The same toolbar every other game here has: Game (New maze), Help (Instructions, Credits), and an IT/EN switch that shows the other language (default English, not persisted, like the siblings). Instructions and Credits are `<dialog>`s. Upstream has almost no text, so `menu.js` also translates the four strings `script.js` writes itself (the timer label and the three end-of-round messages) by watching the timer and the overlay with a `MutationObserver`; no text in `script.js` is edited for this. Two quirks of upstream shape this: it wires `document.querySelector('button')` (the first button in the page) to restart, so the toolbar's "New maze" is deliberately the first `<button>` (a test checks it) and upstream's own floating Restart button, which it still creates, is hidden by CSS; and the timer keeps running behind an open dialog, so arrow keys are swallowed while one is open but the clock is not paused. |

| `src/difficulty.js` (new, not upstream) | The three difficulty levels (below). |
| `src/script.js` | The one edit to upstream's code, two spots (below). |

## The edit to `script.js`

Difficulty needed the maze size and the timer formula to be changeable, and both are fixed inside `script.js` (`const rows = 20`, `const cols = 20`, `path.length * 5`). Exactly two edits:

1. `rows` and `cols` became `let`, and two new `let`s were added, `timeBase = 0` and `timePerTile = 5`, with a comment saying why.
2. `totalTime = Math.max(path.length * 5, 5)` became `Math.max(timeBase + path.length * timePerTile, 5)`.

The defaults reproduce upstream's behaviour exactly. `menu.js` assigns the four variables (they are global lexical bindings, visible to the other scripts) and calls `restartGame()`. The test suite undoes these two edits as exact string replacements and checks that the result has the SHA-256 of upstream's file (`specs/script.js.sha256`, line endings normalised because git may convert them), so nothing else in the file has changed.

## Difficulty

The page opens a dialog asking for a level; Game, Difficulty reopens it. The choice is not remembered. Time allowed is `base + perTile * L` seconds, with `L` the length of the shortest route (upstream: `5 * L`).

| Level | Maze | base | perTile | Torch radius |
|---|---|---|---|---|
| Easy | 13x13 | 20 s | 2 s | 4.5 tiles |
| Normal | 21x21 | 15 s | 2 s | 4 tiles, finish hidden |
| Hard | 31x31 | 10 s | 1.25 s | 2.5 tiles, finish hidden |

Sizes are odd because the generator carves in steps of two tiles from (1,1); an even size such as upstream's 20 leaves a double-thick wall on two sides.

### How the numbers were chosen

`tools/simulate-timing.mjs` ports upstream's generator (the recursive carve, the five extra carves that create loops, the random open-cell finish) and runs it thousands of times per size with seeded randomness. Three simulated players walk each maze: an optimal one, a "blind" depth-first explorer that sees only its own trail, and a "torch" explorer that skips branches which are visibly dead ends inside the torch radius and heads for the finish once it is on screen (a 13 by 6 tile window, roughly a desktop viewport). Walking costs 0.42 s per tile (the game moves 3 tiles per second, plus corners) and 0.35 s of hesitation at each junction with a choice.

Findings that shaped the settings:

- The shortest route varies a lot because the finish is a random open cell: median 13, 29 and 64 tiles for 13, 21 and 31, but the 90th percentile is 29, 75 and 170. A fixed time would be absurd; time has to scale with the route, as upstream already does.
- Upstream's own five seconds per tile is very generous: on a 20x20 maze even the blind explorer wins about 81% of the time, and a torch explorer 99%. With the torch added it would be trivial, so the rate was lowered.
- Per-tile seconds alone are not enough: for short routes a wandering player needs more than `k * L`, so a fixed base was added (15 to 20 s).

Simulated win rate of the shipped settings (2,500 mazes each):

| Level | Torch player | Blind player | Time given, 10th / 50th / 90th percentile |
|---|---|---|---|
| Easy | 100% | 80% | 30 / 46 / 78 s |
| Normal | 84% | 62% | 37 / 73 / 173 s |
| Hard | 56% | 46% | 36 / 91 / 223 s |

**Hard was retuned after the first human test, and Normal followed.** The first Hard (15 s + 1.5 s per tile, finish always visible) simulated at 79% for the torch player and the tester found it too easy: upstream draws the blue finish dot anywhere on screen, so a player just walks toward it. Hard now hides the dot until it is inside the torch's reach (an opaque layer in `torch.js`, only on levels with `hideFinish`) and the clock is tighter. Normal got the same hidden finish, with a wider torch (4 tiles instead of 3.5) to compensate and its clock unchanged (it first simulated at 95% for the torch player with the finish visible, 84% hidden). In the simulation, hiding the finish barely separates the torch player from the blind one (the light helps little once the target is unknown), but it makes exploration much longer, which is why the per-tile time is not simply raised.

**These are models, not people.** The explorers never get confused or misread a junction, so a real player should win less often than the table says. Treat the numbers as a starting point and retune `src/difficulty.js` after playing; re-run `node tools/simulate-timing.mjs` to compare.

Two small things left as they are: `perTile: 1.25` can make `totalTime` fractional (the timer's own `Math.max(0, ...)` handles it), and a bigger maze means a bigger canvas (`cols * tileSize`, 1550 px for Hard), centred on the player as before.

## Behaviour worth knowing (upstream, left as is)

- `totalTime` is an implicit global and `restartGame` starts a new
  `requestAnimationFrame` loop each time it runs, so loops pile up over a
  long session. They share `lastTime`, so movement speed is not affected.
- Without the torch the maze is invisible (see above); the finish dot is drawn on the game canvas and can be seen from afar.
- The maze is 20x20 tiles at 50 px (a 1000 px canvas), centred on the player;
  on a small screen only the middle is visible, which is where the player is.
- Win and timeout both restart the game automatically (3 s and 5 s).
- Shift+D shows every path ("debug"); winning with it on gives a different
  message.

## State

None persisted. No `localStorage`, no network calls apart from the
GoatCounter beacon.

## Verification

Level 3 (documented review): there is no original behaviour to diff against
beyond the file itself, whose only edits are the two above and are test-checked. The timing values come from simulation (level 2 in spirit: computed, not observed), not from play-testing.
