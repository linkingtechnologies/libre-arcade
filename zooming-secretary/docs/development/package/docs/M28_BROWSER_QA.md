# M28 — Browser QA checklist

Version: **1.0.0-rc.5**

Automated rendering/core tests are GREEN. Run this visual/audio smoke in a normal browser:

- [ ] 1280×720: black playfield and striped platforms remain crisp; no vertical scroll.
- [ ] 1024×600: HUD remains legible and none of CALL/MISS/MEMORY clips.
- [ ] 320×568 portrait: pixel art remains readable and touch controls do not cover the canvas.
- [ ] 568×320 landscape: compact touch controls remain visible.
- [ ] protagonist clearly reads as a small human office-worker, not a moving rectangle.
- [ ] green filing cabinets are visually distinct from phones and coffee.
- [ ] ringing phone shows visible pixel rays and urgent final phase is visibly white.
- [ ] Chief / Bouncer / Chatter / Geek / ManBox / Dibrov remain distinguishable without debug letters.
- [ ] Dream Ghost and desks remain readable against the black playfield.
- [ ] `Missed call` / Italian equivalents remain inside the feedback box.
- [ ] Start, ring, answer, miss, pause/resume and win/lose sounds are audible on the device.
- [ ] mute/unmute and persisted audio preference still work.

Do not promote RC5 to 1.0.0 until these checks are visually/audibly confirmed.
