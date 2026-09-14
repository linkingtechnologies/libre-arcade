# Historical asset reference — v0.2.3

This file records visual observations used to guide the clean 1.0.0 renderer. **None of the historical files listed below are redistributed in the public web package.** They remain inside the separately preserved original release.

## Key upstream assets inspected

| Asset role | Historical size | 1.0.0 treatment |
|---|---:|---|
| table background | 660×1022 | procedural black/purple radial field + structural panels |
| menu background | 800×600 | procedural blue/black rotating radial/checker motif |
| menu spikes overlay | 800×600 | approximated in CSS/procedural menu background |
| ball | 30×29 | procedural metallic circle |
| bumper | 80×80 | procedural metallic bumper with yellow halo |
| kicker | 43×92 | procedural yellow insert with purple outline |
| launcher cover | 55×129 | procedural dark-blue launcher cover |
| left flipper | 119×31 | procedural light-grey flipper with pink/red outline |
| stable/red/mission stars | 87×87 class | procedural star-state effects |
| NOVA target sprites | 70×72 class | procedural black/blue inserts + active lime letters |

## Palette observations

These are descriptive measurements/reference colours from the original presentation, not copied raster content:

- table walls: approximately `#37358c`;
- background ray purple: approximately `#260041`;
- structural dark blue: approximately `#264472`;
- flipper body: approximately `#c4c4c4`;
- flipper outline: approximately `#bf5660`;
- active NOVA letters: lime green;
- LED display text: bright green;
- About headings/details: cyan / pale yellow.

## Font policy

The upstream `Advanced LED Board-7` font has restrictive freeware/home-use terms and is not bundled. The package also contains `Erbos Draco Open NBP`, whose bundled notice identifies it as CC BY-SA 3.0, but 1.0.0 deliberately keeps the public restoration **font-binary-free**.

Instead, 1.0.0 implements a new procedural 5×7 dot-matrix alphabet in `public/src/dotfont.js` for the historical in-canvas HUD/LED. This is a reconstructed visual substitute, not a copy of either historical font.

## Audio policy

Historical WAV effects and Beyond tracker modules remain part of the archaeological record but are not redistributed. 1.0.0 synthesizes the 18 runtime-used SFX roles with Web Audio; see `AUDIO_PARITY.md`.

Three optional modern CC0 music loops are bundled separately under `public/assets/music-modern/`. They are a documented modernization, never historical replacement media; see `MODERN_MUSIC.md`.
