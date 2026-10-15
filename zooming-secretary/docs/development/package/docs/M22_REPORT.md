# Zooming Secretary — M22 Day 7 + Ending

## Result

**M22 status: GREEN.**

The playable clean-room browser campaign is now complete:

**Day 1 → Day 2 → Day 3 → Day 4 → Dream → Day 5 → Day 6 → Day 7 → Ending**

## Day 7 oracle

- target calls: **40**
- active topics: **4**
- phones: **4**
- base call delay: **450**
- collision SHA-256: `001540386831a1bea579ef090bcba039aecdec2314de09a54deef6149bfcc326`
- spawn: `(112,120)`
- coffee: `(136,193)`
- Dibrov: `(248,184)`, initial direction LEFT
- side floors: left/right `[56,120,184]`

Binary-real seed-1 initialization:

- RNG after init: **125**
- call delay after init: **410**
- phone counters: **452 / 704 / 959 / 1199**
- phone topics: **Earth / Earth / Books / History**
- binary-real factoid indices by stage cabinet order `[Earth, Books, History, Space]`: **2 / 0 / 8 / 3**

## Dibrov behavior implemented

- same-floor speed: 2 px on even gameplay frames, 1 px on odd frames;
- different-floor speed: 1 px every 2 frames;
- moves away from the player;
- contact grants **500 ticks of wisdom**;
- first wisdom contact consumes four shared RNG values for two decorative-heart emissions;
- non-bonus wisdom continues to consume two RNG values every eighth frame for decorative-heart parity;
- edge exit selects one certified side-accessible floor and turns inward;
- re-entry wait is **25 ticks** without wisdom or **current wisdom + 25** with wisdom.

Wisdom is wired into phone answering: while active, any requested topic can be answered.

## Ending

Winning Day 7 at 40 calls now shows a new clean-room bilingual ending screen. It does not copy the historical ending art or wording. Restart begins again from Day 1 and resets the future Dream-derived miss allowance to 3.

## Regression

- M22 new tests: **20/20**
- full M9→M22 suite: **213/213**
- JS syntax check: **42/42 modules**
- local static HTTP smoke test: **HTTP 200**
- forbidden historical asset/source scan: **0 matches**

## Distribution boundary

No original ROM, CHR, nametable/map source files, graphics, music, labels, manual, screenshots, fact text, or original C/ASM source are included.
