# Milestone 11 — player help and package cleanup

## Player-facing help

Added a bilingual **How to play / Come si gioca** dialog reachable from the start screen and pause menu. It explains only what the player needs:

- objective: make groups of at least three same-colour bubbles and clear the moving train before it reaches the end;
- keyboard, pointer and touch controls;
- Bomb, Colour Bomb, Speed and Rainbow behavior;
- music and sound effects can be disabled from **Options / Opzioni → Audio**.

No archaeology, licensing or development jargon is shown in the player UI.

## Package cleanup

Cleanup was deliberately limited to development clutter. Archaeology was retained.

Preserved:

- complete `reference/` archive set and hashes;
- original 61 `.lvl` + 5 `.gms` under `data/original-levels/`;
- legal, provenance, gameplay, IP and source audits under `specs/`;
- executable parity report, disassembly evidence and historical milestone documentation under `docs/`;
- all previous milestone SHA-256 manifests.

Changed:

- moved root-level `MILESTONE*.sha256` snapshots into `docs/manifests/`;
- removed two development-only clean-asset preview PNGs;
- regenerated `assets-clean/MANIFEST.sha256`;
- retained all runtime SVG assets and theme backgrounds.

The cleanup does not alter the historical archives or historical gameplay-data bytes.
