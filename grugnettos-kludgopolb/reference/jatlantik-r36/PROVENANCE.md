# JAtlantik r36 — reference provenance

Historical source project: **JAtlantik**, revision **r36** (2007).

Audited original snapshot:

- `jatlantik-code-r36-trunk.zip`
- SHA-256: `1850680fc548d3b6621331fdec7677ecd3bbbd75aa7211d42de62d93d8000dfd`
- intentionally **not redistributed** in this public package; the hash is retained in `EXTERNAL_ARTIFACT.sha256` and `../EXTERNAL_ARTIFACTS.md`

Verified directly during the audit:

- historical strategy: `JAtlantik/src/atlantik/ai/SimpleAI.java`
- historical launcher: `JAtlantik/pazifik.sh` and `JAtlantik/Pazifik.bat`
- `JAtlantik/README` describes `pazifik` as the script that runs the AI and connects as a normal network client/player
- source timestamps for the r36-era AI tree are from December 2007

The historical `SimpleAI` source directly confirms the decision rules used to document the clean behavioral reimplementation, including:

- direct purchase only when money is strictly greater than estate price (`money > price`)
- aggressive building whenever construction is legal and cash covers the construction cost
- auction bids of `highest bid + 1`, only while the next bid remains strictly below both nominal price and available cash
- detention preference order: use card, otherwise pay when money is strictly greater than 50, otherwise roll
- no autonomous trade strategy in `SimpleAI`

## Clean behavioral reimplementation boundary

Pazifik in Grugnetto's KludgopolB is **not Java code ported from JAtlantik**. No JAtlantik Java source is imported into `src/`, bundled into the browser runtime, translated line-by-line, or used as a runtime dependency.

Required project wording:

> Historical AI reimplementation based on the documented behavior of JAtlantik r36 SimpleAI.

Upstream project: https://sourceforge.net/projects/jatlantik/

License note: the audited snapshot contains no top-level `LICENSE` or `COPYING` file; upstream SourceForge metadata identifies the project as GPLv2. The snapshot also bundles board/token graphics. For the public-clean release the complete archive is therefore externalized rather than redistributed.
