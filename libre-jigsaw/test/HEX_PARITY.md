# Hex descriptor parity check

M2's `hexBestFit` / `createHexGeometry` sizing math was compared numerically with the original 2012 Java classes `HexTileManager.getBestFit()` and `HexJigsawManager`.

Columns: `tilesAcross, tilesDown, tileCount, tileWidth, tileHeight, spacingX, spacingY, leftOffset, topOffset`.

| Board | Target | Original Java | M2 JavaScript |
|---|---:|---|---|
| 900×600 | 12 | `8,3,12,270,312,135,234,-157,-90` | identical |
| 900×600 | 24 | `12,4,24,168,192,84,144,-96,-12` | identical |
| 600×900 | 48 | `11,9,50,122,140,61,105,-66,-40` | identical |
| 320×240 | 96 | `22,10,110,28,32,14,24,-1,-4` | identical |
| 1400×700 | 48 | `19,5,48,158,180,79,135,-90,-10` | identical |

The random jigsaw edge parameters cannot be byte-for-byte compared from normal runs because the historical Java implementation constructs an unseeded `java.util.Random`. M2 intentionally uses a seeded PRNG internally so geometry can be reproduced during tests, while preserving the original parameter ranges, ownership rules and clipping logic.
