# Zooming Secretary — M11 Shadow Parity Report

## Result

**M11: GREEN within defined shadow-parity scope.**

The eight stage streams were recovered directly from the certified v1.02 ROM by scanning every PRG offset with the game's RLE decoder and matching the decompressed 1024-byte SHA-256 values frozen in M7.

Certified ROM SHA-256:

`315adee10052367298959d55256e9f2621381da9f7c839f50832e13516b61770`

Certified PRG SHA-256:

`bc8c88b58bad14f17c642e9f7cad32e2aa3d8cd2a07b23100d3974c2cd400b5e`

## Stage streams located in PRG

| Stage | PRG offset | CPU address | RLE bytes |
|---|---:|---:|---:|
| Day 1 | `0x4EC1` | `0xCEC1` | 424 |
| Day 2 | `0x5069` | `0xD069` | 475 |
| Day 3 | `0x5244` | `0xD244` | 515 |
| Day 4 | `0x5447` | `0xD447` | 454 |
| Day 5 | `0x560D` | `0xD60D` | 496 |
| Day 6 | `0x57FD` | `0xD7FD` | 610 |
| Day 7 | `0x5A5F` | `0xDA5F` | 597 |
| Dream | `0x5CB4` | `0xDCB4` | 558 |

All eight decompress to exactly 1024 bytes and match the M7 nametable hashes.

## Collision transform

The private shadow extractor mirrors the v1.02 stage setup:

1. take nametable rows 6–27 (32×22 = 704 cells);
2. scan entities row-major;
3. clear phone/player/NPC/table marker cells as the source does;
4. copy column 1 to column 0 and column 30 to column 31 on each row;
5. convert tile IDs through the source collision attributes;
6. discover left/right edge-accessible floors.

Collision SHA-256 fingerprints:

| Stage | Collision SHA-256 |
|---|---|
| Day 1 | `67cbe336548cd2b4f2928ace7afa86b1a9171f5fccb89fb09a874bb857cbf4b6` |
| Day 2 | `81b5e842798c17735f3962ccab79789d9b2cba0fa230549aa9e2d01d97fab777` |
| Day 3 | `846def0c8a5bfc2d6a67579351d5d50b3645b2b78e632da374d770124286ea87` |
| Day 4 | `2f475cb2a4c87ca8f0695a2fb9667b1e93eefaea6c1ed0dac9255bf6f775691f` |
| Dream | `cebe42ab657f4ff557a3f2a27cc6d8988f138c42fcee3253100e1c5155a3a5f0` |
| Day 5 | `2a0f5e2a1d2a6bc066cd9fb6b842c282ddb0f78018cf85c8093acf6e6d890dfd` |
| Day 6 | `0b35b5cab87744bc99e7871af7d2245fdfde103a9f7056ebb490d7978c1eb185` |
| Day 7 | `001540386831a1bea579ef090bcba039aecdec2314de09a54deef6149bfcc326` |

## Source-order initialization — seed 1

M11 fixes the earlier assumption that phones can be initialized independently from the rest of a stage. The real map scan consumes RNG in row order.

| Stage | RNG after init | call_delay after init | Initial phones `(counter, topic)` |
|---|---:|---:|---|
| Day 1 | 64 | 230 | `(252,0) (504,0)` |
| Day 2 | 81 | 220 | `(252,0) (504,0) (774,0)` |
| Day 3 | 162 | 220 | `(266,2) (496,0) (759,0)` |
| Day 4 | 207 | 230 | `(252,1) (504,1)` |
| Dream | 8 | 0 | `(29,–)` |
| Day 5 | 139 | 245 | `(283,0) (553,0) (801,3)` |
| Day 6 | 125 | 360 | `(408,0) (678,0) (926,3) (1163,1)` |
| Day 7 | 125 | 410 | `(452,0) (704,0) (959,2) (1199,1)` |

The same scan also fixes the initial factoid choices and NPC direction/state. These vectors are retained in `fixtures/m11-shadow-vectors.json`.

## Side-floor parity

The source-derived collision maps produce:

- Day 1: left/right `[152]`
- Day 2: left/right `[56,120,184]`
- Day 3: left/right `[56,120,184]`
- Day 4: left/right `[56,120,184]`
- Dream: left/right `[184]`
- Day 5: left/right `[120,184]`
- Day 6: left/right `[56,120,184]`
- Day 7: left/right `[56,120,184]`

This certifies the automatic side-floor discovery used by ManBox/Dibrov against the actual stage maps.

## M7 correction: coffee Y

Six M7 entries were one pixel high because M7 recorded the marker tile coordinate. The source stores `coffee_y = py + 1`.

Corrected values:

- Day 2: 64 → **65**
- Day 3: 64 → **65**
- Day 4: 128 → **129**
- Day 5: 192 → **193**
- Day 6: 72 → **73**
- Day 7: 192 → **193**

## M10 correction: loop order

M11 re-read the complete source loop and corrected M10's ordering assumption.

Actual relevant order:

1. increment `frame_cnt`;
2. player motion;
3. coffee;
4. speed target + coffee decay;
5. wisdom;
6. topic cabinets;
7. Dream runaway;
8. phone processing;
9. NPC processing (`player_slowdown` reset/set here);
10. win/loss/catch checks near end of frame.

Therefore Chief slowdown is intentionally a one-frame latch.

## Phone lifecycle shadow checks

For every real stage and phone:

- first `RING_START` occurs at its source-initialized counter value;
- on normal stages first `MISS` occurs **603 ticks later**;
- Dream uses its bonus branch and never enters the normal miss path.

These checks were run on the real reconstructed collision maps with a high test miss limit so all initial phone cycles could be observed.

## Test results

Private ROM/map shadow suite: **12/12 passed**.

Public package regression:

- M9/M8 contract: **15/15**
- M10 integration: **15/15**
- M11 redacted vectors: **10/10**

Total distributable regression: **40/40**.

## What M11 does not claim

M11 does not execute the NES ROM inside a CPU/PPU emulator and compare every per-frame RAM variable against JavaScript. Dynamic NPC/player logic remains verified from source-derived unit/integration tests rather than a hardware trace.

That is now a narrower residual validation task, not a stage-layout or initialization uncertainty.
