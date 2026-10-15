# Zooming Secretary — M18 Day 4 playable

## Result

**M18: GREEN.** The HTML5 campaign now runs Day 1 → Day 2 → Day 3 → Day 4. A loss retries the current day.

## Day 4 parity scope

Day 4 is a semantic reconstruction of the binary-certified v1.02 collision topology. No original NES nametable bytes or media are present in the distributable.

Certified configuration:

- target: 25 calls;
- miss limit: 3;
- 2 phones;
- 3 topics: Earth/Geography, History, Books/Literature;
- player spawn: `(24,56)`;
- phones: `(56,64)`, `(192,64)`;
- cabinets: Earth `(22,192)`, History `(118,192)`, Books `(214,192)`;
- coffee: `(120,129)`;
- Chatter: `(152,120)`;
- call delay: 250;
- binary-real initialization with seed 1: RNG 207, call delay 230, phone counters 252/504, phone topics 1/1, factoid indices 7/8/3;
- first ring ticks: 252/504;
- side-accessible floor Y values: 56, 120, 184.

Collision-map SHA-256:

`2f475cb2a4c87ca8f0695a2fb9667b1e93eefaea6c1ed0dac9255bf6f775691f`

## Chatter

Chatter is now part of the playable browser campaign. Same-floor proximity can replace the player's single memorized topic. The contact starts a 50-tick talk phase followed by a 100-tick cooldown. The shared RNG is consumed exactly as in the frozen M12 core.

The browser surfaces the overwrite explicitly so the player can see that memory changed, without exposing debug/provenance UI.

## Playability coverage

Automated movement checks prove that:

- the player can descend from the Day 4 spawn to the middle floor;
- movement can continue to the lower cabinet floor;
- normal movement can reach Chatter and trigger an actual topic overwrite;
- the lower ladder tail performs the original vertical wrap back to the upper floor;
- coffee is active on the middle floor;
- 25 valid answers win and 3 misses lose.

## Acceptance

Previous suites: 116/116.

M18: 18/18.

Total: **134/134**.

## Media/legal boundary

Still excluded: ROM, CHR, nametable headers/bytes, original graphics, music, manual, labels, screenshots and historical C/ASM source. Day 4 is represented only by new semantic collision-builder code, behavioral coordinates and new placeholder rendering.
