# Historical semantic stage data — M25 preservation route

This directory is a deliberately separate licensing component of the Libre Arcade restoration.

## Scope

The eight `stage-*-data.js` files contain only semantic functional data reconstructed from the
2011 NES release: collision/platform/ladder relationships, gameplay object coordinates, stage
counts/timings and binary-certified initialization metadata. They do **not** contain original NES
nametable byte streams, CHR/tile graphics, music, fact-message prose, manual/label artwork, ROM
bytes, or historical C/assembly source.

The algorithms that execute these values live in `../src` and the browser adapters in `../web`;
those are new Libre Arcade code under GPL-3.0-or-later.

## Historical grant and attribution

The preserved 2011 release states that Zooming Secretary is released under a **Creative Commons
Attribution** license and uses the notice **“CC BY 2011 Alexei Bespalko and Shiru”**. The release
does not identify a CC license version or legal-code URL. M25 therefore does not silently convert
that statement into CC BY 3.0, CC BY 4.0, Public Domain, or GPL.

For this preservation component, the semantic historical data are redistributed under the
**original CC BY grant exactly as documented, with version unspecified**.

Attribution:

- Original game/design and source: **Shiru** and **Alexei “PinWizz” Bespalko**.
- Shiru: original code, gameplay design, sound/music, direction, some graphics.
- PinWizz: original visual design, most graphics, fact-message text.
- Semantic reconstruction/adaptation: **Libre Arcade restoration project**.

Changes: the historical level expression was transformed into new JavaScript semantic data and
functional geometry; original NES map/graphic byte streams are not included.

No endorsement by the original authors is implied.

## Provenance anchors

- Preserved release ZIP SHA-256: `c61863bed7961dbba4ee02c20a5c2d3fa96ad0c746a638618f5132b58ab9eea9`
- Certified v1.02 ROM SHA-256: `315adee10052367298959d55256e9f2621381da9f7c839f50832e13516b61770`
- Historical release date/version embedded in ROM/source: `v1.02 30.12.11`

See `../THIRD_PARTY_NOTICES.md` and `../docs/M25_RELEASE_DECISION.md`.
