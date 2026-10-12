# Lawn Mower — M3 Level & Behavioral Oracle Extraction

## Status

**M3: PASS.** All ten levels have been decoded from the original v1.12 artifacts and matched byte-for-byte against the data embedded in `patterns.chr`. Movement, speed, fuel, mowing, obstacle, completion, RNG and PAL/NTSC timing rules are now frozen as testable oracle cases.

No HTML5 port code was started.

## Important corrections to the earlier M2 shorthand

M3 source-level tracing corrects two shorthand statements from M2:

1. **RNG seed 1 is a cold-reset seed, not a per-new-game seed.** `RAND_SEED=1` is written once during console reset. `initGame`, level changes and out-of-fuel retries do not reseed it. The title screen itself calls `rand()` while waiting for START, so later randomness depends on how long the player remains on the title screen.
2. **NTSC is not exactly normalized to 50 Hz.** The source comment says “every 6th frame”, but `ntscIsSkip` actually skips when its counter reaches 5. Therefore movement/input logic is processed on 4 of every 5 NTSC NMIs (nominally about 48 logic ticks/s at 60 Hz), while some subsystems such as the fuel-spawn countdown still run every physical NMI.

These source behaviors are identical in the M2 semantic comparison of v1.1 and v1.12 and should be preserved as historical quirks unless a future compatibility option explicitly chooses the apparent intent instead.

## 1. Original level-editor format recovered

The supplied source archive contains the original Borland/VCL editor source (`editor/src/Unit1.cpp`). M3 restores that source into the preservation package; it was accidentally omitted from the extracted-tree copy in M2 even though it was present in the original ZIP.

The editor constants are:

- width: 30 cells
- height: 11 cells
- levels: 10
- raw tile values: 0..3

`levels.bin` is exactly 3,340 bytes:

- 3,300 bytes: 10 × 30 × 11 raw tile bytes
- 40 bytes: 10 × 32-bit little-endian parameter words

Each parameter word stores:

- byte 0: active level width
- byte 1: mower start X in editor coordinates
- byte 2: mower start Y in editor coordinates
- byte 3: unused here

### Export to the NES CHR

The editor export routine constructs each ROM record as follows:

1. place the active editor map at X+1 inside a 32×11 temporary grid;
2. pack four 2-bit tile values into each byte: 352 cells → 88 bytes;
3. append seven metadata bytes: width, startX+1, startY+3, 16-bit grass count, 16-bit 8.8 completion increment.

Therefore each level record is exactly **95 bytes** and all ten occupy **950 bytes** beginning at CHR offset `$1000`.

M3 regenerated those 950 bytes directly from `levels.bin` using the editor algorithm and obtained a **byte-for-byte match** with `patterns.chr`.

SHA-256 of the 950-byte level-record segment:

`2fa717db78d8d5412c25fa52cc8bd94547d6224e33d9cb82095c45674eed7c21`

This certifies the decoded maps independently of visual interpretation.

## 2. Tile semantics

Editor values and runtime semantic tiles are:

| Raw | Meaning | Runtime conversion |
|---:|---|---|
| 0 | already cut / clear lawn | random variant `$0A..$0D` |
| 1 | mowable grass | random variant `$0E..$11` |
| 2 | flowers | `$12` |
| 3 | stone | `$14` |

During `setField`, the game calls the RNG for **all 512 bytes of `GAME_MAP`**, not merely the 352 encoded playfield cells. This exact RNG consumption matters for deterministic replay even though borders and unused rows are overwritten afterward.

## 3. Certified level inventory

All starts are on a pre-cut cell.

| Lv | Width | Start (game X,Y) | Pre-cut | Grass required | Flowers | Stones | Done inc (8.8 raw) |
|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | 14 | 7,8 | 58 | 96 | 0 | 0 | 266 |
| 2 | 14 | 7,8 | 12 | 116 | 26 | 0 | 220 |
| 3 | 14 | 7,8 | 12 | 122 | 12 | 8 | 209 |
| 4 | 20 | 6,8 | 9 | 183 | 28 | 0 | 139 |
| 5 | 20 | 3,8 | 9 | 173 | 26 | 12 | 147 |
| 6 | 25 | 13,8 | 9 | 247 | 0 | 19 | 103 |
| 7 | 25 | 3,8 | 9 | 190 | 76 | 0 | 134 |
| 8 | 25 | 3,8 | 9 | 221 | 24 | 21 | 115 |
| 9 | 30 | 15,8 | 12 | 247 | 60 | 11 | 103 |
| 10 | 30 | 15,8 | 12 | 248 | 42 | 28 | 103 |

The progression is therefore explicit rather than generated: widths grow 14 → 20 → 25 → 30 and the authored layouts mix flowers, stones and clear start areas.

Readable maps are frozen in `LEVEL_MAPS.md`; machine-readable fixtures are in `LEVELS.json` and `LEVELS.tsv`.

## 4. Completion oracle

Only raw **grass cells (type 1)** contribute to `GAME_DONE_CNT`.

- flowers are not required for completion;
- stones are not required for completion;
- pre-cut cells are not required;
- cutting a flower does not decrement the grass counter;
- cutting the already-wilted flower on a second pass still does not decrement it.

Therefore a level legitimately clears with flowers and stones still present once every grass cell has been mown.

The percentage is an 8.8 fixed-point accumulator. The per-level increment is `floor(100*256 / grass_count)`. Because of this flooring, after the final required grass cell the numerical accumulator displays **99**, not 100, on all ten levels. The level-clear sequence explicitly writes `100` to the screen afterward.

This is a preservation quirk and should not be “fixed” by a future port.

## 5. Movement and speed oracle

Position and velocity use 12:4 fixed point: **16 raw units = 1 pixel**.

Initial speed:

- raw 20 = 1.25 pixels per processed gameplay tick.

### Boost

When A or B is held:

- if speed is below 48, add 2;
- if speed is already 48 or above, leave it unchanged.

This creates a subtle edge case: **47 becomes 49**, so the actual reachable peak is 49 (3.0625 px/tick), not strictly 48.

### Coast

With A/B released:

- if speed <16: unchanged;
- otherwise decrement once;
- on even `FRAME_CNT`, decrement a second time only if the post-first-decrement value is still >=16.

Thus **16 falls to 15**, and 15 is the stable practical floor (0.9375 px/tick). The apparent nominal floor of 16 in the condition is not the actual stable value.

### Turning

Direction changes are requested immediately but applied only when `GAME_PLR_OFF` crosses a full 16-pixel tile. At that point the current tile is processed, coordinates are aligned to the tile grid, the requested direction is installed and fractional X/Y plus tile-offset are cleared.

There is no free-angle or per-pixel steering: turns are tile-boundary events layered on continuous movement.

## 6. Mowing and obstacle oracle

### Grass

Entering `$0E..$11`:

- subtract 4 from tile code → `$0A..$0D`;
- add the level's 8.8 percentage increment;
- decrement the 16-bit grass counter;
- play grass-cut SFX.

Re-entering `$0A..$0D` does not decrement completion again.

### Flowers

First pass on `$12`:

- tile becomes `$13`;
- subtract `232/6` integer units = **38 fuel**;
- completion counter unchanged.

Second pass on `$13`:

- tile becomes random `$0A..$0D`;
- no second flower fuel penalty;
- completion counter still unchanged.

### Stone

Entering `$14`:

- tile remains a stone;
- subtract `232/3` integer units = **77 fuel**;
- set camera shake;
- completion counter unchanged.

## 7. Fuel oracle

Constants:

- maximum fuel: **232**;
- low-fuel threshold: **58**;
- flower penalty: 38;
- stone penalty: 77;
- fuel can restores directly to 232.

### Level intro

A level starts with fuel 0 and delay 0. On each processed intro tick:

- fuel increases by 4 until it reaches 232;
- delay increments by 1.

The gauge therefore becomes full after **58 processed ticks**, while gameplay remains gated until delay reaches **80 processed ticks**.

### Normal drain

During active gameplay one fuel unit is removed when the physical `FRAME_CNT` is odd, but only on frames that reach `playerMove`.

Nominal long-run rates:

- PAL (~50 physical/processed Hz): ~25 fuel units/s → a full tank alone lasts ~9.28 s;
- NTSC (~60 physical Hz, 4/5 movement processing): ~24 fuel units/s → ~9.67 s.

Exact one-run duration can shift by one physical frame depending on parity when gameplay begins.

### Fuel appearance timer

Base ticks by level:

`250, 235, 220, 200, 185, 170, 150, 150, 150, 150`

Each reset adds `rand() & 31` (0..31).

The countdown decrements only when:

- not paused;
- intro delay has reached 80;
- no active fuel can is currently visible.

Crucially, `fuelUpdateTime` runs even on an NTSC movement-skip NMI. Therefore the spawn timer is tied to **physical NMIs** while movement is not.

A visible can freezes the countdown. The game also precomputes a pending next location, but it will not replace the currently visible can merely because time passes.

### Candidate location

`max` implements modulo by repeated subtraction, so:

- X = `((rand() & 31) % levelWidth) + 1`
- Y = `((rand() & 15) % 11) + 3`

A candidate is accepted only if its current runtime tile is `$0A..$0D`, i.e. already cut lawn. Grass, flowers and stones are rejected. As mowing proceeds, newly cut grass becomes eligible for future cans.

## 8. RNG oracle

Algorithm:

1. take the old bit 7 as carry;
2. shift the 8-bit state left;
3. if carry was set, XOR with `$CF`.

For nonzero states the period is **255**. State 0 is an absorbing QA-only state.

Cold-reset seed: **1**.

First 16 outputs from seed 1:

`02 04 08 10 20 40 80 CF 51 A2 8B D9 7D FA 3B 76`

The title screen advances this RNG once per non-skipped title logic update while waiting for START, and the call occurs **before** the controller poll. Therefore user wait time intentionally/non-intentionally randomizes the first level.

No reseed occurs on:

- out-of-fuel retry;
- next level;
- game completion returning to title/new game.

The raw vectors for four QA seeds are in `RNG_VECTORS.tsv`.

### Canonical deterministic scenarios

For unit tests that call `initLevel` directly with seed 1:

- first level fuel timer = **252 ticks**;
- first pending fuel location = **(3,3)**.

For a full cold reset where START is detected on the very first title poll (the mandatory title `rand()` happens first):

- first level fuel timer = **254 ticks**;
- first pending fuel location = **(1,3)**.

These fixtures include the 512 RNG calls consumed by `setField`.

## 9. PAL/NTSC timing quirk

`ntscIsSkip` contains:

- increment frame counter;
- compare against **5**;
- reset and return carry on equality.

So in NTSC mode the movement/video path processes physical frames 1,2,3,4, skips 5, processes 6,7,8,9, skips 10, etc.

The adjacent source comment says “every 6th frame”, which would be the mathematically expected conversion from 60 to 50 Hz, but that is **not what the code does**.

For preservation the behavioral oracle records the implementation, not the comment.

## 10. v1.1 → v1.12 transition regression

M2 found one real core behavior delta: v1.1 cleared `GAME_DIR_NEW` when the level was complete or fuel was already zero; v1.12 leaves it untouched in that no-control path.

M3 freezes a regression case for this. It is low impact because every `initLevel` resets current/requested/previous direction to RIGHT, but the distinction belongs in the provenance oracle.

## 11. Scoring

No independent points/high-score system was found. The three-digit field is completion percentage. A faithful port should not invent an arcade score.

## 12. Test assets produced

- `LEVELS.tsv` — compact inventory and per-record hashes
- `LEVELS.json` — machine-readable fixtures
- `LEVEL_MAPS.md` — all ten maps in readable form
- `RNG_VECTORS.tsv` — 32 outputs for seeds 01, 5A, A5, FF
- `BEHAVIORAL_ORACLE.json` — frozen constants/formulas
- `ORACLE_CASES.tsv` — executable-spec style behavioral cases
- `M3_ORACLE_TESTS.py` — local invariant tests
- `generate_m3_oracle.py` — deterministic fixture generator

`M3_ORACLE_TESTS.py` currently reports:

`M3 ORACLE: PASS`

## M3 verdict

The behavioral uncertainty is now low enough to begin a faithful port when desired. We have exact authored level data, exact completion rules, exact RNG, exact fuel formulas, exact speed edge cases and the region-timing quirk.

The remaining independent archaeological gate is **exact historical NESASM 3.1 byte reproduction of v1.12**. It is useful for provenance, but no longer blocks the behavioral oracle.

### Recommended M4

**M4 — Headless Rules Kernel / parity harness**, still without UI polish:

- implement only the deterministic game-state kernel in vanilla JavaScript;
- load the certified `LEVELS.json` fixtures;
- reproduce the 8-bit RNG exactly;
- reproduce speed/turn/fuel/tile transitions exactly;
- run the same oracle cases headlessly in JS;
- no Canvas art, menus, audio or responsive UI yet.

This is the safest bridge from archaeology to the eventual HTML5 restoration because we can prove the rules before drawing anything.
