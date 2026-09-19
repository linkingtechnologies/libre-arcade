# Disk Field HTML5 M6 — solvability gate

M6 is the release-candidate milestone that converts the earlier solvability investigation into a permanent regression artifact.

## Changes

- added a preserved replay corpus for all 17 active levels;
- added SHA-256 integrity for every action stream;
- added `tests/validate-solvability.mjs`;
- closed levels 15 and 17 without changing game code or level data;
- integrated the 17/17 solvability validator into `npm test`;
- documented the randomized `Dodge!` limitation explicitly.

## Result

All 17 canonical replays finish on the production engine. Levels 15 and 17, previously the last unresolved automatic-search cases, finish in 285 and 190 ticks respectively.

M6 changes no physics, level geometry, gameplay rule, presentation asset or audio behavior from M5.
