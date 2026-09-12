# Parity status

## v1.0 production restoration

Status: **production-ready preservation build**.

This means the browser version is considered ready for static deployment while keeping a documented distinction between gameplay parity and browser/UI adaptations. It does **not** claim pixel-identical Swing UI reproduction or deterministic replay equivalence with Java's unseeded RNG.

## Core behavior

- [x] 32×32 tile coordinates
- [x] six terrain families
- [x] three distinct random terrain assignments
- [x] basic-tile index selection (10 / 15 / 16 / 17)
- [x] single-player obstacle ratios
- [x] single-player tree counts: 6 / 8 / 10
- [x] exhibition generation
- [x] multiplayer obstacle symmetry
- [x] water border construction
- [x] tree obstacle placement
- [x] tree recursive paint behavior
- [x] tree reload cadence (`reloadTime = 50`)
- [x] 0.8 movement per simulation tick
- [x] non-normalized diagonal movement
- [x] point collision
- [x] horizontal/vertical capture
- [x] obstacle interruption of capture
- [x] edge ownership mirroring
- [x] end condition on zero neutral non-obstacle tiles
- [x] player-control percentage
- [x] single-player tie-as-loss behavior
- [x] original single/multiplayer spawn formulas
- [x] legacy map parser

## Timing and animation

- [x] `FPS = 60`
- [x] `TPF = 3`
- [x] nominal simulation frequency = 180 ticks/s
- [x] simulation accumulator capped around the original 100 ms frame-debt guard
- [x] walking animation state advanced on a separate fixed 60 Hz repaint clock
- [x] animation no longer depends on `requestAnimationFrame` / monitor refresh rate

## Runtime/rendering

- [x] Canvas 2D
- [x] original active character sprites
- [x] original tree sprite crop
- [x] terrain raster composition using the original binary-alpha rule
- [x] no WebGL dependency
- [x] no framework
- [x] no backend or network service required
- [x] full-viewport shell with no page scrolling
- [x] frozen logical arena during an active match
- [x] resize/orientation handled by scaling + letterboxing, without regenerating the match
- [x] keyboard controls
- [x] touch controls as browser adaptation
- [x] single-player hides Player 2 touch controls
- [x] `Esc` / Menu path back to main menu
- [x] English / Italian browser UI
- [x] Instructions / About exposed in the browser shell
- [x] `.nojekyll` included for static GitHub Pages deployment

## Automated tests

Command:

`node --test tests/*.test.js`

Current result: **20 passed, 0 failed**.

Coverage includes timing constants, movement, capture, obstacles, multiplayer symmetry, legacy map format, animation cadence, tree cadence, difficulty constants, spawn formulas, map dimensions, terrain uniqueness, end-game callback, scoring, responsive scene fitting, preservation hash, and browser-shell menu/localization/touch flows.

## Historical executable check

- [x] preserved `Terramancers.jar` launched successfully from a temporary copy
- [x] fixed test screen: 800×600
- [x] original menu captured
- [x] historical case-sensitive `Professor` / `professor` and `Princess` / `princess` mismatches handled only with temporary aliases outside `/reference`
- [x] 800×600 source geometry confirmed: arena = 832×608, centered with negative margins / slight clipping
- [x] Java menu source confirmed as three 400×50 buttons at this resolution: Single Player / Multiplayer / Exit

See `EXECUTABLE_PARITY.md` and `captures/original-java-menu-800x600.png`.

## Explicit non-goals for v1.0

The following are not blockers because they are intentionally outside the preservation baseline:

- pixel-identical reproduction of Swing/Java font metrics and `UIUtils` menu button rasterization;
- deterministic byte-for-byte RNG sequences versus Java `Random` (the original itself is unseeded and constructs `Random` instances dynamically);
- preservation of the historical Linux filename-case failure as an active bug;
- network multiplayer;
- remastered art;
- normalized diagonal movement or modern collision geometry.
