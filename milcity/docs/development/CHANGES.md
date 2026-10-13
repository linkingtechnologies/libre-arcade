# What was changed in the package's JavaScript

The port in `public/` started as the package `milcity-libre-arcade-1.0.0-archaeology.zip`'s `src/` and `index.html`, copied byte for byte (SHA-256 below) and changed only where the comparison with the original, or the way the page is put together here, called for it. The reason for each change is in `specs/port-map.md` ("What the oracle found in the package's port"); this is the list of files.

| File | Package's SHA-256 | Now | Lines changed |
|---|---|---|---:|
| `src/ai/historical-ai.js` | `1c9a186cd08281adeb6829341c3645ea6dcd8a3cf060d29c9eb19e624b15c0bd` | `3010a9b079501fdba5db9aead45f9aec3d697c6f1a7e0a971dddc0761e74ead0` | 11 |
| `src/core/combat.js` | `005b6e72ca0270648a09f0fe81c63aa5c813d8b1041184129ab1d663768adcb2` | `ad6bf425c4e27429b20974c6163185706b0da1c2b463fca51d188e8261fd47bf` | 46 |
| `src/core/config.js` | `8e1f259d33263ac5277a0ebf162ca9fb1c34ea1d1c969e0b92ccdc9e7ac51144` | the same file with a licence header | 3 |
| `src/core/game.js` | `df51d232b056919bb4dccc68353bbd7ca6028d541fd07c19a4f8f5da70e5fbae` | `f3fd152c086fed21f333c4c240fe525f72fc9ac5aa44991f369cd65c78fbd403` | 73 |
| `src/core/grid.js` | `d32ed4d77e8a99f203f4db1e4cbc46118682d1075097407a1806b1d504450ccf` | `a88279917c90338f6e8ec95b09e17ba553738549fa5145883fdd41160fa9d1df` | 14 |
| `src/core/player.js` | `ea659dc50715069a980810b67708859170785e0f18fda4856b59194142a2df71` | `fa4642a92e3f94e53a68f52ab0b5c72a1a1ad4c8d2915b8734bc04e1ea8b24bd` | 5 |
| `src/core/rng.js` | `0f13904a946fcdcdf4cd7f3a96e6001ea291ca29a6a304c9ccf6456fea9ca318` | `23cc5ef6eade8a77fc31b2d6162153475acdefb165b112a1af61641bfd6513a3` | 26 |
| `src/ui/app.js` | `4451af1df984ffb81ff5894f02bcf19aadfb5dcfdcca6b0dd9be7a8e26b59e22` | `b88c963e3d5e89a85c19cf65617ef5fe692a74f018cb295bf357d7a26b6babdf` | 89 |
| `src/ui/m5-model.js` | `0bab3cd75572bad8bdd38fc8aa9cd994a7a53cc532941f0312ba70cf25264f4b` | the same file with a licence header | 3 |
| `src/ui/m6-renderer.js` | `32a1882cc50b50d168dd6cf1853b9e8035a27428def927c6528a6a8d07614295` | `0552084b418a6b6f4b1cf89f87bb45aabada752ec7db5b0df5997d05d3e8cf51` | 20 |
| `index.html` | `79e2f50f16a5b38f9991284f23df78d7c06e0e4a11221b6ae61fd90c5fea989c` | `7fee3ed191704771fad36d51c099cedd74ca10ed7fd616b8e3e4c452045d8f93` | 11 |

Every JavaScript file also has a two-line SPDX header added (the "lines changed" count includes it).

By file:

- `game.js`: the clock in milliseconds and the passes at 0, 1000, 2000 ms (`advance`, `pass`); each player decides on its own victory in its own pass (`checkWin`); the training game ends when the person loses; the computer plays after winning or losing; the sources of random seeds (`seeds`, `fresh`); the vibration (`vibrate`); saving and restoring with the new fields.
- `rng.js`: SplitMix64 and the browser's seeds, added.
- `grid.js`: a new generator for each walker; the round of ten walkers is not cut short; nothing can be built on a shielded cell.
- `historical-ai.js`: a new generator for each choice; the opponent is chosen with a generator of its own.
- `combat.js`: scores go only to the person for hits on the computer's city; shields stored as negated cells and ended in the first pass after the end time; the vibration; `hitCell` and `applySpy` no longer take a clock they did not use (the linter).
- `player.js`: a building that is hit while it is under construction shows the flame when it is finished.
- `m6-renderer.js`: a negated cell is drawn with its frame; explosions and the radar are moved only when `step` is true (the page's ten-a-second beat).
- `app.js`: the clock follows real time; seeds are no longer fixed; the options are kept in `localStorage` and there is a vibration option; the hidden key combination; the page stops when it is hidden; the credits in words a player reads; the pictures step only on the beat; a window that is wider than it is tall and at most 420 px high is treated as wide (`shortLandscape`); an unused import and an unused variable removed (the linter); the status text under the map and the game-over banner are HTML laid over the canvas (`setHud`, `setBanner`) and no longer drawn in it.
- `index.html`: the title and the counter of the collection; one more media query, for windows up to 720 px wide and 420 px high that are not taller than wide (a phone held sideways, 568 by 320), which puts the picture and the panel side by side. In the package's page the panel came out of the window by 31 px at that size, found by measuring the page at eleven window sizes. Also the rules of the two HTML elements that carry the status text and the banner (`.hud`, `.hudBanner`): the canvas is shown with nearest-neighbour scaling, from 480 px to about 430, and that drops rows of pixels, so the letters drawn in it came out cut at the bottom (reported by the integrator). And `flex:none` on `.actionCard`: the card of the selected building or weapon has a `min-height` of 94 px inside a column that may shrink, so when the panel was lower than its content the card was squeezed and its last line ("Under construction: about 13s.", "Building operational.", "Ammo ready: 1") came out of the box by up to 33 px (reported by the integrator, then measured).

Not taken from the package: its `tests/` (they compared the port with what its authors had read, and with itself; the tests of this folder compare it with the original), `index_test.html`, the JAR and ZIP files and the pictures of its `reference/` (`reference/SOURCE.md` lists what the archive had and what is kept), and its `package.json`. Its documents are in `package/`.
