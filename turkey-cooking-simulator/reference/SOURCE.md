# Where the original comes from

## What is kept here, and what is not

The original is <https://github.com/fernjager/game-off-2013> (Robert J. Chen, Benjamin Kwok, Scott R. Mobley, Sheen Kao). Two sets of nine of its files are kept **byte for byte**:

| Folder | Commit | When | Why |
|---|---|---|---|
| `reference/original/` | **`13afa1230761fa24d13d9df4324ccafb504398bc`** "Update README.md" | 2013-12-01 23:25:49 -0800, the last commit of that day | **the version the game follows**; `test/model-oracle.test.mjs` runs its `js/model.js` |
| `reference/package-baseline/` | `56bcde6458af8957f8e439d98df8361a43d2f6e5` "Missing image" | 2013-12-01 06:50:15 -0800 | the version the restoration package followed; `test/package-baseline-oracle.test.mjs` runs its `js/model.js` |

Each set has the code (`js/model.js`, `ui.js`, `main.js`, `screens.js`, `dialogue.js`, `soundmanager.js`), `index.html`, `README.md` and `LICENSE`. They are GPL version 3 code and text of the project itself. Their SHA-256, git
blob SHA-1 and size are in `ORIGINAL_SHA256.txt` and `package-baseline/SHA256.txt`; `test/reference.test.mjs` checks them, and `.gitattributes` keeps them out of any line-ending conversion.

**Not kept:** `js/stories.js` (the dialogue corpus), everything under `res/` (the artwork and the sound; twelve of the sound files are in `public/sounds/` instead, as they are used by the game), `sim/` (a Matlab file, added at 22:51 that day). The project's README says that, unless its credits page indicates
otherwise, the artwork is licensed Creative Commons Attribution-NonCommercial (BY-NC) by Benjamin Kwok, and says that the sound assets are attributed on the credits screen; the dialogue corpus has no statement
of its own. None of these is needed to run the thermal model and none is redistributed (`../THIRD_PARTY_NOTICES.md`).

## The package's record, checked

The restoration package this game started from (`docs/development/package/`) records the commit `56bcde6` and the git blob IDs of nine files
(`docs/development/package/game/reference/SOURCE.md`). Cloning the repository (on **18 October 2026**) shows:

| Claim of the package | Found |
|---|---|
| the repository exists, and `56bcde64…` is a commit of its `main` branch | yes, and it is an ancestor of `gh-pages` and of `main`'s head `f23567d` (2024-12-01) |
| commit time 2013-12-01T14:50:15Z, message "Missing image" | yes (06:50:15 -0800) |
| the blob IDs of `js/model.js`, `ui.js`, `main.js`, `screens.js`, `dialogue.js`, `stories.js`, `soundmanager.js`, `README.md`, `LICENSE` | all nine equal what `git rev-parse 56bcde6:<path>` prints; `stories.js` was not kept, so only its ID was compared |
| `LICENSE` is GPL v3 | yes, the standard text (SHA-256 `8ceb4b9e…`); the package's own `LICENSE` is the same text with `https` links, 35,149 bytes against 35,147 |
| the package's `reference/original/README.md` is "the original README" | it is **not** byte for byte: it has the same text with the links removed, the "Backup Mirror" section and the CC badge image dropped. The files kept here are the original's |
| no file of the original says "or later" | true of the files kept in both sets (checked by `test/reference.test.mjs`); the original has a GPL v3 `LICENSE` and no per-file notice, so the port is `GPL-3.0-only` and "or later" is not assumed |

The original's authors, from its README: Robert J. Chen (programming), Benjamin Kwok (art), Scott R. Mobley (math and dialogue), Sheen Kao (finite elements).

## Which version: the last of 1 December 2013

The repository's history around the package's baseline (the commits of `main` unless said otherwise; times -0800):

| Time | Commit | |
|---|---|---|
| 2013-12-01 00:18 | `e2fe4cd` | tip of the branch `final` (it has an older `model.js`, blob `3bc02ea5…`) |
| 06:50 | `56bcde6` | **the package's baseline** (`js/model.js` = blob `a31dd8d0…`: the analytic series) |
| 16:34 | `47d6ead` | "updated model" |
| 17:38 | `be8ce4c` | "Temperature loss, refined model" |
| 19:08 | `ccd0b1c` | "Bugfixes on scoring and modifier percentage" |
| 21:11, 21:31 | `ffe8f5f`, `9cc608e` | "Fixed cook state ranges", "Less prone to fire" |
| 21:42, 22:21 | `58e5b35`, `32f291a` | "Score tweaks, bug fixes", "Score bugfix and death condition" |
| 22:51 | `918907c` | "Matlab simulation file" |
| 23:06 | `9efe75e` | "Fixed skybug" (the last commit to change `js/model.js` before 2021; blob `26705859…`) |
| 23:25 | **`13afa12`** | "Update README.md": the last commit of the day, and **the one this game follows**. Its code is that of `9efe75e` (only `stories.js` and the README differ) |

The code of `13afa12` is also what the branch `gh-pages` (head 2015-01-09) and `main`'s head (2024) carry for `model.js`, apart from later rewrites (2021 to 2022: the door mechanics and others, which this game does not follow).
Between the package's baseline and `13afa12` the files that matter changed as follows (`git diff 56bcde6 13afa12`):

- **`js/model.js`**: the analytic series is replaced by a finite-difference scheme on 20 radial points ("Sheen Model Stuff"); density 700 kg/m³ and specific heat 2810 J/kg·K (baseline: 1050 and 2000); the layers
  read points 19, 10 and 1; the oven's 80-second re-anchoring is gone; each layer keeps its highest temperature; the cook condition depends on the layer's name, with new ranges for skin and body (e.g. cooked from 80,000 of
  water lost, fire from 600,000) and for the core (cooked from 12,000, fire from 45,000).
- **`js/ui.js`**: opening the oven fully takes 3 C off the oven's air (`setRawTemp`), and each second the door stays open takes 1 C (the baseline had this line commented out); `turkeyCookCounter` counts every tick, skips included;
  serving a turkey whose skin is on fire shows the death screen instead of the result; a fifth help page.
- **`js/screens.js`** (`ScoreScreen`): the skin's raw is -1000 (was 0); the core has a table of its own and is scored with it (slightly cooked 600, overcooked 750; the baseline scored the core with the skin's table); the skin is scored by
  the highest temperature it reached and with a 260 F optimum; the dialogue thresholds are 1800, 1400, 1000, 400 (were 2000, 1200, 625, 300).
- `js/main.js`: only a help-page file name. `js/dialogue.js`, `js/soundmanager.js`: unchanged.

Run next to each other on the same oven (12.2 lb at 350 °F, one tick a second, the code of each run as it is), the two models give for example:

| | baseline `56bcde6` | `13afa12` (this game) |
|---|---|---|
| skin after 1 h | 150.3 °F | 205.0 °F |
| core after 3 h | 155.1 °F (undercooked) | 142.6 °F (undercooked) |
| core after 4 h | 200.3 °F (cooked) | 184.8 °F (cooked) |
| 18.5 lb, core after 4 h | 165.6 °F (cooked) | 150.7 °F (slightly cooked) |
| 12.2 lb at 425 °F, core after 3 h | 176.8 °F | 162.4 °F |

## What was not read

The author's mirror (`fernjager.net/game/index.html`, named in the upstream README) was not opened. The credits screen (`Credits.png`) and `res/sound/Audio Sources.txt` were read in the clone and not kept (`../PROVENANCE.md` says what they credit). The upstream repository was
read at the commits above only; the other branches (`formula`, `Testing`, `Load_Fix`, `DifficultyCheckboxQOL`) were listed, not read. The death screen (`DeathUI`) and its explosion are not ported (neither was in the package).
