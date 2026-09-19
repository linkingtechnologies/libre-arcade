# Disk Field — public software-archaeology dossier

This directory preserves the **research, evidence and reproducible checks** for Disk Field (Jeremy Appleyard / Tigga, PyWeek 5, 2007). The 1.0 contest submission and post-contest 1.01 are the compared baselines. The original archives and their separately licensed font/audio **are not present** in the public repository. This is a documentation/replay preservation package, not a full binary mirror.

## Begin here

- [`reports/2026-09-17-original-audit.md`](reports/2026-09-17-original-audit.md): full investigation of identity, PyWeek timeline, gameplay, exact physical model, 17 levels, architecture, abandoned features, source licensing and historical successor. **Historical note:** this report was written *before* the HTML5 port and refers to the archival private `reference/archives/` directory. Its statement “No HTML5 port has been started” is true only as of the report date, not the status of this repository.
- [`../reference/upstream-index.csv`](../reference/upstream-index.csv): discovered PyWeek snapshots, official links, chronology and original ZIP hashes. Only 1.0 and 1.01 were physically recovered. “PRESERVED” refers to the separate private collection.
- [`inventories/manifest.json`](inventories/manifest.json): file-by-file original 1.0/1.01 sizes, SHA-256 and change classification. `inventories/levels.csv` catalogs original levels. `inventories/asset-license-audit.csv` details asset provenance/rights gates.
- [`stratigraphy/stratigraphy-v1.0-v1.01.patch`](stratigraphy/stratigraphy-v1.0-v1.01.patch): literal code/text diff between original versions; [`stratigraphy/source-equivalence.json`](stratigraphy/source-equivalence.json): physical core equivalence; [`stratigraphy/version-equivalence.json`](stratigraphy/version-equivalence.json): observed test results. The patch includes excerpts of the original source under its *original custom grant*, not the port's GPL declaration.
- [`reports/ORACLE_REPORT.md`](reports/ORACLE_REPORT.md): methods, 2,238-tick corpus, 85 field observations and limitations. Reproducible machine-readable fixtures are in [`../tests/oracle/`](../tests/oracle/).
- [`../docs/SOLVABILITY_AUDIT.md`](../docs/SOLVABILITY_AUDIT.md): replay proof for each of the 17 levels; actual input sequences and SHA-256 are in [`../tests/solvability/replays.json`](../tests/solvability/replays.json). Dodge! is proven for recorded seed(s), **not all theoretical RNG outcomes**.
- [`upstream-text/`](upstream-text/): the two original text READMEs and 1.01 change log, retained byte-for-byte without embedding the original audiovisual files.
- [`../docs/milestones/`](../docs/milestones/): chronology of the M1–M6.2 port and acceptance steps. Individual milestone reports are historical records, not necessarily the latest release instructions.

## What is and is not claimed

The 1.0/1.01 source-level diff and headless oracle support equal *observed per-tick behavior* for recorded scenarios; they do not prove bit-exact 2007 PC/Python-2 equivalence. The port's validator proves a replay reaches the goal in all 17 levels with selected recorded conditions, not the solvability of every possible random layout for Dodge!. Real desktop/mobile/audio acceptance remains manual (see `../docs/PRODUCTION_CHECKLIST.md`).

## Rights boundary

Original code/levels have a broad, **non-SPDX custom grant** documented in the original README, which should not be silently relabeled GPLv3. New port code is under its repository GPLv3 license; the historically sourced `tools/oracle_compat/v1.01/lib/` code and literal source diff retain the **upstream grant**. The original font MAKISUPA.TTF, music, WAV/OGG recordings and unverified icons are not included, even in the `reference/` directory of this public archive. For specifics see [`../THIRD_PARTY_NOTICES.md`](../THIRD_PARTY_NOTICES.md).
