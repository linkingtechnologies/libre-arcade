# Original Disk Field — reference index (no historic binaries)

This folder intentionally contains **metadata only**, not original release archives or extracted assets. The original PyWeek source ZIPs 1.0 and 1.01 and their font/music/samples are retained separately in the private preservation collection, not in this public repository.

`upstream-index.csv` contains historic upstream download URLs, upload dates, and the sizes/SHA-256 of the two actually recovered original source ZIPs. `PRESERVED` in that CSV means preserved **in the separate private archaeology collection**; it does not mean the bytes are bundled in this repository. Other snapshots are indexed from PyWeek but were not downloaded/hashed; they are not claimed as locally recovered.

For private reproduction, put the untouched originals at `reference/archives/DiskField v1.0.zip` and `reference/archives/DiskField v1.01.zip`, checking their hashes first. The `.gitignore` excludes `reference/archives/` and `reference/extracted/` from version control. Never publish those asset-containing archive folders as part of this repository or Pages website before the individual asset rights are established.

See [`../archaeology/README.md`](../archaeology/README.md) for the historical dossier and [`../archaeology/inventories/manifest.json`](../archaeology/inventories/manifest.json) for the original per-file hashes.
