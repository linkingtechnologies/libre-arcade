# Milestone 5A — Clean vector core assets

## Goal

Replace the diagnostic gameplay shapes with a clean-room, vector-first asset layer while preserving the source-derived mechanics and keeping every historical audiovisual asset quarantined.

## New assets

The milestone adds a CC0-oriented pack under `assets-clean/`:

- five normal bubble masters: blue, red, green, orange, purple;
- four complete special-bubble masters: Rainbow, Speed, Bomb, Colour Bomb;
- two transparent gameplay overlays used by the renderer for Rainbow and Speed so their underlying gameplay colour remains visible;
- cannon base and rotatable barrel;
- current/next bubble slot frames;
- HUD icons for level, time, credits and pause;
- victory and game-over badges;
- provenance notice and SHA-256 manifest.

All masters are SVG. No historical PNG, JPEG, bitmap font or theme image was traced, sampled or embedded.

## Fidelity choices

Normal bubbles retain the engine's five numeric colour states. Rainbow and Speed are rendered as a normal coloured bubble plus a clean SVG overlay, rather than as fixed-colour sprites; this preserves Rainbow colour changes and Speed's matching colour state. Bomb and Colour Bomb use dedicated clean symbols because their gameplay identity is not conveyed by a normal match colour.

The cannon barrel is drawn as a separate SVG around the same logical rotation pivot, while projectile spawn remains governed by the source-derived 45 px barrel position in the engine.

## Licensing boundary

- `src/`, `demo/` code: GPL-3.0-or-later.
- `assets-clean/`: intended CC0-1.0.
- historical level/game XML: upstream GPL scope documented separately.
- historical audiovisual assets: still QUARANTINE and unused.

## Verification

- SVG masters successfully rasterize through CairoSVG.
- Bubble readability was inspected at the gameplay-scale 30 px diameter.
- Browser renderer has Canvas fallbacks if SVG loading fails.
- Automated gameplay suite remains unchanged and passes in full.
