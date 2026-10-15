# M27 — Browser / readability QA

Version: **1.0.0-rc.4**  
Date: **2026-10-12**

## Defects entering M27

RC3 manual feedback identified two visible blockers:

- event text, explicitly including `Missed call`, could extend outside the notification box;
- the protagonist looked like a moving rectangle rather than a recognizable character.

## Automated containment/readability checks

- [x] `Missed call` bitmap pixels are inside the notification panel bounds.
- [x] Representative EN/IT gameplay messages fit in no more than two lines.
- [x] Long Italian Wisdom feedback wraps within the available logical width.
- [x] Notification renderer has no `fillText`/`measureText` dependency.
- [x] Player renderer no longer contains the old 10×17 body rectangle.
- [x] Player uses multiple visually separated body parts/colors.
- [x] Horizontal movement has two distinct walk poses.
- [x] Left/right facing produces distinct head/hair detail.
- [x] `src/player.js` and `src/simulation.js` remain byte-identical to RC3.
- [x] `web/audio.js` remains byte-identical to RC3.

## External RC4 smoke

- [ ] Trigger `Missed call`: all letters stay inside the dark panel.
- [ ] Trigger a long Wisdom message in EN and IT: max two lines, no clipping.
- [ ] Trigger Topic/Chatter/Telephone/Ghost/ManBox messages: no overflow.
- [ ] Player silhouette clearly reads as a person at normal desktop scale.
- [ ] Walking left/right visibly animates rather than sliding as a rigid block.
- [ ] Knocked tint and Wisdom outline remain readable.
- [ ] Start, Ring, Answer, Miss, Pause and Resume cues are audible.
- [ ] Mute/unmute still works and persists after reload.
- [ ] Existing desktop/mobile viewport matrix remains usable with no unwanted page scroll.
