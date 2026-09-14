# Preservation matrix

The restoration deliberately distinguishes historical material from newly implemented browser material.

| Area | Status | Treatment in 1.0.0 |
|---|---|---|
| Table geometry | **ported / preserved as data** | The 58 historical table components are represented in `public/data/table.json`, derived from `nova.pinball`. |
| Mission order and scoring | **ported** | Reimplemented from the v0.2.3 gameplay source and frozen by regression tests. |
| Ball/flipper numeric parameters | **ported where equivalent** | Historical constants are retained where the clean browser solver has a direct equivalent. |
| Physics engine | **reconstructed** | New framework-free JS collision solver; LÖVE Physics/Box2D is not embedded. Mechanical feel is parity-tested against the original. |
| Camera behaviour | **ported** | Ball-follow/Table modes, vertical easing/bounds and multiball lowest-ball tracking follow the historical behaviour. |
| Menu/HUD/LED behaviour | **reconstructed from source behaviour** | Browser/CSS/Canvas implementation follows the historical hierarchy, message queue, pause language and transitions. |
| Historical raster art | **reference only / not redistributed** | Inspected for proportions/palette; public build redraws the table procedurally. |
| Historical LED font | **quarantined / replaced** | `Advanced LED Board-7` is not bundled; a new 5×7 procedural dot renderer is used. |
| `Erbos Draco Open NBP` font | **not required** | Historical package notice identifies CC BY-SA 3.0, but the public build remains font-binary-free. |
| Historical WAV SFX | **reference only / reconstructed** | 18 runtime-used roles are synthesized with Web Audio; original WAV bytes are not included. |
| Historical Beyond tracker soundtrack | **quarantined** | Attribution is known, but redistribution/sublicensing terms for the modified port are not documented clearly enough. |
| Modern background music | **new optional modernization** | Three CC0 OGG loops under `public/assets/music-modern/`; disabled by default in the archival setting. |
| High-score persistence | **replaced** | JSON/localStorage with safe in-memory fallback instead of historical `pickle.lua`. |
| `pickle.lua` | **quarantined / replaced** | Historical header says only “Freeware”; no copy is included. |
| Desktop Shift controls | **adapted** | Z/M and arrow keys replace Shift to avoid Windows Sticky Keys; touch controls are an additional browser adaptation. |
| Desktop `Leave` menu action | **omitted** | Normal browser pages cannot reliably close their own tab/window. |
| Original loading/splash sequence | **documented, not reproduced** | Non-gameplay presentation remains an intentional difference. |

The original artifacts themselves should be preserved locally, unchanged, using the hashes in `reference/MANIFEST.md`.
