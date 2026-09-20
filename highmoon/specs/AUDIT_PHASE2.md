# HighMoon 1.2.4 — Software archaeology audit, Phase 2

Date: 2026-09-17
Scope: source-exact audit of the user-supplied HighMoon 1.2.4 payload. **No HTML5 port has been started.**

## Executive verdict

HighMoon is an unusually good software-archaeology target. The upstream game line is effectively abandoned, no maintained direct successor was found, the core is small and legible C++/SDL 1.2, and the central trajectory model plus CPU opponent can be reconstructed directly from source.

The code legal gate is positive: source headers are unambiguously **GPL-2.0-or-later**, hence GPLv3-compatible. The original asset gate is not yet positive: graphics have no per-file provenance, and several sound files can be traced to the historical OpenOffice/LibreOffice gallery family. For that reason the recommendation is **GO for preservation/oracle work; HOLD the public Libre Arcade port using original assets until asset provenance is closed or replacements are selected.**

## 1. Preserved artifact

The supplied file is a POSIX/GNU tar archive containing the complete `HighMoon/` tree. It is not gzip-compressed at the point it reached this audit environment.

- preserved filename: `reference/highmoon-1.2.4.tar`
- size: **686,080 bytes**
- SHA-256: **c0a4e71ce83323063df53104aaa46fb3488fa6712d2b7a4827cca48161494f0b**
- internal `VERSION`: **1.2.4**
- historical upstream compressed artifact: `highmoon-1.2.4.tar.gz`
- historical FreeBSD metadata for the compressed artifact: size **413,137 bytes**, SHA-256 **4363ea2455869b886b5777272cddd69ac0a14c7635cdbdafba31eb1c6625bdc6**

The mismatch is expected because the uploaded file is the uncompressed TAR payload. The browser/network path appears to have transparently decompressed the upstream `.tar.gz`. The current audit therefore establishes the source payload, but does **not** claim byte identity with the historical gzip wrapper.

The archive owner metadata is `pat/users`. Most source files and release documents are timestamped around **2006-03-25**, matching the documented 1.2.4 release date.

A full per-file size/SHA-256/provenance manifest is in `audit/reference_manifest.jsonl`.

## 2. Identity and chronology

Upstream author: **Patrick Gerdsmeier** (`patrick@gerdsmeier.net`). The source headers also carry 2004/2005/2006 copyright years on utility/source files.

Upstream site: `http://highmoon.gerdsmeier.net/`.

Documented release line:

| Date | Version | Main evidence/change |
|---|---:|---|
| 2005-01-14 | 1.0 | first release; computer opponent and sound |
| 2005-01-18 | 1.0.1 | source restructure, speed, animation, languages, blackholes/wormholes |
| 2005-01-19 | 1.0.2 | bug/graphics fixes, sound toggle, cleanup |
| 2005-01-26 | 1.1 | object restructure, faster/fixed AI, damage by shot, CLI, five CPU strengths |
| 2005-01-30 | 1.1.1 | moons/rings and fixes |
| 2005-02-04 | 1.1.2 | graphics/constants/languages |
| 2005-02-19 | 1.2 | bonuses/shield upgrades; Heavy, Cluster, announced Exploding Shots |
| 2005-03-11 | 1.2.1 | Blackholes redefined as repulsive Storms; gameplay constants changed |
| 2005-03-19 | 1.2.2 | language segfault fix |
| 2005-07-27 | 1.2.3 | Italian |
| **2006-03-25** | **1.2.4** | Dutch; last upstream release found |

No original CVS/SVN/Git repository was found, so an upstream “last commit” cannot be honestly supplied. The last verifiable upstream development event is the 1.2.4 release on 2006-03-25. The site/download area later shows 2007-08-06 modification activity, but that is not evidence of a later game revision.

FreeBSD, Mandriva/OpenMandriva, AmigaOS 4, AROS and Dreamcast material are packaging/ports, not continuation of the upstream game design. No maintained HighMoon 2, HD, Redux, remake, revival or direct modern fork was found in the 2026 search.

## 3. License

`COPYING` is GNU GPL version 2. The decisive evidence is in the source headers, e.g. `src/constants.hpp:13-15`:

> redistribution/modification under GPL version 2, or (at the recipient's option) any later version.

Therefore:

- code SPDX semantics: **GPL-2.0-or-later**
- GPLv3 compatibility: **YES**
- FreeBSD's independent `GPLv2+` classification agrees with the source-level evidence.

This conclusion applies confidently to the C++ code. It does not automatically settle third-party asset provenance.

## 4. Architecture

Language/runtime:

- C++ (old C++98-era style)
- SDL 1.2
- SDL_image
- raw SDL audio (`SDL_OpenAudio`, `SDL_LoadWAV`, `SDL_MixAudio`); no SDL_mixer
- software 2D renderer

Main modules:

- `main.cpp`: SDL setup, game loop, input, UI orchestration, mode changes
- `vector_2.*`: 2D vector math
- `object.*`: base `Spaceobject`, circular collision helper
- `galaxy.*`: worlds, planets, moons/rings, Storms, Wormholes, UFOs, CPU AI, gravity and collision dispatch
- `shoot.*`: Laser, Heavy, Cluster, explosion animation and trajectory precomputation
- `graphics.*`: sprites, font, stars/visual effects
- `sound.*`: WAV loading/mixing through SDL
- `language.*`: translations

The source is small and conceptually separable, but **simulation and presentation are not actually cleanly separated** in the historical implementation. Several gameplay-relevant state updates occur inside `draw()` methods, and rendering consumes the same global RNG stream as AI/world generation.

## 5. Gameplay reconstructed from source

### Modes and turns

There are exactly two UFOs. Modes are:

- key `1`: human vs CPU
- key `2`: local human vs human
- key `3`: CPU vs CPU demo

No network multiplayer exists.

The active player may move vertically, adjust aim, buy a bonus and charge the shot. UFO x positions are fixed at `BORDERWIDTH=70` and `SCREENWIDTH-BORDERWIDTH=954`; vertical movement is 2 pixels per logic tick. Aim changes by exactly 1 degree per logic tick.

Holding the fire key increments `shoot_power` by 1 per tick up to 100. Initial projectile speed is `shoot_power * 3`, so the nominal range is 0..300 game velocity units.

A historical input quirk exists: once `targeting` has become true, **any SDL `KEYUP` event** fires the shot, not specifically release of the fire key (`main.cpp:229-236`). This should be captured as historical behavior before deciding whether a user-facing restoration deliberately fixes it.

After the active shot finishes, `next_Player()` toggles the player. A normal Laser/Heavy starts with `moving_time=700`, decrements before integration, and returns on zero; therefore at most **699 integration steps** occur, i.e. about **20.97 seconds** at 30 ms/tick.

### Shield, damage and victory

Initial shield: `MAXENERGY=100`.

Damage formula on UFO collision:

`damage = int(projectile_speed / 10 * projectile_weight)`

then shield is clamped at zero.

The visual `Explosion` object never collides and never applies area damage. Damage is caused by the projectile collision itself; explosion is animation/audio only.

Victory is reached when one UFO's shield reaches zero. There is no independent score system. `old_scores` in UI code is only an animated shield-display value. Winner display lasts `WINNINGWAIT=400` game frames, roughly 12 seconds, then the match is reset.

### Bonuses and weapons

Bonus counter ranges 0..4:

- 1: +5 shield
- 2: Heavy Shot, if current bought weapon is Laser
- 3: Cluster Shot, if current bought weapon is Laser
- 4: +25 shield

Shield bonuses are not capped at 100; shield can exceed the starting maximum.

Heavy and Cluster are one-shot purchases and reset to Laser after firing. There is no ammunition inventory.

**Laser**: projectile weight 1.

**Heavy**: projectile weight 2. Despite historical comments suggesting lower gravity, projectile weight is not used by trajectory physics. At identical start state Heavy and Laser follow the same path. Heavy's weight matters to the UFO damage formula, approximately doubling damage at the same impact speed.

**Cluster**: the main projectile follows the same gravity law. On impact it spawns five Laser children. Child speed is `parent_speed / 5 * 3 = 0.6 × parent_speed`. The five angles relative to the impact-vector angle are exactly **-75°, -45°, -15°, +15°, +45°**. This is not a symmetric ±60° or ±75° fan; the code's starting angle and five 30° increments produce this exact sequence.

**Exploding/Funghi**: this is the strongest incompleteness finding. `NEWS` 1.2 announced “Exploding Shots”, `shoot.hpp` still documents `Funghi - Explodes and destroys in a wide-range`, and enum `WEAPON_FUNGHI=3` survives. But there is no Funghi class. `Ufo::shoot()` instantiates `funghi_shoot` as a **Cluster**, normal weapon cycling never reaches Funghi, and the bonus system cannot buy it. In 1.2.4 the feature is vestigial/unreachable in normal play.

## 6. Exact gravity and projectile integration

The central routine is `Galaxy::calculate_nextPos` (`src/galaxy.cpp:1217-1230`).

Let projectile position be `p_n`, velocity-like vector `v_n`, and each top-level galaxy object `i` have position `q_i` and scalar weight `w_i`.

For each body:

`r_i = q_i - p_n`

`d_i = ||r_i||`

The code creates a vector toward the body with length `w_i / d_i`, therefore:

**Δv_i = w_i * r_i / d_i²**

and its magnitude is:

**||Δv_i|| = |w_i| / d_i**

All top-level contributions are summed:

**v_(n+1) = v_n + Σ Δv_i**

Then the new position is:

**p_(n+1) = p_n + 0.03 * v_(n+1)**

because `SHOOT_INTERVAL=30` ms.

This is **not Newtonian gravity**. Newtonian acceleration magnitude falls as `1/r²`; HighMoon's velocity increment magnitude falls as `1/r`. There is no mass of the projectile in the force law, no gravitational constant, no physical units, no softening term and no explicit minimum-distance clamp.

The update ordering is semi-implicit/symplectic-Euler-like: update velocity first, then position from the updated velocity. However, the gravity increment itself is not multiplied by the 0.03 s timestep, so the quantities are game units rather than a dimensionally physical acceleration model.

### Gravitational weights

- Jupiter: **350**
- Earth: **300**
- Mars: **200**
- Venus: **180**
- Saturn: **250**
- Storm/old Blackhole: **-100**
- Wormhole: **50 in the constructor**

`constants.hpp` contains `WEIGHT_WORMHOLE=100`, but the actual Wormhole constructor sets `weight=50`; the constant is stale/unused for the live Wormhole behavior.

### Multiple bodies

All **top-level** galaxy objects contribute every integration tick; their vectors are linearly summed before the velocity update.

### Critical moon finding

The official concept describes shots influenced by planets and moons, but the 1.2.4 implementation's gravity loop iterates only the top-level `Galaxy::objects`. Planet child `Stone` objects (moons and Saturn ring stones) are not included and have no live gravitational weight. Therefore:

**moons/ring stones collide with shots but do not exert gravity in 1.2.4.**

This is an important source-vs-description discrepancy to preserve, not “correct” during the port.

### Storms

The old `Blackhole` class is the 1.2.1-era Storm. Its weight is `-100`, so the same formula yields a vector pointing away from it: shots are repelled. Its collision handler is empty, so contact itself does not destroy/consume the shot.

### Wormholes

Wormhole live weight is +50. Its exit offset components each have magnitude in [150,350), with independently randomized sign. On collision it replaces projectile position with `wormhole_position + exit_offset`; **velocity is unchanged**.

### Collision model

Collision is center-distance circle overlap:

`distance_centers <= (width_a + width_b)/2`

There is no swept collision. Projectiles integrate their full 30 ms step and then collision is tested, so high-speed tunneling is theoretically possible.

Collision dispatch tests top-level objects in array order, then UFOs, and returns on the first match.

## 7. CPU opponent

The CPU is much more interesting than a simple angle heuristic.

It performs a **stochastic numerical trajectory search using the same gravity integrator as live shots**:

1. choose random candidate UFO y in integer range 100..567;
2. choose power 10..99;
3. choose angle uniformly over approximately 0..2π;
4. form the same start offset (+60 along aim direction) and speed (`power*3`);
5. simulate a path with `Shoot::calculate_ShootPath`, which calls `Galaxy::calculate_nextPos` up to 700 times;
6. test each stored point against an expanded target area;
7. if not found, try another random candidate on the next game tick.

Difficulty is implemented by hit-area tolerance, not smarter strategy. The factors are:

| Display level | Factor | Effect |
|---|---:|---|
| NOVICE | 10 | largest tolerated target area, least precise |
| RECRUIT | 8 | |
| SOLDIER | 6 | default |
| OFFICER | 3 | |
| GENERAL | 1 | tightest area, most precise |

The hit-test width passed to the opponent is `8 * factor`, so lower factor means the candidate path must pass closer to the real target.

The search counter starts at 150, then tests `if (--searches < 0)`. Consequently it falls back after **151 failed candidates**, accepting the latest random configuration even when it was not predicted to hit.

Once a candidate has been chosen, the CPU physically moves the UFO at the normal 2 px/tick, rotates by the normal 1°/tick and charges power by the normal 1 unit/tick until it reaches the candidate, then fires.

Weapon policy is primitive:

- bonus 1 is bought if shield <40;
- bonus 2 / Heavy is bought with 20% probability while searching;
- bonus 3 / Cluster is bought with 80% probability;
- no strategic target choice is needed because there are only two players;
- no memory of previous shots is kept;
- no analytic trajectory solution, gradient search or ballistic inversion exists.

The AI is therefore best described as **Monte-Carlo/brute-force candidate generation + exact numerical path simulation + tolerance-based acceptance**.

### AI prediction is not perfectly identical to live collision

`calculate_ShootPath` evolves doubles, but stores each predicted x/y as **integers** before target hit-testing. Live projectile collision uses double positions. Thus the AI's prediction is an integer-sampled approximation of the same integrator.

There is also a historical cache bug: trajectory precomputation caches only last start vector and last direction. The cache key does not include the galaxy/planet state. Reusing exactly the same start+direction after a galaxy/state change can return a stale path.

## 8. Worlds and procedural generation

There are **no external level/map files** and no editor. World generation is hard-coded/procedural in `Galaxy::create`.

`MAXPLANETS=9`, `MINPLANETS=5`; the normal random expression yields 5..8 top-level bodies.

For each body, random type is integer 0..7:

- case 5: Storm
- case 6: Wormhole
- all other values: Planet

So under an ideal uniform `rand()`, nominal probabilities are 75% Planet, 12.5% Storm, 12.5% Wormhole.

Positions are generated approximately within x=[220,804), y=[0,768), retrying until spacing tests do not overlap existing objects.

Planet subtype is random 0..4:

- Jupiter, weight 350, 1..3 moons
- Earth, weight 300, 0..1 moons
- Mars, weight 200, 0..1 moons
- Venus, weight 180, no moons
- Saturn, weight 250, 20..34 ring stones

The world is seeded with `srand(id)`. This makes it deterministic only relative to a particular C library `rand()` implementation. Identical numeric seeds are **not sufficient for cross-platform deterministic reproduction**.

After generation, top-level bodies start at y=-600 and descend through a “Big Bang” animation toward their target y. That motion is implemented in `draw()`, not in the logic integrator.

## 9. Rendering is part of historical state evolution

This is the biggest fidelity trap for a clean modern architecture.

Historically, `draw()` is not presentation-only:

- `Planet::draw()` applies impact-induced planet displacement and halves the stored hit vector;
- `Stone::draw()` updates moon/ring orbital positions and phases;
- `Galaxy::animate_BigBang()` moves top-level bodies toward final positions;
- `Extra::init()` is invoked from the draw path;
- projectile, Storm, Wormhole, Extra, star and winner effects consume `rand()` while rendering.

At the same time world generation and CPU AI also use the global C `rand()` stream.

Therefore **rendering changes future gameplay randomness**, even though it should conceptually be cosmetic. A modern port that simply gives simulation and rendering independent RNG streams would improve architecture but would not be tick-faithful to the historical program after RNG-sensitive events.

For preservation, the clean future engine should still separate simulation and rendering, but a compatibility layer/oracle must explicitly model the historical RNG call ordering where exact replay matters.

## 10. Asset audit

There are 30 bitmap/image assets (including root icon) and 8 WAV effects. There is **no music**.

No per-file copyright/author/license metadata was found in the archive. Several GIFs identify GIMP as creator software but not the human author/source.

The planet/moon graphics are the highest-priority provenance items because they are texture/photo-like and have no source credits.

Audio evidence is stronger. Comparison against the installed LibreOffice gallery and public package inventories shows that `curve.wav`, `kling.wav`, `laser.wav`, `pluck.wav`, and `strom.wav` share the same names, frame counts and extremely close PCM content with OpenOffice/LibreOffice gallery samples. For `kling/pluck/strom`, the HighMoon files are effectively 8-bit conversions of the corresponding 16-bit samples; `curve/laser` differ only at tiny sample-value levels consistent with resaving/conversion. This demonstrates third-party lineage, not necessarily a licensing problem, but it means HighMoon's broad GPL statement cannot by itself establish original authorship.

`audit/asset_manifest.csv` contains SHA-256 and quarantine state for every asset.

Current legal treatment:

- **code: cleared**
- **graphics: quarantine pending provenance**
- **audio: quarantine pending historical source/license mapping**
- **music: none**

## 11. Completeness, dead code and bugs

No live `TODO`/`FIXME` markers were found. Core gameplay is mature: human/CPU, human/human and CPU demo modes work conceptually; world generation, five AI strengths, shield bonuses and two special weapons are implemented.

However, 1.2.4 is not perfectly “feature complete” relative to its own history:

- announced Exploding/Funghi weapon is vestigial/unreachable and falls back to Cluster implementation;
- `WEIGHT_WORMHOLE=100` is stale while actual Wormhole weight is 50;
- trainer mode and thread mode are compile-time disabled experimental paths;
- thread mode comment explicitly says it did not run faster;
- path precomputation cache ignores galaxy state;
- human shot can fire on unrelated key release once charging began;
- collision is discrete and may tunnel;
- one sound bounds check accepts an unused out-of-range ID value, though normal enums never invoke it.

Best classification: **mature, playable, effectively abandoned, but with a few vestigial/incomplete features and historical quirks** — not a pristine “final polished” release.

## 12. Oracle strategy

A schema and implementation plan are provided under `oracle/`.

The oracle must instrument the historical C++ source rather than first reproducing it in JavaScript. Each shot should capture exact world state, launch state, every body gravity contribution, velocity/position before and after each 30 ms integration tick, first collision, teleport, cluster spawning, damage and turn-end reason.

Crucially it must also record the C RNG stream because rendering and AI share it. The reference metadata must include compiler, OS/libc, SDL versions and `RAND_MAX`. Decimal doubles should be logged at 17 significant digits and ideally accompanied by raw IEEE-754 bit patterns.

A source-only oracle patch is feasible. Running a canonical historical oracle requires an SDL 1.2-compatible build environment/reference platform; this audit environment does not currently have the SDL 1.2 development stack installed, so no claim of executed historical traces is made yet.

## 13. Libre Arcade decision

### Archaeological value
**High.** The unusual inverse-distance gravity, procedural multi-body worlds, repulsive Storms, teleporting Wormholes, source-visible quirks and simulation-based CPU make this more than a generic Worms clone.

### Abandonment
**Strongly supported.** Upstream development ends at 1.2.4 in 2006; later evidence is site maintenance, distro packaging and ports.

### Successor
**No direct modern successor found.**

### Code license
**PASS: GPL-2.0-or-later, GPLv3-compatible.**

### Asset license/provenance
**HOLD.** Project-wide GPL intent exists, but third-party lineage is demonstrable in audio and graphics lack provenance detail.

### AI preservation value
**High.** The AI is a compact historical example of stochastic search using the game's actual nonlinear trajectory simulator.

### Physics preservation value
**Very high.** Formula, constants and update order are fully recoverable from source. It is deliberately non-Newtonian and should not be “corrected”.

### Port difficulty
**Moderate for a behaviorally similar game; medium-high for a forensic/tick-faithful restoration.** The core mathematics is small. Exact replay is complicated by libc `rand()`, rendering-side state mutations and shared RNG consumption.

### Preservable behavior percentage
The mathematical projectile core is essentially **100% specified by source**. For the whole game, **90–98% behavior should be directly preservable** without needing guesswork. A controlled reference build plus RNG/oracle instrumentation should make effectively all gameplay-significant behavior reproducible; what cannot be guaranteed generically is cross-platform bit-for-bit equivalence to every historical Linux/Windows build because C `rand()` and floating-point/library details can differ.

## Final gate

**Do not start the HTML5 port yet.**

Proceed next with two preservation tasks:

1. build/instrument a historical 1.2.4 oracle and capture canonical JSONL trajectories/AI decisions;
2. close or replace original asset families.

After those two gates, the requested target — vanilla JavaScript + Canvas 2D + Web Audio, deterministic simulation separated from rendering — is technically appropriate. The port should preserve the historical formula and behavior first, with any “fixed” mode (true moon gravity, fixed Funghi, cleaned input, independent RNG streams) explicitly separated from the archaeological mode rather than silently changing the original.
