# Njam level-set format

The format is derived directly from `NjamMap::Load()` and `NjamMap::Save()` in Njam 1.21.

- File contains exactly 20 map slots.
- Map width: 28 tiles.
- Map height: 24 tiles.
- One tile is one unsigned byte.
- One map occupies 28 × 24 = 672 bytes.
- A complete level-set occupies 20 × 672 = 13,440 bytes.
- C storage is `m_Tiles[map][x][y]`, therefore the serialized order is x-major, then y.
- A map whose tile `(1,1)` is `ttWall` is considered the first incomplete/unplayable map; later slots are ignored by the original loader.

Tile values:

| Value | Original enum | Meaning |
|---:|---|---|
| 0 | `ttWall` | Wall |
| 1 | `ttEmpty` | Empty floor |
| 2 | `ttGHouse` | Ghost house / pentagram |
| 3 | `ttDoor` | Player respawn door |
| 4 | `ttJuice` | Superpower |
| 5 | `ttCookie` | Cookie / point |
| 6 | `ttFreezer` | Freeze ghosts |
| 7 | `ttTrap` | One-use trap |
| 8 | `ttTeleport` | Random teleport |
| 9 | `ttInvisible` | Invisibility |
| 10 | `ttPoints` | 50-point bonus |
| 11 | `ttGHouseActive` | Active ghost house |

The browser build embeds the original 13,440-byte COOP files losslessly as base64 in `src/levels-data.js`; it does not redraw or reinterpret the maps during conversion.
