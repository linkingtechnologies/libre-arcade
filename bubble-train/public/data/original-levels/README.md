# Original Bubble Train level/game data

This directory contains the **61 `.lvl` files and 5 `.gms` files shipped with the audited Bubble Train 1.0-era distribution**.

- `files/` contains the historical XML **byte-for-byte as extracted from the preserved OS4 1.0final archive**. Do not reformat, normalize line endings, change path case, or add SPDX headers to those files.
- `MANIFEST.sha256` freezes the 66 historical XML files.
- `../../../specs/level-data-license-memo.md` documents the high-confidence conclusion that these bundled first-party game/level definitions fall within Bubble Train's project-level GPL grant.
- `../../../LICENSES/GPL-2.0.txt` preserves the GPL version 2 text shipped with Bubble Train. The source notices grant GPL-2.0-or-later for Bubble Train; the memo documents the conservative handling of the data files.

The `.gms` manifests intentionally retain their historical path spelling. In particular, they refer to `easy/`, `normal/` and `hard/` while the archive stores `Easy/`, `Normal/` and `Hard/`. The web port resolves that case mismatch externally rather than editing the originals.

This clearance **does not include** original graphics, bitmap fonts, WAV/OGG audio or other audiovisual theme assets.
