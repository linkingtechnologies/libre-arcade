# Archaeological baseline

## Original 0.02 archive

`ConcentrationRoom-0.02.zip` contains 39 entries and is preserved unchanged under `/reference`.

- ZIP SHA-256: `0e9773924b5d8b53d727f3359b62f3730ec95f139d64242236cb9ec28f871566`
- ZIP SHA-512: `bb260d6cd6babfd74b0f58186cef0faf6be58d4a9cd101d40e482fa37956fd382de58ba1e6a429f779959bae0d9983eaea595ba88f04e708cf5fe934e7a36b04`
- `croom.nes` SHA-256: `6a43202f8b7793f78832c47b67ca3aeb12165140a1e38f0a5043855b2e3d53cd`
- iNES header: 1 x 16 KiB PRG, 1 x 8 KiB CHR, mapper 0, vertical mirroring.

The archive's Makefile declares `version = 0.02`. The ROM timestamp inside the ZIP is 2010-07-18.

## 0.02 vs first GitHub import (2016-11-20)

The first Git commit is `8cad6d65a0ddff7f9ec9b1fc38a89bcfe3ff43f6`, message `import 0.02 + terriblegate fix`.

Git blob comparison shows that the release files are byte-identical to that import except for:

1. `GPLv3.txt` was renamed to `LICENSE.txt` (content is identical).
2. `zip.in` was updated for the license rename.
3. `src/drawcards.s` contains the post-release Terriblegate fix.
4. `.gitignore` was added for repository housekeeping.

The ROM committed in the 2016 import is byte-identical to the ROM in the 0.02 ZIP, so it remains the historical release ROM, not a rebuilt fixed ROM.

### Terriblegate

In 0.02, `blitCardSprites` performs OAM DMA before restoring `PPUCTRL` to +1 VRAM increment. A previous card blit may have left `VRAM_DOWN` (+32 increment) selected. With the original CHR-ROM board this was mostly harmless, but CHR-RAM multicart use exposed palette writes landing in pattern-table memory.

The 2016 source moves:

```asm
lda #VBLANK_NMI
sta PPUCTRL
```

before the sprite/palette upload. This is a hardware/rendering bugfix only; it does not change rules, AI, scoring, shuffle, or the released ROM used as the behavioral baseline.
