# M11 Corrections to Earlier Oracle/Reports

This file is normative for milestones M7–M10.

## 1. Coffee runtime Y

M7 used the tile marker Y. Source v1.02 uses `coffee_y = py + 1`.

Correct six stage values by +1 pixel:

- Day 2: 65
- Day 3: 65
- Day 4: 129
- Day 5: 193
- Day 6: 73
- Day 7: 193

## 2. Phone initialization vectors

M9's seed-1 phone vectors model `PhoneSystem` in isolation. They are still valid unit vectors.

For real full stages, use `fixtures/m11-shadow-vectors.json`, because the original row-major map scan interleaves RNG calls from:

- phone resets;
- NPC initialization;
- initial cabinet factoid selection.

## 3. Gameplay phase order

The M10 report statement that current-frame NPC processing sets slowdown before current-frame speed calculation is superseded.

Correct order is speed/topics/phones first, then NPC. `player_slowdown` is therefore latched for the following frame.

## 4. frame_cnt phase

The original loop increments `frame_cnt` at the top of each active gameplay frame. M11 now does the same before coffee decay / NPC parity checks.

## M12 supersession note

M12's machine-code differential trace found that the initial factoid message index is affected by a cc65 stale-X promotion quirk. Any M11 statement treating `rand8() % topicMessagesCount` as source-logical arithmetic is superseded by `M12_RUNTIME_REPORT.md`. M11 map, coffee, scan-order, phone-init and loop-order corrections remain valid.
