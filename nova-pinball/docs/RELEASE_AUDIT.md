# Nova Pinball Web Restoration 1.0.0 — final release audit

Date: 2026-09-14

## Verdict

**Production-ready for static GitHub/GitHub Pages publication**, subject to the normal final human smoke test after upload.

The 1.0.0 release freezes gameplay, physics constants, scoring, mission order, camera rules and multiball semantics from the user-tested release-candidate line. The final pass changes layout/documentation/packaging only.

## Gameplay / parity scope

Validated by regression tests and prior direct comparison with the historical executable:

- 58 historical table components;
- launch lane and 6-ball flow;
- flippers, walls, bumpers, kickers, gates and triggers;
- nudge / three-strike TILT behaviour;
- Ball and Table camera behaviour;
- historical mission order and scoring;
- Red Giant, Hydrogen/Fusion stages, Black Hole, Wormhole and Supergravity cycle;
- dynamic Matter Jettison insertion after the first main cycle;
- true two-ball multiball and lowest-ball camera tracking;
- high-score flow and 8-entry table.

The principal residual parity risk remains mechanical: the browser collision solver is custom JS rather than Box2D. The restoration has nevertheless been compared interactively against the original and its gameplay feel was accepted during the RC process.

## UI / presentation

Recovered from source/asset review without redistributing historical media:

- historical-style ball-cursor menu and keyboard navigation;
- pre-launch table pan;
- in-canvas Score/Balls HUD;
- 36 px green LED message display and queue semantics;
- Mission Hints modes;
- teal pause presentation;
- animated About presentation;
- Game Over table-scroll transition;
- palette/component styling guided by historical asset proportions and colours;
- procedural 5×7 LED/HUD typography.

Final layout hardening:

- quick controls are centered in a dedicated footer row;
- keyboard instructions occupy a separate row below;
- main and pause menus suppress normal desktop/fullscreen vertical scrollbars and use height-responsive spacing/type on short viewports;
- settings/high-score screens retain scrolling as a deliberate fallback when their content genuinely exceeds the viewport.

## Audio

- Historical soundtrack: **not redistributed**; attribution exists, but surviving redistribution/sublicensing terms are insufficiently clear for this modified public port.
- Historical WAVs: **not redistributed**; 18 runtime-used roles are synthesized with Web Audio.
- Modern music: exactly three declared CC0 OGG loops are bundled under `public/assets/music-modern/` and hash-pinned by the distribution audit.
- Web Audio startup waits for a running AudioContext and recovers from suspended/interrupted browser states.

## Font policy

No TTF/OTF is bundled. The restrictive historical LED font remains excluded. The public game uses a new procedural 5×7 renderer.

## Public archaeology package

Included:

- upstream history and baseline identifiers;
- complete upstream author / contributor / third-party credit record;
- later engine-repository lineage plus Software Heritage preservation reference;
- exact release hashes and official download URLs;
- Windows fused-payload cross-check;
- parity specification;
- UI/asset/audio audits;
- preserved/ported/reconstructed/replaced/quarantined matrix;
- restoration changelog and licensing notice.

Not included:

- original `.love`, `.zip` or `.exe` artifacts;
- historical tracker modules;
- historical WAVs;
- historical font binaries;
- historical raster/XCF media.

This keeps the public repository reproducible and archaeologically useful without republishing media whose rights are unclear for this modified distribution.

## Static-host readiness

- `public/index.html`;
- no framework, bundler, backend or build step;
- no runtime CDN/network dependency;
- `.nojekyll` included for GitHub Pages;
- local Windows/macOS/Linux helper servers included;
- browser storage failures fall back to in-memory session storage;
- focus loss releases held flippers and pauses an active game.

## Automated checks

The repository test suite covers geometry, camera, gameplay, multiball, scores, storage, input, Web Audio startup, historical audio-role mapping, modern music, UI fidelity, UI cleanliness, footer/fullscreen layout and public-distribution quarantine.

The package audit rejects historical media/archive extensions and unexpected OGG files, verifies the SHA-256 of all three declared modern tracks, checks SPDX headers and rejects runtime external URLs.

## Known intentional differences

- custom browser physics instead of LÖVE Physics/Box2D;
- JSON/localStorage instead of `pickle.lua`;
- Z/M + arrows instead of Shift controls;
- original media replaced by clean procedural output;
- optional modern CC0 soundtrack;
- desktop `Leave` action omitted;
- historical startup splash not reproduced;
- browser control footer outside the historical 800×600 play surface.

## Final recommendation

Tag this package **`v1.0.0`** after one final browser smoke test of the uploaded GitHub Pages build. Future table/editor experiments should happen after this preservation baseline is tagged, so Nova Pinball 1.0.0 remains a stable historical restoration rather than becoming a moving construction kit.
