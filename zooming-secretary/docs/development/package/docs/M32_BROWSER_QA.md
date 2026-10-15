# M32 — Browser QA checklist

Version: **1.0.0-rc.9**

Manual checks in a normal browser:

- [ ] On Day 1, walk onto each ladder and hold Up: climbing starts immediately.
- [ ] Hold Down, then press Up without carefully releasing Down first: the new Up intent wins and climbing works.
- [ ] Hold Up, then press Down: the new Down intent wins.
- [ ] Pause while moving vertically, resume, then use a ladder: no direction remains stuck.
- [ ] Alt-tab / change browser focus while holding a direction, return, then use a ladder: no direction remains stuck.
- [ ] On touch controls, slide/release fingers around Up/Down and then climb: no stale opposite vertical input remains.
- [ ] Play through at least one stage transition and verify the next stage starts with neutral movement input.
- [ ] Day 4/5+ edge-ladder help is visible in the intro card in EN and IT.
- [ ] On an edge ladder continuing through the bottom boundary, keep pressing Down and verify the historical vertical wrap occurs.
- [ ] On the corresponding top continuation, keep pressing Up and verify the inverse route works.
- [ ] Ordinary ladders still require the same positioning as before; no magnet/snap or altered collision behavior is introduced.
- [ ] Phone ringing, answer/miss audio, title screen and M30 answer tutorial remain unchanged in feel.
