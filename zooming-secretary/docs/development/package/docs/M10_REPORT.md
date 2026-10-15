> **M11 correction notice:** M11 supersedes one source-order statement in this historical M10 report. The current-frame NPC phase occurs **after** speed/topic/phone processing; Chief slowdown is latched for the following frame. See `M11_ORACLE_CORRECTIONS.md`.

# Zooming Secretary — M10 Full Simulation Core Report

## Result

**M10 simulation core: GREEN.**

The M9 deterministic primitives are now connected through a single stage simulation loop. The package remains headless and contains no original game media or original map byte arrays.

## Implemented

1. External 32×22 collision-map API with screen-space `check_map` semantics.
2. Fixed-point player state and speed ramp.
3. Falling / landing support tests.
4. Horizontal wrap and ladder movement/alignment.
5. Cabinet topic acquisition and wisdom suppression.
6. Coffee ready/pickup/cooldown.
7. Integrated phone collision, answer, miss and stage outcome.
8. Integrated NPC phase for all seven NPC types.
9. Automatic left/right side-floor discovery for edge-changing NPCs.
10. Dream runaway phone state and Ghost catch path.
11. Deterministic snapshots and full-core replay.
12. Adapter from M7/M9 behavioral entity fixtures to `StageDefinition`.

## Tests

- M9 regression suite: **15/15 passed**.
- M10 integration suite: **15/15 passed**.
- Combined: **30/30 passed**.

The M10 suite covers map coordinates, fall/land, wrap, ladder acquisition, cabinets, wisdom, coffee, correct/wrong phone answers, miss-driven loss, Chief slowdown, both Dream exits, external historical entity-fixture adaptation and deterministic full-core replay.

## Important boundary

M10 uses synthetic collision maps in the distributable tests. This is intentional.

The original NES map byte arrays remain part of the archaeology/reference side while their licensing classification is YELLOW. Therefore M10 proves **engine integration**, not yet full original-map runtime parity.

## Source-derived behaviors checked during M10

The preserved v1.02 source confirms:

- `check_map` converts pixels to tiles and subtracts six nametable rows;
- player fall samples the two foot points at X+4 and X+12 / Y+24;
- horizontal motion directly changes fixed-point X and then applies 0/240 wrap;
- ladder start checks two sample points and aligns X before a 16-pixel climb segment;
- **Superseded by M11:** NPC processing occurs after the current speed calculation; `player_slowdown` is used on the following frame;
- target speed is `1.5 px/tick + coffee/32`, then optional `*4/6` slowdown;
- Dream repeatedly forces wisdom before topic processing;
- coffee begins with 150 ticks, warns at 16, then uses a 1000-tick cooldown;
- edge-accessible floors are discovered from the collision map for NPC re-entry.

## Remaining risks

1. **Original-map shadow parity:** collision routes and exact NPC trajectories still need to be executed against the eight preserved maps outside the distributable package.
2. **Map-specific NPC edge cases:** generic side-floor discovery is implemented, but needs comparison with original Day 6/7 floor arrays.
3. **Timing profile:** PAL 50 vs NTSC 60 production default remains intentionally undecided.
4. **Original implementation quirks:** any memory-unsafe C behavior stays documented rather than blindly reproduced.
5. **Media gate:** original graphics/music licensing remains separate and YELLOW.

## Recommended M11

Build a local, non-distributable **shadow parity harness** that imports the preserved map headers, runs canonical movement/input scripts through M10, and emits only:

- hashes;
- entity/floor-coordinate summaries;
- deterministic state traces;
- mismatch reports.

No original map bytes need to enter the final Libre Arcade package.
