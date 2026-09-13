# AGENTS.md — Bubble Train archaeology rules

## Current phase

Audit/specification is frozen at **GO WITH CLEAN AUDIOVISUAL ASSETS**. Faithful-port **Milestone 7 Release Candidate** integrates the cleared original `.lvl/.gms` campaign data, clean vector/theme assets and procedural clean audio. Do not silently switch to enhancement or import quarantined audiovisual content.

## Non-negotiable preservation rules

1. Never modify, recompress, rename-in-place, optimize or re-save files under `/reference`.
2. Verify `reference/MANIFEST.sha256` after copying/moving the repository.
3. Never claim the root GPL-3.0-or-later license relicenses `/reference`.
4. Historical `List.h` (preserved under `reference/`) is quarantine material: do not translate or copy it into `public/src/`.
5. Original graphics/audio/bitmap fonts remain quarantine material unless `specs/assets.md` is updated with actual license evidence.
6. The 61 bundled `.lvl` + 5 `.gms` files are cleared at high confidence under the documented project-level GPL scope. Keep the copies in `public/data/original-levels/files/` byte-identical; do not add headers or normalize them.
7. Resolve historical case/path quirks externally in port code rather than editing preserved XML.

## Port target

- HTML5 + pure JavaScript
- Canvas 2D
- Web Audio
- client-side only
- no framework
- responsive shell, preserving 800×600 simulation coordinates internally
- IT/EN UI
- GPL-3.0-or-later for new code

## Current implementation boundary

Milestone 7 includes path/chain, launcher/cannon, collision/insertion, matching, all shipped special bubbles, deterministic RNG, `.lvl/.gms` loading, all five original campaigns, credits/retry, fastest times, clean vector/theme rendering, procedural clean audio/music, responsive UI and automated release gates.

Remaining release blockers are native differential parity and manual real-browser/device/accessibility testing. Level-editor restoration is optional follow-up work.

## Simulation rules to preserve

- fixed 25 Hz gameplay step
- radius 15 / diameter 30
- touching <=31
- no wall bounce
- split-chain ripple behavior
- line/arc/spiral geometry
- speed bubble reverse/return-to-station behavior
- fastest-time model, not invented point scoring
- original `.gms` progression order and original `.lvl` values

## Enhanced features

Any new power-ups, game modes, characters, levels, altered physics or modernized rules belong behind a clearly documented **Enhanced** mode after faithful parity is achieved.
