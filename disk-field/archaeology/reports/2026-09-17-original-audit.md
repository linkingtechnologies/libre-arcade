# Disk Field — Software Archaeology Audit

Audit date: 2026-09-17
Scope: PyWeek 5 submission `DiskField v1.0.zip` and post-contest `DiskField v1.01.zip`.
No HTML5 port has been started.

## Executive finding

Disk Field is an unusually strong software-archaeology specimen. The final contest source and the post-contest source are both preserved and hashable, the simulation/level core is intact, and the 1.01 changes can be isolated cleanly. The core physics and level definitions are byte-identical between 1.0 and 1.01. The post-contest release is therefore best understood as a compatibility/performance/presentation hardening pass rather than a gameplay revision.

The technical audit is positive. The legal asset audit is not yet positive enough for a Libre Arcade redistribution: the bundled Makisupa font has a separate redistribution condition requiring written permission for inclusion in software, the music has attribution but no license grant in the package, and most sound effects lack a sufficiently preserved license chain. Those assets must remain historical-reference material only or be replaced/cleared before a public Libre Arcade build.

## 1. Identity and PyWeek context

- Project: Disk Field
- PyWeek entry: https://pyweek.org/e/TTTT/
- PyWeek entrant profile: `Tigga`
- Package README team: `TTTT`
- Package README member: `Tigga`
- Package README contact: `Jeremy@3feet.co.uk`
- Pygame release page identifies the author as Jeremy (`tigga`). Contemporary 2009 coverage identifies the later browser Disk Field as Jeremy Appleyard, and Kongregate credits `JAppleyard`.
- PyWeek 5 theme: **Twisted**
- Competition dates: 2–9 September 2007
- Result: **winner, individual category**
- Rating: Overall 3.83; Fun 4.05; Innovation 4.07; Production 3.37; 41 raters; DNW 0%; DQ 0%.

There was no single jury citation: PyWeek ranking was participant-voted. Feedback consistently praised the vector-field idea, physics/gameplay integration, originality, level variety and responsiveness, while lower-production comments focused on graphical polish, tutorial clarity, difficulty spikes and the level-selector crash.

The PyWeek diary is unusually valuable. It documents the day-one physics, wall-corner problems on day two, py2exe/PyOpenGL trouble, addition of audio/menu/options, the exact post-contest level-selector fix, and the author's post-mortem on cut features.

## 2. Preserved versions and provenance

### Preserved locally

| Artifact | PyWeek upload | Size | SHA-256 |
|---|---:|---:|---|
| DiskField v1.0.zip | 2007-09-08 20:37 | 2,469,251 B | `d0e69dc0c4f07a886de8bd7be3fb474316b7c21af0c23a47e29fe519df4b141d` |
| DiskField v1.01.zip | 2007-09-25 21:37 | 2,439,482 B | `e12e14c9ba5a3e92635cb4d0510c245129a97b4576a82aadd8531dfba35ec26f` |

Exact archive copies are under `reference/archives/`. Extracted byte-preserving working reference copies are under `reference/extracted/`.

### Upstream sequence visible on PyWeek

The upstream page also preserves links for:

- `DiskField.zip` — 2007-09-02 22:24 — end of day one
- `DiskField v0.2b.zip` — 2007-09-03 20:35 — playable to level 4
- `DiskField v0.3.zip` — 2007-09-04 19:32 — three more levels/new features
- `DiskField v0.5.zip` — 2007-09-05 22:31 — title screen/sound/options
- `DiskField v0.5b.zip` — 2007-09-06 18:26 — mixer/Psyco crash fix
- `DiskField v0.8b.zip` — 2007-09-07 22:50 — NPOT fix for older graphics hardware
- `DiskField v1.0 - Bin.zip` — 2007-09-08 20:43 — Windows executable
- `DiskField v1.01b - Bin.zip` — 2007-11-13 23:00 — updated Windows binary/batch launcher

Those upstream ZIP links are catalogued in `reference/upstream-index.csv`. The current tool session could resolve the upstream URLs but could not obtain binary bytes from the S3 links, so the intermediate archives are **not claimed as locally preserved** and no invented sizes or hashes are recorded.

No authoritative Git/SVN repository was found. For the 2007 line, the PyWeek file archive is the authoritative upstream currently identified.

## 3. Stratigraphy: 1.0 → 1.01

v1.0 contains 43 files; v1.01 contains 33. Across the union there are 27 common files byte-identical, 5 common files changed, 11 `.pyc` files removed, and 1 file (`CHANGES.txt`) added.

All 16 files under `data/` are byte-identical between 1.0 and 1.01. The following core files are also byte-identical:

- `DfConstants.py`
- `DfDisk.py`
- `DfLevelData.py`
- `DfObjects.py`
- `DfVector.py`

The full patch is `audit/stratigraphy-v1.0-v1.01.patch` and per-file hashes are in `audit/manifest.json`.

### Significant source changes

| File/change | Classification | Behavioral interpretation |
|---|---|---|
| `DfSplash.py`: cast every `glGenTextures()` result to `int` | compatibility / bug fix | exact fix for the 64-bit PyOpenGL/ctypes/NumPy level-selector crash documented in the diary |
| `DfSplash.py`: detect `GL_ARB_texture_non_power_of_two`; avoid POT rescale when supported | compatibility / rendering quality | keeps old-hardware fallback but makes text crisper on NPOT-capable cards |
| `DfArrow.py`: cache normalized vector and angle | performance | removes repeated normalization/`atan2` during drawing; simulation vector remains unchanged |
| `DfWorld.py`: reuse cached arrow angle/strength/color state, thinner preview arrows | performance / rendering | draw-side only |
| `DfMain.py`: re-enable `psyco.full()` | performance | contest source accidentally had it commented out |
| `DfMain.py`: `pygame.mixer.pre_init(22050,-16,2,1024)` | audio initialization / compatibility | no simulation rule change |
| `DfMain.py`: print ImportError detail | diagnostics | no gameplay change |
| `DfWorld.py`: remove `bFieldsActive`, `toggleFields()` and alternate fixed-only branch | dead-code cleanup | `bFieldsActive` was initialized `True` and `toggleFields()` had no call sites, so reachable simulation semantics are unchanged |
| `DfArrow.py`: remove unused `setRotVec()` | dead-code cleanup | no call sites |
| remove 11 `.pyc` files | packaging cleanup | no source behavior change |
| add `CHANGES.txt`; README cleanup/music attribution | documentation | no simulation change |

### Does behavior change?

**Tick-domain physics/gameplay: no source-level change found.** The simulation files, constants and levels are byte-identical. The only change touching `DfWorld.getVectorAtPoint()` removes a branch that was unreachable in normal 1.0 execution.

**Wall-clock behavior can change on slow machines.** The simulation advances exactly one simulation tick per rendered frame and does not consume elapsed `dt`. Re-enabling Psyco and making arrow rendering cheaper can therefore help 1.01 remain at the intended 30 frames/ticks per second where 1.0 might drop below it. In that situation 1.01 feels physically faster in real time even though the per-tick trajectory is unchanged.

This is the central archaeological answer to “What changed after the game jam ended?”: **the author hardened the shipping shell around an essentially frozen game design and simulation.**

## 4. License audit

### Code and levels

There is no separate LICENSE/COPYING file. The README contains the package grant:

> Do whatever you like. Would like it if you gave me some sort of credit.

This is a custom, informal permissive grant rather than an SPDX-standard license. Its ordinary-language scope is broad enough to permit modification and redistribution; the credit wording is phrased as a request rather than a condition. For preservation, retain the README and original grant verbatim. For a strict GPLv3 project, do not silently relabel the historical code as GPLv3: preserve the original notice and license new code separately.

`DfLevelData.py` is part of the source package and is therefore covered by the same package grant.

### Assets

See `audit/asset-license-audit.csv` for hashes and status.

- **MAKISUPA.TTF — QUARANTINE.** Its bundled 1998 license says it is conditionally free for personal/commercial use but explicitly requires written permission when included as part of software/collections/libraries distributed publicly, profit or non-profit. This is not suitable for a freely redistributable Libre Arcade bundle without permission. Replace it or obtain permission.
- **tradeyourkid.ogg — QUARANTINE.** The package only says the music is from `multifaros.info.se`; no license terms are included. Attribution is not a redistribution grant.
- **Five named WAVs — QUARANTINE.** Their names strongly resemble old Freesound naming/provenance (`J_Fairba`, `wwwbeat`, `dog`, `SodaBush` plus low sound IDs). The exact historical sound pages/licenses have not been recovered. Freesound used the retired Sampling+ license in that era; even if that inference is confirmed, raw bundled Sampling+ material is not a clean libre asset for unrestricted downstream redistribution.
- **thud.ogg / thud2.ogg / thud3.ogg — QUARANTINE.** No author or license metadata was found beyond the Vorbis encoder tag.
- **icon.ico / icon_pygame.png — provenance uncertain.** They may be project-created and thus package-covered, but there is no explicit credit. Preserve inside the historical archive; replace or provenance-clear for a new public build.
- **Procedural game graphics and level geometry** are code-generated and do not rely on a separate sprite pack.

**Legal gate result:** code/levels are usable under a broad custom grant; original audiovisual bundle is not clean enough for Libre Arcade redistribution.

## 5. Gameplay reconstructed from source

- Goal: guide the black/white disk to the red/black target.
- Primary control: Left/Right rotates the **rotatable/red** component of the vector field. Fixed/blue field components remain fixed.
- Rotation step: 10 degrees per simulation tick while a key is held.
- Every active level contains one disk, although the engine stores a disk list and has partial multi-disk architecture.
- There is no score, lives counter, timer or best-time system.
- There is no manual in-level restart key in the game loop.
- Red/killer walls reset disk position and linear speed to the starting point.
- Pause: P/Pause. Escape exits the current level back to the menu.
- Level progress is persisted as a single integer in `unlockedLevels.txt`.
- Victory for a disk occurs when center distance to target is at most `DISK_RADIUS + END_RADIUS = 30` pixels.
- A world finishes when every disk is marked finished; active levels use exactly one disk.
- After internal level 16 completes, `World(17)` fails initialization and the end screen is shown.

A notable quirk: `Disk.reset()` restores position and linear speed but **does not reset rotation or angular velocity**, so spin survives a killer-wall reset.

## 6. Physics reconstruction

### State and constants

- nominal tick rate: 30 Hz
- screen: 800×600
- disk radius: 20 px
- mass: 1
- moment of inertia: `0.5*m*r² = 200`
- collision loss/restitution factor: 0.9
- per-tick linear damping: ×0.9
- per-tick angular damping: ×0.99
- field rotation per held input tick: ±10°
- vector grid spacing: 40 px
- border width: 16 px
- wall width: 12 px
- no speed clamp or acceleration clamp was found

### Integrator

For an ordinary tick, source order is:

1. `v <- 0.9 v`
2. `omega <- 0.99 omega`
3. `v <- v + F(p)/m`
4. update `omega` from four field samples around the disk rim
5. `p <- p + v`
6. `rotation <- rotation + omega`
7. resolve borders/walls/holes/goal

There is **no elapsed-time `dt`** in these equations. This is a fixed-discrete-step, velocity-before-position Euler-family update (often described as semi-implicit Euler in this form), coupled directly to the render loop. `Clock.tick(30)` only caps the frame rate; it does not catch the simulation up after a slow frame. Consequently the game is **frame-rate dependent in wall-clock time**.

### Angular field coupling

Angular velocity is incremented from four force samples at `(x±r,y)` and `(x,y±r)`, divided by moment of inertia. The implementation is a game-specific torque approximation rather than a general rigid-body solver.

### Vector field

The world stores a 19×14 grid of arrows at 40-pixel intervals. Force at the disk is bilinearly interpolated from the four neighboring arrows.

Each arrow is the sum of:

- fixed field vector
- rotatable field vector

Left/right applies a 2-D rotation matrix to every non-zero rotatable arrow vector.

### Field source types

`RSquaredObject` computes:

`F(p) = R(theta) * (source - p) * strength / ||source-p||²`

Because the numerator has magnitude `r`, force magnitude falls as `strength/r`, despite the class name suggesting inverse-square magnitude.

Specializations:

- GravityWell: attractive orientation
- Repeller: orientation π
- Spinner: ±π/2 rotated force
- AreaObject: constant vector within a rectangle
- Fuzzy AreaObject: linear falloff over one 40-pixel grid spacing, with Euclidean corner distance
- DefaultGravity: whole-screen fixed area field, strength 0.03 downward
- MovingObject: moves and/or rotates a source each tick

### Collision model

Physics is fully custom; no Box2D/Chipmunk/Pymunk-style engine is used.

- Axis-aligned border/wall impacts reflect the normal velocity with factor 0.9.
- Tangential speed and disk angular velocity are coupled by heuristic `/32` terms.
- Moving-wall velocity contributes `/32` to disk linear/angular response.
- Corner impacts use a 2-D reflection matrix built from the corner-to-disk vector, then multiply speed by 0.9.
- Corner collision code has commented-out spin/tangent-transfer experiments; only linear reflection is active there.
- Multiple wall collisions can occur during one tick; a recursive collision-only correction path exists only as commented code.

### Holes

A black-hole hit starts a 30-tick sequence. The disk is visually shrunk/hidden, teleported to the paired white-hole target near the end of the sequence, then restored. Linear/angular velocities are not explicitly zeroed by the teleport sequence.

### Randomness

The engine is not fully deterministic by default. Internal level index 6 (`Dodge!`, displayed as level 7) calls `random()` ten times when it is created to choose starting Y positions and speeds for five moving walls. A deterministic oracle must record/set Python RNG state before level construction. Random selection of thud sounds is physics-neutral.

## 7. Levels

There are **17 playable levels**, internal indexes 0 through 16. `NUM_LEVELS = 16` is the maximum index rather than the count; `levelList` is allocated as `NUM_LEVELS + 1`.

The first 13 have internal names:

0 Intro; 1 Off to the side...; 2 Around a corner; 3 Up we go!; 4 Watch the chute!; 5 Careful around that wall; 6 Dodge!; 7 Be sure to get a run up; 8 Holes; 9 Under and over; 10 Stay on track; 11 Down and up; 12 Black holes!.

Levels 13–16 omit the unused `name` key. The level-selection UI displays numeric labels, so this does not break gameplay.

Level definitions are **hard-coded Python dictionaries and constructor calls inside `DfLevelData.py`**. They are declarative-ish but not external/data-file-driven. There is no parser and no level editor in the package.

Coordinates are screen pixels, mostly derived from the 40-pixel grid. Available level elements include:

- disk start and goal
- fixed/rotatable GravityWell, Repeller, Spinner and AreaObject fields
- fuzzy area fields
- moving area fields
- horizontal/vertical walls
- moving walls
- killer walls
- paired black/white holes

No generic trigger framework was found.

`audit/levels.csv` gives per-level element counts and identifies randomness/killer-wall use.

## 8. Architecture

The historical runtime is a small Python 2/Pygame/OpenGL program (~3,517 source lines including comments/blank lines in v1.01):

- `DfMain.py` — initialization, main loop, keyboard input, level transition
- `DfWorld.py` — world construction, sampled vector field, field rotation, update/render orchestration
- `DfDisk.py` — disk state, integrator, wall/border collision, holes, goal
- `DfObjects.py` — force sources, moving objects, walls, holes, unused generator
- `DfArrow.py` — fixed/rotatable sampled field vectors
- `DfLevelData.py` — all level geometry and parameters
- `DfSplash.py` — menu, options, level selector, pause/end screens, font-to-texture rendering
- `DfSoundManager.py` — music/SFX and options persistence
- `DfVector.py` — vector rotation helper
- `DfConstants.py` — physics/render constants
- `data.py` — data-path helper

Dependencies stated by README/source:

- Python
- Pygame
- PyOpenGL
- NumPy
- Psyco (optional)
- py2exe used for Windows packaging during development

The `.pyc` header magic number in v1.0 is **62131**, placing the compiled cache in the CPython **2.5 bytecode family**. This is strong direct evidence for the historical interpreter generation.

Obsolete/problematic today: Python 2 syntax, Psyco, old PyOpenGL return-type assumptions, fixed-function OpenGL/display lists, historical py2exe packaging, and old NumPy/Python-2 numeric behavior.

The simulation and rendering are not separated: one update is performed for each rendered frame.

## 9. Completeness and archaeological residue

### Contest completeness

High. The final submission has menu/options/audio/level selection, 17 playable levels, persistent unlock progression and an end screen. PyWeek recorded 0% DNW among 41 raters and ranked it first among individual entries.

### Standalone polish

Moderate rather than commercial-polish complete. Contemporary feedback and source evidence show:

- difficulty spikes around later levels
- tutorial conveyed mainly through level design rather than explicit instruction
- fixed-vs-rotatable field interaction could be confusing
- 1.0 level-selection crash on some platforms
- old-hardware NPOT issues addressed during the week
- no score/timer/best-time layer

### Cut/dead features

The package contains substantial fossil evidence:

- `Disk.shrink()`, `grow()`, `giveBlades()` have no call sites
- power-up colors/radius constants exist but no active power-up system
- `checkCrumble()` and crumble-wall machinery exist but are never invoked by active gameplay
- no active level sets `bCrumble=True`
- this aligns directly with the author's post-mortem saying he tried spin-to-break-walls and abandoned it as hard to control
- multi-disk infrastructure exists, but all active levels have one disk and there is no disk-disk collision; the post-mortem explicitly mentions this missing collision work
- `WallGenerator` exists but occurs only in the large inactive/legacy level block after `return 0`
- `DfHelpers.py` is empty
- `DfData.py` is a byte-for-byte duplicate of `data.py` and is unused
- v1.0 `toggleFields()`/`bFieldsActive` and `DfArrow.setRotVec()` are dead and are removed in 1.01
- `MovingObject.isMoving()` references `self.fFadePerTick`, which is never initialized; active moving objects avoid the error because another truthy movement term short-circuits the expression
- `Disk.reset()` preserves angular velocity, a likely gameplay quirk rather than an intended reset invariant

The source also preserves a large inactive/commented experimental level-design stratum after the active `createLevel()` return.

## 10. Oracle status

The original game was **not executable in the current audit container**: only Python 3.13 is installed, with no Python 2, Pygame or PyOpenGL. Therefore no claim is made that a runtime trajectory has been measured from the historical executable in this session.

What is already proven statically:

- all direct disk physics, objects, constants, levels and vector helper files are byte-identical between 1.0 and 1.01;
- the changed `DfWorld` field-sampling branch is behaviorally equivalent in normal execution because the removed alternate state had no call path;
- thus there is no identified per-tick physics change between the two releases.

`audit/source-equivalence.json` records these hashes. `oracle/trace-schema.csv` defines the future historical-runtime trace columns.

For a deterministic historical oracle, record at minimum:

- version
- RNG seed/state before level construction
- level/internal index
- tick
- left/right input
- disk position and velocity
- rotation/angular velocity
- hole step
- completion state
- moving-wall state

Recommended test cases: no-input field drift, sustained left/right rotation, border impact, flat wall impact, all four wall corners, killer-wall reset (including retained spin), black-hole teleport, moving-wall impact, goal entry, and randomized level 6 under a fixed RNG seed.

## 11. Archaeological experiment: “What changed after the game jam ended?”

The evidence is unusually clean:

### Visible during the jam

- wall corners were already identified by the author as problematic on day two;
- PyOpenGL/NumPy/py2exe integration was causing trouble by day three;
- title/menu/audio/options were added late;
- contemporary raters found the game innovative and playable but noted tutorial/polish/difficulty issues;
- one rater captured the level-selector type crash from v1.0.

### Changed after the jam

- exact `glGenTextures` integer conversion for the crash;
- NPOT-aware text rendering quality;
- faster vector-arrow rendering;
- Psyco actually enabled;
- mixer initialization improved;
- dead field-toggle and arrow-setter code removed;
- compiled `.pyc` cache removed from source distribution;
- music attribution added to README;
- no new levels, mechanics or physics constants.

### Left unchanged

- all 17 levels
- disk integrator
- collision logic
- force formulas
- random level-6 layout
- holes
- difficulty order
- no timer/best-time system
- cut crumble/blades/power-up code

The author's own 25 September post-mortem said the forthcoming release would contain no added content, only polish/speed/bug fixes. The source diff confirms that statement with unusually high fidelity.

## 12. Successor line and Libre Arcade decision

A later browser/Flash **Disk Field** by `JAppleyard` was released on Kongregate on 24 July 2009, again described as a physics puzzle based on manipulating vector fields with arrow-key rotation. Contemporary Game Developer coverage names the developer Jeremy Appleyard. Therefore the conceptual lineage does **not** end at Python 1.01.

The historically precise classification is:

**2007 PyWeek Python line: concluded and self-contained** → **2009 browser/Flash remake/successor by the same author identity**.

No later source-code successor/repository was found in this audit.

### Decision matrix

| Criterion | Finding |
|---|---|
| Archaeological value | Very high |
| Contest completeness | High |
| Standalone polish | Medium-high for a jam game |
| 2007 line status | Concluded |
| Later successor | Yes: 2009 Flash/browser Disk Field |
| Code license | Broad custom permissive grant; non-standard |
| Levels license | Same package grant |
| Asset license | **Not clean**; font/music/SFX blockers |
| Physics reconstructability | Excellent |
| 1.0→1.01 stratigraphy | Excellent; mostly compatibility/performance |
| Port difficulty, technically | Low-to-medium once legal assets are replaced/cleared |
| Estimated gameplay-behavior preservability | **~98%** before historical oracle; near-complete rule reconstruction, remaining risk concentrated in Python-2/NumPy numerical edge cases, frame coupling and collision-boundary tolerances |

### Current gate

**GO: preservation and archaeology.**

**HOLD: public Libre Arcade port/redistribution.** The blocker is not the physics or code; it is the audiovisual asset chain, plus the desire to validate collision-edge trajectories with a historical runtime oracle before claiming exact preservation.

Because the full audit is not legally positive yet, this audit deliberately does **not** start or prescribe implementation of the requested HTML5 port.

## Remaining acquisition work

To complete the week-by-week stratigraphy rather than just final-vs-post-final, acquire and hash the six source snapshots:

`DiskField.zip`, `v0.2b`, `v0.3`, `v0.5`, `v0.5b`, `v0.8b`.

The authoritative URLs and dates are already stored in `reference/upstream-index.csv`.
