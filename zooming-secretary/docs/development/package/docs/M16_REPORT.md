# Zooming Secretary — M16 Day 2 playable

## Result

**M16: GREEN.** The browser build now contains the first two working days of the campaign. Day 1 advances to Day 2; a loss retries the current day.

## Day 2 parity scope

Day 2 is a semantic reconstruction of the certified v1.02 collision topology. No original NES nametable bytes or media are present in the distributable.

Certified configuration:

- target: 15 calls;
- miss limit: 3;
- 3 phones;
- 2 topics (Earth/Geography, History);
- player spawn: `(16,120)`;
- coffee: `(56,65)`;
- Chief: `(224,120)`;
- call delay: 250;
- binary-real initialization with seed 1: RNG 81, call delay 220, phone counters 252/504/774, phone topics 0/0/0, factoid indices 6/6;
- side-accessible floor Y values: 56, 120, 184.

The generated 704-cell collision map SHA-256 is:

`81b5e842798c17735f3962ccab79789d9b2cba0fa230549aa9e2d01d97fab777`

## New playable mechanics

- Chief proximity/talking and next-frame slowdown.
- Coffee initial cooldown, ready event, pickup, strength 20 and speed target boost to 34/16 px per tick.
- Three simultaneous phone schedules.
- Campaign transition Day 1 -> Day 2.

## Media/legal boundary

Still excluded: ROM, CHR, nametable headers, original graphics, music, manual, labels, screenshots and historical C/ASM sources. The browser visuals remain new placeholder graphics.
