# MilCity archaeology index

## Canonical historical baseline

`reference/MilCity-Blue_v1.0.5_src.zip` is the canonical source baseline. Its SHA-256 matches the historical SourceForge artifact recorded during the audit.

The archive includes the source tree, README/COPYING, resources and deployed 1.0.5 JAR/JAD pair.

## Historical comparison binaries

The separately recovered `MilCity-Blue_v1.0.3.jar` / `.jad` pair is preserved for comparison. It is **not** the 1.0.5 executable baseline.

## Core archaeology documents

- `archaeology/M1_AUDIT.md` — identity, architecture, baseline and major quirks.
- `archaeology/RULES_1_0_5.md` — reconstructed 1.0.5 rules.
- `archaeology/AI_1_0_5.md` — reconstruction of Easy/Medium/Hard/Madness.
- `archaeology/AI_ORACLE_SPEC.md` — deterministic behavioral-oracle design.
- `archaeology/ASSET_AUDIT.md` — code/asset legal separation.
- `archaeology/M1_5_EXECUTION_AND_ORACLE.md` — executable identity and timing/oracle audit.
- `M14_VISUAL_AUDIO_AUDIT.md` / `M14_TILE_AUDIT.csv` — visual tile and audio/haptic audit.
- `M15_FULL_PLAYTHROUGH_CERTIFICATION.md` — complete-match certification.

## Reference-only original art

`reference/original-assets/` contains the three PNG resources extracted from the canonical 1.0.5 source archive solely for archaeological comparison. The browser renderer does not load them.

## Restoration-history notes

The remaining `M*.md` documents record implementation/parity decisions made during restoration. They are intentionally kept even though the public `CHANGELOG.md` starts cleanly at 1.0.0.
