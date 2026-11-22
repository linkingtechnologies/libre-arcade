# Gameplay parity

How the restored game was compared with the original, what agreed, and what was not compared.

## Method

- **Reference ("oracle"):** upstream's own page at commit `609636d` (`reference/elemental-one-609636d/index.dev.html`: upstream's committed `build/all.js` plus its Phaser), served unchanged.
- **Subject:** `public/` (the restored page).
- **Determinism:** `tools/virtual-clock.js` replaces `requestAnimationFrame`, `Date.now`, `performance.now` and `Math.random` before any page script runs, so both builds advance one 1/60 s frame per step. Phaser's random generator seed (taken from the boot-time clock) is reseeded identically before the title screen is left.
- **Inputs:** the same script is replayed in both builds: real keyboard events (`keydown`/`keyup` for arrows, Z, X, Space, Enter) dispatched on `window`, the path Phaser reads. Levels 2 to 4 are entered with `game.state.start('levelN')`, the call the game itself makes when a level is completed. In the level scenarios the player is moved with a teleport (`__tp`) between gems, blocks and exit; every pick-up, firing and drop is a real key press.
- **Compared every frame:** state name, camera, and for every sprite and text in the Phaser world: key, x, y, exists, alpha, velocity, animation and frame, element (up to 827 objects per frame in level 4, including the 200-particle emitters).
- **Tolerance:** none. Every compared value must be exactly equal on every frame. Before the title is left, both builds have their virtual clock moved to the same value (`__align`), because tweens are time based and the two builds otherwise boot at different absolute times and drift by up to a frame (an earlier run with an unaligned clock showed the level-4 end screen appearing one frame apart; that was a harness artefact and disappeared once the clock phase was aligned).
- **Self-check:** the restored build run twice produces identical traces, so the harness itself is deterministic.

## Scenario runs

| Scenario | Frames | Player x range | Player y range | Original vs restored | Checks |
|---|---|---|---|---|---|
| `level1` | 614 | 150 to 1991 | 450 to 793 | identical | 3/3 pass |
| `level2` | 1681 | 150 to 1991 | 300 to 1773 | identical | 6/6 pass |
| `level3` | 2026 | 150 to 3815 | 420 to 2963 | identical | 7/7 pass |
| `level4` | 3132 | 65 to 2515 | 450 to 2903 | identical | 9/9 pass |
| `fuzz-level1` | 1502 | 15 to 745 | 391 to 583 | identical | n/a |
| `fuzz-level2` | 1502 | 15 to 297 | 688 to 793 | identical | n/a |
| `fuzz-level3` | 1502 | 15 to 803 | 1668 to 1983 | identical | n/a |
| `fuzz-level4` | 1502 | 15 to 827 | 2788 to 2963 | identical | n/a |

## Checks

| Level | Check | Frame | Original | Restored |
|---|---|---|---|---|
| `level1` | water powergem acquired with Z | 143 | pass | pass |
| `level1` | water blocks removed by water element | 504 | pass | pass |
| `level1` | exit star leads to level2 | 709 | pass | pass |
| `level2` | water powergem acquired with Z | 143 | pass | pass |
| `level2` | wrong element does not remove earth blocks | 504 | pass | pass |
| `level2` | water blocks removed by water element | 865 | pass | pass |
| `level2` | earth powergem acquired with Z | 1210 | pass | pass |
| `level2` | earth blocks removed by earth element | 1571 | pass | pass |
| `level2` | exit star leads to level3 | 1776 | pass | pass |
| `level3` | water powergem acquired with Z | 143 | pass | pass |
| `level3` | water blocks removed by water element | 504 | pass | pass |
| `level3` | earth powergem acquired with Z | 849 | pass | pass |
| `level3` | earth blocks removed by earth element | 1210 | pass | pass |
| `level3` | fire powergem acquired with Z | 1555 | pass | pass |
| `level3` | fire blocks removed by fire element | 1916 | pass | pass |
| `level3` | exit star leads to level4 | 2121 | pass | pass |
| `level4` | water powergem acquired with Z | 143 | pass | pass |
| `level4` | water blocks removed by water element | 504 | pass | pass |
| `level4` | earth powergem acquired with Z | 849 | pass | pass |
| `level4` | earth blocks removed by earth element | 1210 | pass | pass |
| `level4` | fire powergem acquired with Z | 1555 | pass | pass |
| `level4` | fire blocks removed by fire element | 1916 | pass | pass |
| `level4` | air powergem acquired with Z | 2261 | pass | pass |
| `level4` | air blocks removed by air element | 2622 | pass | pass |
| `level4` | exit star shows the YOU WIN! end screen | 3127 | pass | pass |


## Which required checks this covers

| Required check | Status | Evidence |
|---|---|---|
| Initialization, menu and first level | **Automated, passed** | browser tests; parity runs start from the title and press Enter |
| Horizontal movement, jumps, collisions with platforms, walls, slopes | **Automated, passed** (original vs restored identical) | four `fuzz-levelN` scenarios: 1,500 frames each of seeded random walking, jumping and ducking from each level's spawn, plus the level scenarios |
| Frame timing | **Automated, passed** | virtual clock, same step size in both builds; physics uses Phaser's `physicsElapsed` |
| Each elemental ability activates | **Automated, passed** | water (levels 1 to 4), earth (2 to 4), fire (3, 4), air (4): gem acquired with Z, blocks of the same element removed |
| Elemental interactions | **Automated, passed** | wrong element does not remove blocks (level 2: water against earth blocks); an element is released with X and the next gem can be picked up |
| Four levels load | **Automated, passed** | all four are entered and played in both builds |
| Level completion triggers | **Automated, passed** | the exit star advances level 1 to 2, 2 to 3, 3 to 4 |
| Endgame screen reachable | **Automated, passed** | level 4 exit shows "YOU WIN!" in both builds; also a real-time browser test |
| Death and restart | **Not applicable upstream** (no death exists); shell restart is **automated, passed** | browser test (player back at spawn; end screen restart returns to the menu) |
| Completing each level **by walking and jumping from the spawn** | **Not tested** | no bot or human playthrough was done; the scenarios teleport between objectives. The geometry is upstream's and is identical in both builds, but reachability of each star by play alone is unverified |
| Pixel-level drawing comparison | **Not tested** | the oracle compares scene state, not rendered pixels. Text drawn in a different font is known to differ visually by design |
| Audio comparison | **Source-reviewed only** | sounds are the same files, the same calls; the browser test checks all seven decode and the theme plays |

## Known and intentional differences

1. The text font (Jersey 10 instead of Minecraftia): glyph shapes and widths differ, positions and anchors do not.
2. `jump.wav` has different content (a synthesized sound).
3. The Italian text, when selected, replaces the English strings as they are created.
4. Shell features (pause, restart, mute, touch) are outside the game.

## Historical defects

None in the game's code was corrected. The Phaser double audio decode (a console error with no gameplay effect) is left as shipped.

## Reproduce

```bash
npm install
npm run parity                      # prints the comparison; all scenarios must read IDENTICAL
node tools/parity.mjs "" test/results/parity.json && node tools/report.mjs   # regenerate the tables above
```

Needs Chrome (set `CHROME=` to its path otherwise). Run nothing else heavy meanwhile: the browser tests are sensitive to CPU load.
