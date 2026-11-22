# Original source manifest

The frozen, untouched snapshot of the 2011 game lives in
[`same-game-gravity/`](same-game-gravity/) (the upstream tree without its `.git`
folder). Nothing in it is edited; the restored game is in `../public/`.

| | |
|---|---|
| Project | Same Game Gravity, "Desktop version" |
| Author | Gaëtan Renaudeau (@greweb) |
| Repository | https://github.com/gre/same-game-gravity |
| Commit | `8fc4b57a2204f2a3e06b945214603d16b9675a9b` ("clean html", 2011-07-10 12:09:20 +0200, last commit of the repository) |
| Archive | https://github.com/gre/same-game-gravity/archive/8fc4b57a2204f2a3e06b945214603d16b9675a9b.zip |
| Archive file | [`sgg-8fc4b57a2204f2a3e06b945214603d16b9675a9b.zip`](sgg-8fc4b57a2204f2a3e06b945214603d16b9675a9b.zip) (378,734 bytes) |
| Archive SHA-256 | `c450d4f6cda4e761ed434a36f2175d4101844365ef1982a9a7d22f6c9a1a6eb9` |
| Licence | GPL v3 (`LICENSE` in the snapshot; the `README` also says "Licence: GPL v3") |
| Retrieved | 2026-11-22 |

- [`FILES.sha256`](FILES.sha256): SHA-256 of every file of the snapshot (`sha256sum -c` from inside `same-game-gravity/`).
- [`GIT_LOG.txt`](GIT_LOG.txt): the four commits of the repository (2011-06-24 to 2011-07-10).
- [`baseline/`](baseline/): screenshots of the original running in a current browser (menu, a seeded Normal game).

## Reproducible scenarios

The original picks boards with `Math.random()`, so a scenario is "seed the
generator, then play". `test/oracle.test.js` runs the original `game.js` and
the restored one through the same scripted games (3 difficulties x 4 seeds,
rotations in all four directions, clicks) and compares every renderer call,
every game event and the grid after each frame.

For the manual baseline, in the original page's console:

```js
let s = 12345; Math.random = () => { let t = s += 0x6D2B79F5; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296 };
samegame.SameGame.route('/game/new/normal');
```

The restored game reproduces the same board with `?seed=12345`.
