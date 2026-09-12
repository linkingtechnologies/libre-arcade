# Active asset provenance

This file separates the assets actually used by Terramancers gameplay from stale Vakho Arena material that merely survives in the historical checkout.

## Active character sheets

| Port file | Historical attribution | Audit status |
|---|---|---|
| `Characters/Princess.png` | Lanea Zimmerman | Named in original `AUTHORS.TXT`; LPC base-art lineage |
| `Characters/Mage.png` | Stephen Challener / Redshrike | Named in original `AUTHORS.TXT`; LPC lineage |
| `Characters/Professor.png` | Skyler Robert Colladay | Named in original `AUTHORS.TXT` as `professor.png` |
| `Characters/FBI.png` | Skyler Robert Colladay | Named in original `AUTHORS.TXT` |
| `Characters/Astraea.png` | Emilio J. Sanchez-Sierra | Named in original `AUTHORS.TXT` |
| `Characters/Baldric.png` | Stephen Challener / Redshrike | Not named in Terramancers `AUTHORS.TXT`; identified as the Baldric LPC entry; caveat retained |

Historical source code requests `professor.png` and `princess.png` although the archive contains `Professor.png` and `Princess.png`. This is a case-sensitive-filesystem bug. The web port resolves the actual filename case and records that as a platform compatibility fix.

## Active tree image

`Trees/greenTrees.png` is split by `TreeSprite.java`; gameplay always uses the first 96×150 half. The image is not separately listed in `AUTHORS.TXT`. Inspection shows it is an assembled tree image using the `treetop.png` and `trunk.png` LPC material credited to Lanea Zimmerman. Exact historical assembly provenance is not documented, so this remains an inference.

## Active terrain sheets

The six original UTF-16 terrain configs load these source PNGs in the current game path:

- `brackish.png`
- `cement.png`
- `dirt.png`
- `dirtnight.png`
- `grass.png`
- `hole.png`
- `house.png`
- `lava.png`
- `lavarock.png`
- `sand.png`
- `soil.png`
- `water.png`
- `wheat.png`
- `youngwheat.png`

Most are individually covered by the historical attribution file. `sand.png` is the notable omission; Daniel Eddeland's 2012 LPC submission explicitly includes sand tilesets and is GPL 3.0 / CC-BY-SA 3.0.

`tallgrass.png` is present and attributed but is not referenced by the six active CFGs.

## Generated browser tile caches

The web port generates (at restoration-build time) six small `terrain-*.png` atlases from the active historical PNGs and CFG mappings. Composition exactly follows `SpriteGenerator.mergeColors`: an overlay pixel replaces the base pixel only when its alpha is at least 128. The atlases are therefore faithful caches, not remastered art.

## Stale / predecessor material

The historical archive contains many files that are not required by Terramancers' completed LPC gameplay, including old combat/model/editor code, clothing-layer sprites, arrows, `Map.map`, and related assets. They are preserved under `reference/` but are intentionally not copied into the active web runtime until a future archaeology task demonstrates that Terramancers itself uses them.
