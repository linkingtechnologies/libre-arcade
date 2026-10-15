# Zooming Secretary — M20 Day 5 Report

## Result

**M20: GREEN — Day 5 playable and connected to the Dream outcome.**

The browser campaign now runs:

`Day 1 → Day 2 → Day 3 → Day 4 → Dream → Day 5`

Day 5 is a new semantic reconstruction using the M11/M12 binary/runtime oracle. No original nametable bytes or historical visual/audio assets are included.

## Day 5 configuration

- target: **30 calls**;
- active topics: **4** — Earth, History, Books, Space;
- phones: **3**;
- coffee: enabled;
- NPC: **Geek**;
- miss limit: **3 or 5**, inherited from the Dream result.

Certified coordinates:

- player spawn `(24,120)`;
- phones `(80,128)`, `(168,128)`, `(160,192)`;
- History cabinet `(46,80)`;
- Space cabinet `(190,80)`;
- Earth cabinet `(14,192)`;
- Books cabinet `(222,192)`;
- coffee `(88,193)`;
- Geek `(216,120)`.

## Semantic collision topology

Collision SHA-256:

`2a0f5e2a1d2a6bc066cd9fb6b842c282ddb0f78018cf85c8093acf6e6d890dfd`

The layout consists of:

- an upper platform with a central ladder tail to the top boundary;
- a middle full-width platform with two side ladder shafts;
- a lower full-width platform with a central ladder tail to the bottom boundary;
- the top/bottom central ladder pair forms the original vertical-wrap route between lower and upper floors.

Edge-accessible NPC floors are `[120,184]` on both sides.

## Binary-real seed-1 initialization

- RNG after init: **139**;
- `call_delay` after init: **245**;
- initial phone counters: **283 / 553 / 801**;
- initial phone topics: **0 / 0 / 3**;
- first ring ticks: **283 / 553 / 801**;
- binary factoid indices in scan order `[History, Space, Earth, Books]`: **8 / 0 / 6 / 7**;
- Geek initial direction: **RIGHT**.

## Geek behavior covered

M20 verifies:

- 1 px movement every 2 gameplay ticks;
- physical blocking when the player approaches from the side the Geek faces;
- the player is repositioned to the Geek boundary as in the source behavior;
- on odd interaction frames the Geek backs away by 1 px;
- every 32 frames in the close-facing interaction, two shared `rand8()` calls are consumed for the original decorative-heart behavior, even though no original heart graphic is reused.

## Playability checks

Automated movement tests confirm:

1. spawn → side ladder → lower floor → coffee pickup;
2. lower floor → central ladder → vertical wrap → upper floor → Space cabinet;
3. coffee reaches strength 20 and target speed `34/16 = 2.125 px/tick`;
4. all four topic cabinet IDs are present;
5. 30 answers complete Day 5;
6. the inherited 3/5 miss threshold is enforced.

## Dream → Day 5 campaign state

M20 closes the incomplete M19 browser flow:

- Dream success sets `futureMissLimit = 5` and the primary action becomes **Continue to Day 5**;
- Dream catch sets `futureMissLimit = 3` and still continues to Day 5;
- `makeDay5Stage(lang, futureMissLimit)` passes the result into the real simulation;
- the Day 5 intro displays the inherited allowance;
- replaying Day 5 does not reset it.

## Regression

- M9/M8: 15/15
- M10: 15/15
- M11: 10/10
- M12: 12/12
- M13: 8/8
- M14: 12/12
- M15: 14/14
- M16: 14/14
- M17: 16/16
- M18: 18/18
- M19: 19/19
- M20: 20/20

**Total: 173/173 passed.**

## Distribution status

Policy scan finds zero historical binary/media/source files. Day 5 contains semantic geometry and behavioral metadata only.
