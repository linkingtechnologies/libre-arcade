# Milestone 4 — original campaign data integration

## Goal

Replace the three-level clean demonstration as the runnable game's content source with the **audited historical Bubble Train campaign data**, while continuing to exclude quarantined audiovisual assets.

## Historical data integrated

From the preserved OS4 1.0final package:

- 61 `.lvl` files;
- 5 `.gms` files: `Easy.gms`, `Normal.gms`, `Hard.gms`, `BubbleTrain.gms`, `Everything.gms`.

The 66 XML files were copied byte-for-byte into `data/original-levels/files/`. A direct byte comparison against the extraction source reported **66/66 identical**. Their hashes are frozen in `data/original-levels/MANIFEST.sha256`.

Representative audited hashes remain:

- `Easy.gms`: `2f17d920d046c298ee2d992b5fc92ec00c25bd294a4afe740225239b3199b4f4`
- `Easy/easy-1.lvl`: `dc3151bdd33d24fb6b33db10cbed00c1b76fd5d737ba7e2228a53c827b8fc1c6`
- `Everything.gms`: `87fa1d290a691c58b345ea3c109a44c7b39f16991cf104712c416e78d1cb2602`

## Historical path quirk

The original manifests use lower-case `easy/`, `normal/`, and `hard/`, while the archive stores directories as `Easy/`, `Normal/`, and `Hard/`. This worked on the original target filesystems but fails on case-sensitive web hosting.

M4 intentionally **does not edit the historical XML**. `src/level/original-campaigns.js` maps the manifest paths to the preserved archive casing at load time.

## Runnable game changes

- Options now include the original **Game Select** concept via five historical campaigns.
- Default game is `Easy.gms`.
- Changing the selected game loads its original `.gms` and referenced original `.lvl` files.
- The global fastest-times table now stores/displays the selected `.gms` filename as the original table logically did.
- Theme names from `.gms` are preserved as metadata, but original theme graphics are not loaded.
- Clean-room Canvas drawing and synthesized Web Audio remain the only audiovisual presentation.

## Automated validation

M4 freezes at **55/55 passing tests**.

New full-corpus checks establish that:

- exactly 61 `.lvl` + 5 `.gms` historical files are bundled;
- representative SHA-256 hashes match the audited extraction;
- all five `.gms` manifests resolve correctly on a case-sensitive host;
- campaign lengths are 10 / 20 / 20 / 11 / 50;
- all manifest references collectively resolve all 61 unique historical levels;
- every original level parses, constructs a `LevelModel`, and executes a source-order simulation frame;
- 18 shipped levels are confirmed multi-train levels;
- an additional smoke pass executed 250 simulation frames on each of the 61 levels without exceptions.

## Licensing boundary

This integration follows `specs/level-data-license-memo.md`: bundled first-party `.lvl/.gms` data are classified **GPL-SCOPE — HIGH CONFIDENCE**. The conclusion is intentionally not extended to historical graphics, fonts, music or SFX, which remain quarantined.

The original XML is not annotated or relicensed in-place. Accompanying notices and license evidence live outside the historical files.

## What M4 does not claim

M4 does not claim pixel/audio parity and does not resolve all native-runtime behavior. Final parity still requires differential observation against an original-compatible executable environment.
