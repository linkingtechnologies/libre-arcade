# Licensing status

## Original KludgopolB

The upstream SourceForge project metadata declares two project licenses:

- BSD License
- GNU General Public License version 3.0 (GPLv3)

The recovered original source archive, binary archive/JAR and changelog do **not** contain a standalone LICENSE/COPYING/NOTICE file and the Java sources do not carry per-file licence headers. Therefore the exact scope of the BSD declaration versus the GPLv3 declaration is not documented inside the recovered artifacts. The public restoration package retains only the upstream changelog; both original KludgopolB ZIP archives are externalized and identified by exact hash and upstream location in `reference/EXTERNAL_ARTIFACTS.md`.

For this restoration we treat GPLv3 as the upstream licensing grant used for the Java-derived source port, while documenting the provenance ambiguity explicitly. We do **not** claim that every original file is dual-licensed BSD/GPLv3.

## New restoration code

New JavaScript code in this repository is licensed GPL-3.0-only.

## Original assets and boards

Original runtime graphics and the UK/US-derived board/card data are archival material only. Their individual provenance/licence is not sufficiently documented. They are **not redistributed in the public restoration package** and must not be copied into the playable restoration without a separate asset audit. The original source ZIP is also externalized because it embeds upstream PNG artwork while the recovered package does not document licence scope internally. The playable game uses only the original Grugnetto board packages and separately documented Grugnetto/Kenney assets.

## Grugnetto Go! art reused by this restoration

The user explicitly supplied the current `grugnetto-go.zip` sources and requested reuse of Grugnetto world names and suitable graphics in this project. Original Grugnetto character/coin/collectible artwork copied to `assets/grugnetto/` remains **Copyright (c) 2026 Umberto Bresciani — All rights reserved** and is not relicensed under GPL-3.0. See `assets/grugnetto/NOTICE.md`.

Board package v1.4 additionally copies the three per-world goal-flag frames (`flags/flag_green_a.png`, `flag_blue_a.png`, `flag_red_a.png`) from the same `grugnetto-go.zip` sources, under the same all-rights-reserved terms, for use as the three Portal space icons.

Selected world scenery and props copied to `assets/third_party/kenney/` (including `chain.png`, the pledged-place mark) come from Kenney's New Platformer Pack and remains **CC0 1.0**; its original license is preserved alongside the files.

Nine icons (`assets/third_party/kenney/board-icons/flag_triangle.png`, `campfire.png`, `arrow_counterclockwise.png`, `hourglass.png`, `notepad.png`, `flag_square.png`, `hand_token.png`, `resource_planks.png`, `hexagon_question.png`) come from Kenney's Board Game Icons pack (kenney.nl/assets/board-game-icons) and likewise remain **CC0 1.0**; the license is preserved alongside the files. They replace ad hoc Unicode emoji for the start, detention (base camp), move-to-detention and neutral space types on the illustrated board, the owned-properties counter/place marker (`notepad`), the per-player tint button (`flag_square`) and the Bridge Toll space (`hand_token`) the Repairs space (`resource_planks`) and the Adventure and Setback spaces and cards (`hexagon_question`), since emoji render inconsistently across operating systems and clashed with the board's own art style.

The four world icons (`assets/grugnetto/world-icons/`) are derived from Kenney terrain blocks (CC0) and the Grugnetto acorn; details in `assets/grugnetto/NOTICE.md`.

## Sound effects

Twenty-one short sound files back the twenty event cues (`config/sounds.json` maps events to files, see `specs/sound.md`):

- Eighteen distinct Kenney files under `assets/third_party/kenney/audio/` (four from the New Platformer Pack sounds, six from Digital Audio, eight from Impact Sounds) remain **CC0 1.0**, with each pack's `License.txt` alongside. They were copied from the copies already shipped by the sibling Grugnetto Go! project.
- `assets/audio/dice.wav` and `assets/audio/unlock.wav` were generated for Grugnetto's Goose (same author), which documents them as project-authored with no third-party recordings; they are reused under **GPL-3.0-only**. See `assets/audio/NOTICE.md`.
- `assets/audio/cash-register.wav` is synthesised by `scripts/cash-register.mjs` in this repository (a mechanical clack and a double-struck bell from a seeded noise source), contains no recording, and is distributed under **GPL-3.0-only**.

## UI font

The UI font is Atkinson Hyperlegible Next (Latin subset, variable weight), Copyright 2020-2024 The Atkinson Hyperlegible Next Project Authors, licensed under the **SIL Open Font License 1.1**. The license text is preserved at `assets/fonts/atkinson/OFL-LICENSE.txt`. It replaces GNU FreeSans, which is no longer shipped.

## JAtlantik r36 reference

The audited JAtlantik r36 archive is used only as behavioral evidence for Pazifik. It is not redistributed in the public package because the snapshot has no top-level licence file and bundles board/token graphics. Exact provenance and SHA-256 remain under `reference/jatlantik-r36/` and `reference/EXTERNAL_ARTIFACTS.md`. No JAtlantik code or media is imported by the playable restoration.
