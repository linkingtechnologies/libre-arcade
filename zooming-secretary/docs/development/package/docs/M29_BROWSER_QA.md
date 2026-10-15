# M29 — Final human/browser smoke checklist

Version: **1.0.0-rc.6**

Automated/headless playability is GREEN. Before promoting to public `1.0.0`, manually confirm in a
normal browser:

- [ ] Day 1 can be played with keyboard without unexpected snagging on ladders/platform edges.
- [ ] A requested cabinet can be collected and the corresponding ringing phone answered.
- [ ] Let three calls expire and confirm the loss flow/retry feels correct.
- [ ] Day 2 Chief slowdown is noticeable but does not feel like an input lock.
- [ ] Heroine remains visually readable during movement/falls/ladder climbing.
- [ ] `Missed call` and other feedback stay inside their boxes in EN and IT.
- [ ] Ring / answer / miss / pause / resume sounds are physically audible with Sound On.
- [ ] Mute (`M`) silences output and persists as expected after reload.
- [ ] 1280×720, 1024×600, 390×844 and 568×320 remain usable without page scroll/clipping.

If these pass, no gameplay-code change is currently indicated before `1.0.0`.
