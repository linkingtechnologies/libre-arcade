# Historical baseline

Project: Turkey Cooking Simulator / GitHub Game Off 2013
Upstream repository: https://github.com/fernjager/game-off-2013
Frozen baseline commit: `56bcde6458af8957f8e439d98df8361a43d2f6e5`
Commit timestamp: 2013-12-01T14:50:15Z
Commit message: `Missing image`

## Relevant baseline files

| Path | Git blob SHA-1 | Role in preservation |
|---|---|---|
| `js/model.js` | `a31dd8d05f5ae3f3e28f685acc71c84257701a78` | Thermal model, oven ramp, water loss, cook classification |
| `js/ui.js` | `56b1513f62ed0834130f74ca73dea9be57481066` | One-second scheduler, skip-time, oven controls, thermometer, door behavior |
| `js/main.js` | `add98496ba36f410419cbdf3d8339e55ca0f0800` | Game state, market setup, CreateJS loop, difficulty modifiers |
| `js/screens.js` | `15fe448779ad2fcef4b6180160c340c03ef95662` | Screen flow |
| `js/dialogue.js` | `22f52befb0a3345602651afcbc6e28b2a0d63f55` | Dialogue engine |
| `js/stories.js` | `dc85f9513489a1570ce322f11163e20617ef6d69` | Original dialogue/story corpus (non-free-content caution) |
| `js/soundmanager.js` | `afc9a392a67e28720dcbec926e66e46e13f89ee6` | Audio behavior |
| `README.md` | `d6b5029bdf89ae9036f39f822b2fa848ab7f7352` | Authors, compatibility, asset licensing statement |
| `LICENSE` | `94a9ed024d3859793618152ea559a168bbcbb5e2` | GPLv3 code license |

The immutable commit plus Git blob IDs are the preservation anchor for M1. This M1 archive does **not** redistribute the original binary art/audio tree; those assets remain reference-only because the upstream README identifies most artwork as CC BY-NC 3.0 and audio attribution varies by asset. A later archival bundle may store those files under `/reference/original/` with explicit per-file license metadata, but they must never be imported into `/src`.

`reference/original/README.md` is retained as licensing/provenance evidence. The mathematical baseline was transcribed into `tests/legacy-reference.js` and compared against the modern module; it is intentionally kept structurally close to `js/model.js` for oracle purposes.
