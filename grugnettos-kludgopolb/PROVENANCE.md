# Provenance

Grugnetto's KludgopolB is a JavaScript restoration of a Java game, plus one
clean behavioural reimplementation of a second Java AI. This table gives the
source, the most precise revision identifier available, the licence and the
treatment of everything that is not new code in this repository. Full detail
lives in [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md),
[`reference/provenance.md`](reference/provenance.md),
[`reference/EXTERNAL_ARTIFACTS.md`](reference/EXTERNAL_ARTIFACTS.md) and
[`specs/licensing.md`](specs/licensing.md).

Neither upstream archive is redistributed, so "Exact revision" is the hash of
the audited archive. Where no licence text exists inside the recovered files,
the row says which kind of evidence stands in for it, and a licence scope that
could not be established is recorded as unresolved rather than assumed.

| Component | Source | Exact revision | Licence | Treatment |
|---|---|---|---|---|
| KludgopolB CPU profiles, valuation and trading logic | KludgopolB, SourceForge (Java, project status Beta) | release set of 2012-12-24; `KludgopolB_src.zip` SHA-256 `5951cf49b010dbcf6be4a7f30d6936c12ba8c374ed546d4b1b0e42b4a1c240dc`, `KludgopolB.zip` SHA-256 `b72f129a7543780ec54d56b2b42fb176564863afc9999748cc78419ef79fd4a1` | SourceForge metadata declares BSD and GPLv3; the archives contain no licence text and the Java files carry no per-file headers | Archives audited and **not redistributed**; logic ported to JavaScript (see [`specs/port-map.md`](specs/port-map.md)); the port is treated as GPLv3 without claiming every original file is dual-licensed |
| KludgopolB UK/US boards, cards and runtime graphics | same archives | same | scope undocumented | Not used and not redistributed |
| Pazifik (`atlantik.ai.SimpleAI`) | JAtlantik, SourceForge (Java) | r36 (2007); `jatlantik-code-r36-trunk.zip` SHA-256 `1850680fc548d3b6621331fdec7677ecd3bbbd75aa7211d42de62d93d8000dfd` | SourceForge metadata identifies GPLv2; the snapshot has no top-level `LICENSE` or `COPYING`; "or later" is not verified | Behavioural reimplementation from the documented behaviour; no JAtlantik code or media is imported; archive not redistributed |
| Grugnetto Go! artwork (character, coin, collectibles, flags) | Umberto Bresciani, `grugnetto-go` | user-supplied sources | Copyright (c) 2026 Umberto Bresciani, all rights reserved | Reused at the author's explicit request under `public/assets/grugnetto/`; not relicensed under GPL-3.0 |
| Kenney New Platformer Pack | kenney.nl | 1.1 (created 2025-12-03) | CC0 1.0 | Selected props, enemy sprites, terrain crops and four sound effects copied with the licence kept alongside |
| Kenney Digital Audio, Impact Sounds | kenney.nl | Impact Sounds 1.0 (created 2019-12-19); Digital Audio unversioned | CC0 1.0 | Six and eight sound effects copied with each pack's licence kept alongside |
| Dice and unlock sound effects | Grugnetto's Goose, same author | none | GPL-3.0-only (project-authored, no third-party recordings) | Two WAV files reused in `public/assets/audio/` |
| Cash register sound | this repository, `scripts/cash-register.mjs` | none | GPL-3.0-only (synthesised, no recording) | One WAV generated in `public/assets/audio/` |
| Kenney Board Game Icons | kenney.nl | 1.1 (created 2024-07-22) | CC0 1.0 | Nine icons copied with the licence kept alongside |
| Atkinson Hyperlegible Next (Latin subset, variable weight) | Atkinson Hyperlegible Next Project Authors | as shipped in `public/assets/fonts/atkinson/` | SIL OFL 1.1 | Shipped with its licence text |
| Engine, controller, save contract, board data, browser UI, tests | this repository | none | GPL-3.0-only | New integration code and content |

## Kind of evidence for the licence claims

- KludgopolB: secondary. SourceForge project metadata only; the recovered
  archives themselves carry no licence text. The BSD/GPLv3 discrepancy is
  recorded, not resolved.
- JAtlantik r36: secondary. SourceForge project metadata only.
- Kenney packs and Atkinson font: primary. The licence files ship with the
  assets.
- Grugnetto Go! artwork: the author's own statement.

The root `GPL-3.0-only` declaration covers this repository's own code and
content. It does not replace the licence of the Kenney assets or the font, and
it does not cover the Grugnetto artwork.
