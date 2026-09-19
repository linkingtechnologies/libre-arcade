# Third-party notices

Grugnetto's KludgopolB is distributed under **GNU GPL version 3 only**
(`GPL-3.0-only`) for its own code. The materials below keep their own terms and
are not relicensed by it. An overview table is in
[`PROVENANCE.md`](PROVENANCE.md).

## KludgopolB (Java, SourceForge)

- Used for: the seven CPU personalities, the property valuation model and the
  CPU trading logic, ported to JavaScript (see `specs/port-map.md`)
- Upstream project: https://sourceforge.net/projects/kludgopolb/
- Files page: https://sourceforge.net/projects/kludgopolb/files/
- Audited release set: 2012-12-24 (`KludgopolB.zip`, `KludgopolB_src.zip`,
  `changelog.txt`)
- Upstream licence: SourceForge metadata lists BSD License and GNU GPL v3. The
  recovered archives contain no licence text and the Java sources have no
  per-file licence headers, so the scope of each declaration is not
  documented.
- Treatment: the port is treated as derived under GPLv3, without claiming that
  every original file is dual-licensed. The archives are not redistributed
  because they embed original PNG artwork (`icon.png`, `iconlarge.png`,
  `jpcardicon.png`) and UK/US board and card data whose licence scope is
  undocumented; their SHA-256 hashes are in `reference/EXTERNAL_ARTIFACTS.md`.
- Preserved here: the upstream `changelog.txt`, byte for byte, in
  `reference/changelog.txt`.

## JAtlantik r36 (Java, SourceForge), behavioural evidence only

- Used for: documenting the behaviour of `atlantik.ai.SimpleAI`, which
  Pazifik reimplements from scratch
- Upstream project: https://sourceforge.net/projects/jatlantik/
- Revision: r36 (2007), `jatlantik-code-r36-trunk.zip`
- Upstream licence: SourceForge metadata identifies GPLv2. The snapshot has no
  top-level `LICENSE` or `COPYING`, and "or later" has not been verified.
- Treatment: no JAtlantik code or media is imported, translated or bundled, so
  no JAtlantik licence grant is relied on. The archive bundles board and token
  graphics and is not redistributed. Notes are in `reference/jatlantik-r36/`.

## Kenney New Platformer Pack 1.1, Board Game Icons 1.1, Digital Audio and Impact Sounds

- Author: Kenney (www.kenney.nl)
- Licence: Creative Commons Zero, CC0 1.0
- Files: `public/assets/third_party/kenney/` (props and background),
  `public/assets/third_party/kenney/board-icons/` (nine icons),
  `public/assets/grugnetto-go/enemies/` (CPU pawn sprites) and
  `public/assets/grugnetto/world-icons/` (terrain crops) and
  `public/assets/third_party/kenney/audio/` (sound effects from the New Platformer Pack,
  Digital Audio and Impact Sounds)
- The licence files are kept alongside the assets.

## Project-authored sound effects

- `public/assets/audio/dice.wav` and `unlock.wav`, generated for Grugnetto's Goose by the
  same author with no third-party recordings, are reused here under GPL-3.0-only.
  See `public/assets/audio/NOTICE.md`.
- `public/assets/audio/cash-register.wav` is not third-party: it is synthesised by
  `scripts/cash-register.mjs` and listed here only to keep all sound files in one place.

## Atkinson Hyperlegible Next

- Copyright 2020-2024 The Atkinson Hyperlegible Next Project Authors
  (https://github.com/googlefonts/atkinson-hyperlegible-next)
- Licence: SIL Open Font License 1.1, full text in
  `public/assets/fonts/atkinson/OFL-LICENSE.txt`
- File: `AtkinsonHyperlegibleNext-latin-wght.woff2` (Latin subset, variable
  weight)

## Grugnetto Go! artwork

- Copyright (c) 2026 Umberto Bresciani. All rights reserved.
- Files: `public/assets/grugnetto/` (character, coin, collectibles, goal
  flags), reused here at the author's explicit request.
- Not covered by the GPL. See `public/assets/grugnetto/NOTICE.md`.
