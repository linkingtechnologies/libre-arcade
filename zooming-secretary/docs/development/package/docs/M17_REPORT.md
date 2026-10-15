# Zooming Secretary — M17 Day 3 playable

## Result

**M17: GREEN.** The browser campaign now runs Day 1 -> Day 2 -> Day 3. A loss retries the current day.

## Day 3 parity scope

Day 3 is a semantic reconstruction of the binary-certified v1.02 collision topology. No original NES nametable bytes or media are present in the distributable.

Certified configuration:

- target: 20 calls;
- miss limit: 3;
- 3 phones;
- 3 topics: Earth/Geography, History, Books/Literature;
- player spawn: `(40,56)`;
- coffee: `(120,65)`;
- Bouncer: `(200,56)`, initial direction left;
- phones: `(120,128)`, `(32,192)`, `(216,192)`;
- cabinets: Earth `(38,128)`, History `(198,128)`, Books `(118,192)`;
- call delay: 250;
- binary-real initialization with seed 1: RNG 162, call delay 220, phone counters 266/496/759, phone topics 2/0/0, factoid indices 1/5/0;
- first ring ticks: 266/496/759;
- side-accessible floor Y values: 56, 120, 184.

The generated 704-cell collision map SHA-256 is:

`846def0c8a5bfc2d6a67579351d5d50b3645b2b78e632da374d770124286ea87`

## New playable mechanics

- Books/Literature becomes the third topic.
- Bouncer is a physical blocker: collision resolves the player's X position before the Bouncer's own movement.
- Bouncer moves one pixel every fourth gameplay frame and reverses at the screen edges.
- Coffee remains active on Day 3.
- Campaign transition Day 2 -> Day 3.

## Core correction discovered in M17

Real downward navigation exposed a one-pixel mismatch in `tickPlayerMotion()`.

The NES source checks upward ladder entry at `player_y + 23`, then increments the sample Y before checking DOWN, so descending entry uses `player_y + 24`. Earlier JS used `+23` for both directions. M17 corrects DOWN to `+24` and adds a regression test that descends from Day 3's upper floor to the middle floor through real movement.

All earlier regression suites remain green after the correction.

## Acceptance

- previous suites: 100/100;
- M17: 16/16;
- total: **116/116**.

## Media/legal boundary

Still excluded: ROM, CHR, nametable headers, original graphics, music, manual, labels, screenshots and historical C/ASM sources. The browser visuals remain new placeholder graphics.
