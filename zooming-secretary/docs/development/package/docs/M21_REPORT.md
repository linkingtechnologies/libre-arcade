# Zooming Secretary — M21 Day 6 playable

## Status

**M21: GREEN.**

The browser campaign now runs:

`Day 1 → Day 2 → Day 3 → Day 4 → Dream → Day 5 → Day 6`

Day 6 is a clean-room semantic reconstruction of the v1.02 gameplay geometry. No original nametable, CHR, graphics, music, fact text, ROM, manual or historical C/ASM source is distributed.

## Day 6 oracle

- target calls: **35**
- active topics: **4**
- phones: **4**
- base call delay: **400**
- spawn: `(56,120)`
- coffee: `(104,73)`
- ManBox: `(184,120)`, initially moving right
- certified side floors: `56 / 120 / 184`
- semantic collision SHA-256: `0b35b5cab87744bc99e7871af7d2245fdfde103a9f7056ebb490d7978c1eb185`

Binary-real seed-1 initialization:

- RNG after init: **125**
- call delay after phone setup: **360**
- phone counters: `408 / 678 / 926 / 1163`
- phone topics: `Earth / Earth / Space / History`
- binary-real factoid indices in stage topic order `[Earth, Books, History, Space]`: `8 / 0 / 6 / 17`

## ManBox

M21 exercises the full gameplay-relevant ManBox contract already frozen by M12:

- movement only on even gameplay frames;
- same-floor overlap knocks the player for 48 ticks;
- initial knock reverses ManBox direction;
- persistent overlap effectively extends the knock because the source decrements the player knock timer before the NPC phase, then ManBox increments it again;
- after movement, missing platform support reverses direction;
- leaving the left/right screen edge re-enters inward on a random side-accessible floor;
- floor selection consumes the shared gameplay RNG;
- re-entry waits 50 ticks.

The renderer uses a new neutral placeholder and does not reproduce the historical sprite.

## Campaign allowance

The Dream result remains persistent:

- Dream phone answered → Day 5 and Day 6 use **5** allowed misses;
- Ghost catch → Day 5 and Day 6 use **3** allowed misses;
- retrying Day 6 preserves the inherited allowance.

## Playability checks

A real movement test covers:

`spawn → lower floor → central lower ladder → vertical wrap → upper floor → coffee`

Coffee pickup reaches the original maximum target speed `34/16 = 2.125 px/tick`.

## Regression

M21 adds **20** tests. Full distributed regression:

**193 / 193 tests passed.**

## Distribution gate

- forbidden historical media/source scan: **0 hits**
- JS syntax check: **42 files passed**
- local HTTP smoke: **200 OK**
- Chromium headless: **not certified**; the container times out while DBus/UPower services are unavailable.
