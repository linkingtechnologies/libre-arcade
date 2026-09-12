# Restoration status

## Release status

The web port is production-ready for static hosting, subject only to the documented optional native pacing comparison. Core gameplay is source-derived and automatically tested. Historical third-party media is excluded.

## Implemented

- Historical/legal audit recorded.
- Original GPL-covered C source preserved without ambiguous media.
- Renderer-independent deterministic gameplay core.
- 5 ms source-derived gameplay reference step and 25 ms camera step.
- Human vs CPU, human vs human and idle demo mode.
- Original score limit, level progression quirk, paddle/ball speed formulas and fixed-angle rebounds.
- CPU probability model, player warp and random side swap.
- Camera rotation/reset behavior.
- Responsive WebGL renderer with original field dimensions and colors.
- Newly created replacement background, floor and menu artwork integrated into the browser build.
- Keyboard and touch input, including single-player mobile control cleanup.
- Italian/English UI and full How to Play screen.
- Persistent user options and language.
- Fresh match seed in normal play; fixed `?seed=` override for deterministic parity work.
- Localized WebGL failure handling and context-loss recovery path.
- Automatic human-match pause on page hide and stuck-input prevention on focus loss.
- Favicon and static-site metadata.
- Deterministic parity tests.

## Deliberately changed

- Historical BMP textures are replaced by newly created restoration artwork; the original media remain excluded.
- Browser-safe menu behavior replaces process termination.
- The original time-based random behavior is represented by a seedable RNG so tests can be deterministic; normal matches receive a fresh seed.

## Known source-level uncertainty

The original display loop sleeps for 5 ms but gameplay execution is tied to rendering, so absolute historical pacing varied with actual frame/render cost. The web port preserves all observed movement formulas and uses 5 ms as the deterministic reference step. A native side-by-side capture could refine perceived pacing, but this is not treated as permission to silently change source-observed formulas.
