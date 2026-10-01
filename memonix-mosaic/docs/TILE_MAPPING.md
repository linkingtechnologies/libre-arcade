# Mosaic tile mapping audit

The recovered runtime package contains all 50 original Mosaic bitmaps. The historical C++ source loads them in five groups and, within each group, in this suffix order:

`_1, _2, _3, _4, _5, _6, _7, _8, _9, _0`

The five families and their dominant fill colours are:

1. red — `RGB(223, 0, 0)` / `#df0000`
2. cyan — `RGB(0, 223, 223)` / `#00dfdf`
3. green — `RGB(0, 223, 0)` / `#00df00`
4. lilac / magenta — `RGB(223, 0, 223)` / `#df00df`
5. blue — `RGB(0, 0, 223)` / `#0000df`

The exact suffix-to-shape mapping recovered from the 64×64 originals is:

| Suffix | Shape |
| --- | --- |
| `_1` | upward triangle |
| `_2` | square |
| `_3` | circle |
| `_4` | diamond |
| `_5` | trapezoid |
| `_6` | vertical oval |
| `_7` | downward triangle |
| `_8` | stepped cross |
| `_9` | right-facing semicircle (vertical flat edge) |
| `_0` | lower semicircle / bowl (horizontal flat edge) |

Every logical tile therefore maps exactly to:

`DATA\\MOSAIC\\<family>_<suffix>.bmp`

The browser build uses the corresponding lossless PNG under `assets/mosaic/`. Per-file original/distributed hashes are recorded in `assets/mosaic/original-asset-manifest.json`.

`tools/tile-atlas.html` renders the complete recovered 5×10 atlas.
