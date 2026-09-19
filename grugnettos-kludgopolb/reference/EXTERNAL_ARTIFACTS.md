# External archaeological artifacts

The audited upstream artifacts below are intentionally **not included** in the public Grugnetto's KludgopolB package. Their exact identities are retained so a private archaeological workspace can be reconstructed from independently retrieved originals without bundling uncertain third-party media into the distributable game.

## KludgopolB.zip

- Original filename: `KludgopolB.zip`
- Role: original runnable Java distribution
- SHA-256: `b72f129a7543780ec54d56b2b42fb176564863afc9999748cc78419ef79fd4a1`
- Original upstream project: https://sourceforge.net/projects/kludgopolb/
- Files page: https://sourceforge.net/projects/kludgopolb/files/
- Audited release date: 2012-12-24

Reason for exclusion: the runtime archive contains original board definitions/card stacks based on UK/US regional commercial property-trading variants plus runtime graphics whose individual provenance/licensing is not sufficiently documented. None of those materials are needed by the Grugnetto runtime.

## KludgopolB_src.zip

- Original filename: `KludgopolB_src.zip`
- Role: original Java source archive
- SHA-256: `5951cf49b010dbcf6be4a7f30d6936c12ba8c374ed546d4b1b0e42b4a1c240dc`
- Original upstream project: https://sourceforge.net/projects/kludgopolb/
- Files page: https://sourceforge.net/projects/kludgopolb/files/
- Audited release date: 2012-12-24

Reason for exclusion: the archive is mostly Java source but also embeds original PNG artwork (`icon.png`, `iconlarge.png`, `jpcardicon.png`). The recovered archive contains no standalone licence text and no per-file licence headers, while SourceForge metadata lists BSD and GPLv3 without documenting their exact scope. The restoration therefore records the source snapshot as archaeological evidence but does not redistribute the blob in the public package.

## jatlantik-code-r36-trunk.zip

- Original filename: `jatlantik-code-r36-trunk.zip`
- Role: JAtlantik r36 source snapshot used to document the historical `SimpleAI` / `pazifik` behavior
- SHA-256: `1850680fc548d3b6621331fdec7677ecd3bbbd75aa7211d42de62d93d8000dfd`
- Original upstream project: https://sourceforge.net/projects/jatlantik/
- Historical revision: r36 (2007)

Reason for exclusion: the snapshot contains Java source plus bundled board/token graphics and no top-level `LICENSE` or `COPYING` file. SourceForge metadata identifies GPLv2, but the public restoration only needs the documented behavior, not the archive itself. Pazifik remains a clean behavioral reimplementation and imports no JAtlantik code or media.

## Private archaeology policy

For private archival work, keep independently retrieved originals unchanged and verify them against the hashes above. Do not copy any of these archives back into a public release without a separate redistribution review. The public package deliberately keeps provenance separate from redistributable runtime content.
