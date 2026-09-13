# Asset audit

## Decision

**All original audiovisual assets remain QUARANTINE for derivative redistribution.** This is not merely a lack of paperwork: the supplied package contains direct evidence of third-party material.

## Inventory totals — OS4 1.0final package

- `gfx/`: 30 PNG + 1 ICO
- `snd/`: 15 WAV
- `themes/`: 99 PNG + 4 WAV + 11 XML theme/template files
- `doc/`: 13 PNG documentation images + HTML/CSS
- 8 theme directories: `default`, `arctic`, `sea`, `mexico`, `mountains`, `beach`, `sky`, `space`
- graphical bitmap fonts include filenames referring to **Arial**, **Agent Orange**, **BubbleBoy**, and sans variants

Every image/audio asset is enumerated with SHA-256 in `assets-inventory.csv`.

## Embedded metadata findings

Three WAVs are particularly significant:

- `snd/click.wav` contains embedded copyright metadata: **1995-1998 Microsoft Corporation**.
- `snd/cannon_move.wav` contains metadata identifying **A1 Free Sound Effects**.
- `snd/cannon_fire.wav` carries historical conversion metadata identifying `Convert (c) 1994 Jesus Villena` and a 1995 date; this does not establish the sound's copyright owner but confirms an external provenance trail.

No bundled license has been found that makes those third-party sounds safely redistributable under GPLv3.

## Graphics and fonts

Many PNGs contain Macromedia Fireworks software metadata, but no author/license metadata. Tool metadata is not a license. Bitmap-font strips are treated as derived visual assets, not as automatically GPL-covered code.

## Levels and game data — CLEARED UNDER PROJECT GPL SCOPE

The deeper license-scope audit establishes a high-confidence project-level GPL grant for the **61 bundled `.lvl` and 5 bundled `.gms` files**. The key evidence is the upstream root README statement that “Bubble Train is released under the GPL license”, combined with original documentation defining these XML files as the editable game/level definitions and the canonical Bubble Train GPL-2.0-or-later source notices.

They remain historically unmodified and should be accompanied by the original README/GPL text plus the evidence memo; do not invent SPDX headers inside the original XML. See `level-data-license-memo.md`.

This clearance is limited to the bundled original data. It does not automatically cover user-submitted/third-party levels or any audiovisual assets.

## GP2X assets

The GBAX 2006 entry contains reworked/resized graphics, OGG music and changed backgrounds. The archive does not include a source tree or asset-specific license/provenance file. These assets are also **QUARANTINE**.

## Clean-asset policy

For the faithful web restoration, create original/cleared replacements for:

- bubbles and special-bubble icons;
- cannon, HUD, menus and editor UI;
- all backgrounds/themes;
- all fonts;
- music and sound effects;
- icons and decorative documentation imagery.

No Taito, Puzzle Bobble, Worms or other third-party branding/art should be introduced.
