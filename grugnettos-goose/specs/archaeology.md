# Software archaeology policy

🐽’s Goose studies historical implementations and historical board material while keeping the new browser game independent from quarantined code/assets.

## Evidence levels

1. **Archive evidence** — strongest: exact original archive/repository snapshot plus internal licence/readme/source headers and cryptographic hash.
2. **Project metadata** — useful for discovery and chronology, but insufficient by itself to settle ambiguous licence versions or media rights.
3. **Behavioural observation** — useful for parity, rules and UX study; it does not imply permission to reuse code or assets.

## Admission rules

- preserve research originals untouched locally;
- record SHA-256 for every locally examined original;
- audit code and assets separately;
- do not treat project-page metadata as a substitute for ambiguous internal licensing evidence;
- never incorporate GPLv2-only code into the GPLv3 project;
- keep uncertain media out of the distributable game;
- keep newly authored project code under `/src` and project data under `/data`;
- bundle a historical original in the public repository only after licence and asset admission gates pass.

## Production-release status

Direct audit records exist for SnakesLadders, LudoX 2.1/2.2, glParchis 20181125 and `game-of-the-goose`; `goose-game` has a pinned repository snapshot. Tibetan Sho remains partially audited. None of those quarantined software archives is redistributed in the production package.

The two admitted historical board artworks are bundled locally under `public/assets/boards/original/` with provenance and hashes. Runtime gameplay has no dependency on quarantined material.

See the top-level `ARCHAEOLOGY.md` and `reference/manifest.json` for the complete dossier.
