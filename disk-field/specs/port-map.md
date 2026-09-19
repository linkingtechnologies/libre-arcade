# Port map: Disk Field 1.01 (Python) to JavaScript

Baseline: `DiskField v1.01.zip` (PyWeek 5, 2007). The simulation modules are
byte-identical between 1.0 and 1.01, so this map covers both. Python names
below refer to the modules bundled in `tools/oracle_compat/v1.01/lib/` (see
`../PROVENANCE.md` for how those differ from the archive).

## Verification level

Per the collection's verification hierarchy (`../../AGENTS.md`):

- **Simulation core: level 1, executable oracle.** The original Python modules
  are executed headless and their per-tick output is compared with the port:
  7 dynamic cases (2,238 ticks) in `tests/oracle/*.csv` plus 85 vector-field
  samples (5 fixed points on each of 17 levels) in `tests/oracle/field_samples.csv`.
  Discrete columns (collision, hole step, finished, world finished) match
  exactly; continuous columns stay within the tolerances in
  `tests/run-oracle.mjs` (recorded maxima: field sample error about 6e-8,
  position below 0.0025 px). Method and limits: `../archaeology/reports/ORACLE_REPORT.md`.
- **Caveat on the oracle itself.** It runs under current Python and NumPy with
  headless stubs, not under the 2007 Python 2 / Pygame runtime. It does not
  establish bit-exact equivalence with the 2007 executable. The report does
  not itemize which collision faces or corners the seven cases reach, so
  branch coverage of `collideWall` is only as good as those cases.
- **Level data: level 1, generated.** `public/js/levels.mjs` is emitted by
  `tools/export_levels.py` from the original level module, not transcribed by
  hand.
- **Menus, selector, audio, progress: level 3.** Source-level reading of
  `DfMain`, `DfSplash`, `DfSoundManager` (not bundled here) plus the
  behavioral checks in `tests/m2`, `m3`, `m4`, `m5`, `m61`, `m62`.
- **Solvability: replay proof.** `tests/solvability/replays.json` holds one
  input sequence per level; each reaches `world.finished` on the production
  engine. Level 7 (`Dodge!`) is proven for seed `solvability-v1` only.

`public/js/engine.mjs` and `public/js/levels.mjs` are byte-pinned by SHA-256
in `tests/m4-release-checks.mjs`. Change them only together with that test and
a fresh oracle run.

## Numeric model

The original stores disk and field vectors as NumPy `float32` arrays and
promotes to `float64` when a field vector is rotated. The port reproduces
this with `Math.fround` (`f32`, `v2`, `quant`) and per-object flags
(`Arrow.rotF32`, `Arrow.vectorF32`, and the `f32` flag carried by each `v2` vector). `Rect` truncates to integers
like `pygame.Rect`.

## Modules

| Python | JavaScript | Notes |
|---|---|---|
| `DfConstants.py`: `SCREEN_RES`, `TICK_RATE`, `BORDER_WIDTH`, `WALL_WIDTH`, `VECTOR_POINT_SPACING`, `DISK_RADIUS`, `DISK_MASS`, `END_RADIUS`, `BLACK_HOLE_RADIUS`, `COLLISION_LOSS`, `ROT_INC` | `C` in `engine.mjs` | Only the constants the simulation uses. Colors live in `app.mjs`. Crumble/break/blade/power-up constants (`MIN_*_FOR_BREAK`, `BREAK_*`, `BLADE_COLOR`, `POWERUP_*`) are not ported (fossil code). `DISK_MOI` is the literal `200` in `Disk` |
| `DfVector.rotateVector` | `rotateVec` | |
| `DfObjects.RSquaredObject`, `GravityWell`, `Repeller`, `Spinner` | `makeField` (point-source branch) | Orientation and strength are baked into `levels.mjs` by the exporter |
| `DfObjects.AreaObject`, `DefaultGravity` | `makeField` (`spec.rect` branch) | Includes the fuzzy falloff and its corner distance |
| `DfObjects.MovingObject` | `makeField` (`MovingObject` branch) | `isMoving()` becomes `moving:true`. The original's `isMoving()` reads `fFadePerTick`, which is never set, so it would raise for an all-zero mover; no active level builds one |
| `DfObjects.HWall`, `VWall`, `MovingWall` | `makeWall` | `getSpeed`, `update`, killer flag |
| `DfObjects.BlackHole` | hole records in `World` | Position, target, radius |
| `DfObjects.round1DToGap` | `round1DToGap` | Used for the `Dodge!` runtime randomization |
| `DfObjects.roundToGap` | not ported | Only used to place win positions inside level data, so it is applied at export time |
| `DfObjects.WallGenerator` | not ported | Only in the inactive legacy level block. `makeWall` throws if one appears |
| `DfArrow.Arrow`, `calculateArrow` | `Arrow` | Cached `angle`, `normVec` are draw-only and are not needed |
| `DfDisk.Disk.update`, border and wall collision, holes, goal | `Disk.update`, `Disk.collideWall` | Hole sequence steps 30, 29, 4, 3, 2, 1 kept; the `/32` coupling terms kept |
| `DfDisk.Disk.reset` | `Disk.reset` | Restores position and linear speed only. Angular velocity survives, as in the original |
| `DfDisk.Disk.shrink`, `grow`, `giveBlades`, `checkCrumble`, `doThud`, `generateDList`, `draw` | not ported | Fossil code (no call sites in active play), sound and OpenGL rendering |
| `DfWorld.World.__init__` | `World` constructor | 19 by 14 arrow grid at 40 px spacing |
| `DfWorld.World.getVectorAtPoint` | `World.getVectorAtPoint` | Bilinear interpolation over four arrows |
| `DfWorld.World.rotate` | `World.rotate` | 10 degrees per tick |
| `DfWorld.World.checkVictoryForDisk`, `checkVictory` | same names | Goal radius `DISK_RADIUS + END_RADIUS` |
| `DfWorld.World.update` | `World.update` (play), `World.updatePreview` (selector) | Same order: walls, disks, remove fixed contributions of moving fields, move them, re-add. Preview skips disks and victory, like `bPreview` |
| `DfWorld.World.draw*`, `genNextLevel`, `finishLevel` | `app.mjs` render and progression code | Canvas 2D instead of OpenGL display lists |
| `DfLevelData.createLevel`, `levelList` (17 active levels) | `LEVELS` in `levels.mjs`, `runtimeLevel` | `runtimeLevel` re-draws the five `Dodge!` walls with the original ten `random()` calls in the same order and sign pattern |
| `DfSoundManager`, `DfSplash`, `DfMain` | `audio.mjs`, `app.mjs`, `arcade-text.mjs`, `settings.mjs`, `progress.mjs` | Reimplemented, not transcribed. No historical audio or font is used |
| `unlockedLevels.txt` | `localStorage` | Monotonic in the port: replaying an early level never relocks a later one |

## Deliberate departures from the original

- Fixed 30 Hz simulation decoupled from `requestAnimationFrame`. The original
  advances one tick per rendered frame with no elapsed-time term, so its
  wall-clock speed depended on the machine.
- `Quit game` becomes `Credits` (a browser cannot close its own tab).
- Sound and Music stay independent toggles, as in the original options screen, but both are backed by procedural Web Audio instead of the historical recordings.
- Hidden tabs pause active play and clear held input.
- Progress is stored in `localStorage`.
- Optional QA parameters: `?seed=<value>` makes `Dodge!` repeatable, `?all=1`
  unlocks every level. Neither changes any rule when absent.
