> **M3 supersession note:** M3 corrected two M2 shorthand statements: RNG seed 1 is cold-reset-only (not per new game), and NTSC `ntscIsSkip` implements a 1-in-5 skip rather than exact 50 Hz normalization. See `M3_REPORT.md`.

# Lawn Mower — M2 Reproducible Baseline & v1.1 → v1.12 Diff

## Status

**M2 behavioral result: PASS.** The supplied historical competition ROM and the supplied v1.12 source can be aligned sufficiently to establish that the core game rules did not change between v1.1 and v1.12.

**Exact historical-tool byte reproduction: OPEN.** The source archive invokes `..\\nesasm.exe game.asm` but does not include `nesasm.exe`. A derived verification ROM was produced with an independent NESASM-syntax verifier. It is useful for structural and semantic diffing, but it is deliberately not labeled as the official v1.12 binary.

## Baselines

### A — historical competition binary

- Internal version string: `Lawn Mower v1.1 30.05.11`
- ROM SHA-256: `942f36376246dbdff99a0b94aad930b2cccf1f534e5390468ac9c0d50752d7dd`
- MD5: `c1db31a2aa8a12432705fc8bd3c1156a`
- CRC32: `2E03CB7F`
- iNES: mapper 0 / NROM-128, 16 KiB PRG, 8 KiB CHR, vertical mirroring
- Reset vector: `$8000`
- NMI vector: `$8E73`

### B — final supplied source

- Source version string: `Lawn Mower v1.12 01.07.11`
- `game.asm` SHA-256: `fbc9678a1192fb79d3210a5041169867dbd95bf7e49dd21b87efa4ed4fe2f997`
- iNES directives remain mapper 0 / 16 KiB PRG / 8 KiB CHR / vertical mirroring.
- Source CPU origin moved to the upper NROM-128 mirror (`$C000-$FFFF`). On a 16 KiB NROM cartridge the same PRG is visible at both `$8000-$BFFF` and `$C000-$FFFF`, so this relocation by itself is not a gameplay change.
- Verification-build reset vector: `$C000`; NMI vector: `$CE70`.

## CHR and levels

The complete 8 KiB `patterns.chr` from v1.12 is **byte-for-byte identical** to the CHR portion of the v1.1 historical ROM.

SHA-256: `86708c4c103b9aee3222c6212687ea385de80e04f3721f0f5bb4a2adeffb6955`

This is stronger than a graphics-only match. `setField` reads the packed level records from PPU/CHR addresses referenced by `levList`, starting at `$1000` with a 95-byte stride. Therefore the ten packed level layouts stored in CHR are unchanged between v1.1 and v1.12 as well.

`levList` values in both versions:

`$1000, $105F, $10BE, $111D, $117C, $11DB, $123A, $1299, $12F8, $1357`

## Data-layout changes

Two 20-byte tables were moved, without changing their contents:

- `fuelTimeList`: from physical PRG offset `$3F28` in v1.1 to `$1F1B` in v1.12.
- `levList`: from `$3F3C` to `$1F2F`.

The fuel base timers are identical:

`250, 235, 220, 200, 185, 170, 150, 150, 150, 150`

The version string moved from physical PRG offset `$1F3B` to `$1F43` and changed from v1.1/30.05.11 to v1.12/01.07.11.

## Core-routine semantic comparison

After neutralizing the NROM mirror relocation and normalizing ROM call/jump targets, these routines have identical instruction semantics and constants between v1.1 and v1.12:

| Routine | Result |
|---|---|
| `playerMove` | identical |
| `fuelUpdate` | identical |
| `fuelUpdateTime` | identical |
| `fuelAdd` | identical |
| `fuelSetTimer` | identical |
| `cutGrass` | identical |
| `cutFlowers` | identical |
| `cutFlowersCut` | identical |
| `cutStone` | identical |
| `cutFuel` | identical |
| `fuelSubtract` | identical |
| `rand` | identical |
| `setField` | identical |
| `ntscIsSkip` | identical |
| `waitNMI50` | identical |

This directly protects the behavioral oracle for movement, fuel consumption/spawn, mowing, penalties/refill, RNG, level loading and PAL/NTSC timing normalization.

## Real behavioral difference found

`checkPad` changed by exactly two instructions in the early no-control path.

v1.1 clears `GAME_DIR_NEW` when either:

- `GAME_DONE_CNT == 0`, or
- `GAME_FUEL == 0`.

v1.12 skips that clear and jumps directly to the common exit path.

The rest of `checkPad` is semantically identical. Because movement is already gated by completion/fuel state and level initialization resets direction state, this looks like cleanup rather than a gameplay redesign. It should nevertheless become an explicit regression test in the oracle: hold/press a direction during level-complete and out-of-fuel transitions, then verify the next initialized state.

## Other code-layout/cleanup differences

- v1.12 inlines the VRAM clear loop near reset instead of calling the older layout's helper at that point.
- Several accesses that were encoded as absolute `$00xx` in v1.1 are encoded as zero-page in v1.12, saving bytes without changing the addressed RAM.
- Music/message/presentation routines are heavily affected by address relocation and pointer changes; no core-gameplay divergence has been identified there in M2. Audio-data identity is not claimed solely from the PRG diff.

## Core oracle frozen by M2

The following can now be treated as stable across the historical competition ROM and v1.12 source:

1. 10 levels, with identical packed layout data.
2. Continuous fixed-point movement and the same direction/change rules.
3. Boost and normal-speed logic unchanged.
4. `GAME_FUEL_MAX = 232`.
5. Fuel depletion/refill/low-fuel logic unchanged.
6. Fuel spawn timers unchanged: `[250,235,220,200,185,170,150,150,150,150] + (RNG & 31)`.
7. Flower penalty unchanged: `GAME_FUEL_MAX / 6` (= 38 integer units).
8. Stone penalty unchanged: `GAME_FUEL_MAX / 3` (= 77 integer units).
9. Fuel can restores fuel to 232.
10. Grass-cut state transition and completion counter behavior unchanged.
11. RNG unchanged: 8-bit Galois sequence seeded with 1 at new game; feedback XOR `$CF` on carry.
12. PAL/NTSC 50-Hz-normalized update path unchanged (`ntscIsSkip`/`waitNMI50`).

## Build reproducibility result

The original source archive's `compile.bat` is simply:

`..\\nesasm.exe game.asm`

followed by deletion of `game.fns` and launch of `game.nes`.

The supplied source does not contain the historical assembler executable. M2 therefore produced an independent verification assembly to prove that the source is structurally complete and to enable the semantic binary diff. The derived ROM is 24,592 bytes and has the same iNES configuration as the historical ROM.

Derived v1.12 verification ROM SHA-256:

`d3849eea926520cbc42d1c3d46134aac6d5e08dce0dea666a45619c72d66c2a9`

This hash is **not** an official historical hash and must never be used as provenance evidence.

## M2 verdict

The v1.12 source is not a materially different game from the competition v1.1. It is a post-competition cleanup/revision of the same ten-level game. For the future HTML5 preservation baseline, use **v1.12 source behavior**, while retaining **v1.1 ROM as the authenticated historical executable oracle**.

No port code was started in M2.

## Remaining risk / next milestone

The main remaining preservation risk is no longer gameplay. It is exact build provenance: obtain/build NESASM 3.1 and determine whether the supplied v1.12 source can generate a byte-stable ROM with the historical assembler.

Recommended **M3 — Level & Behavioral Oracle Extraction**:

- decode all ten 95-byte CHR level records into readable fixtures;
- record width, start position, mowable-cell count and obstacle counts per level;
- derive exact movement/fuel timings in logical ticks;
- make deterministic RNG vectors for seeds 1 and selected QA seeds;
- create oracle cases for start, movement, boost, mowing/repass, flower, stone, fuel spawn/refill, zero fuel, level clear and transition-state direction handling;
- keep the exact-NESASM build check as a parallel provenance gate, not a blocker for oracle extraction.
