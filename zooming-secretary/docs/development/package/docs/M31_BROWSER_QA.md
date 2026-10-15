# M31 — Browser QA checklist

Version: **1.0.0-rc.8**

Manual checks in a normal browser:

- [ ] Fresh load opens on the Zooming Secretary title screen, not the Day 1 card.
- [ ] Title artwork looks intentionally NES-like but clearly new; no original logo/trade dress is shown.
- [ ] `PRESS START` / `PREMI START` updates with EN/IT.
- [ ] Enter and Space start from keyboard; tapping/clicking Start works on touch/pointer devices.
- [ ] Start remains on the title screen briefly, then reaches the Day 1 onboarding card after the 72-tick transition.
- [ ] Day 1 tutorial from M30 still appears and still explains cabinet → matching topic → phone.
- [ ] First ringing phone produces an audible ring cue.
- [ ] If ignored, the ring cue repeats about once per second while the call remains active.
- [ ] Answering the only ringing phone stops repeated ringing.
- [ ] A missed call stops its ringing; a later call starts ringing again.
- [ ] With two overlapping active calls, ringing remains noticeable without turning into a dense audio pile-up.
- [ ] Pause freezes repeated ring cadence; resume restores it only if a call is still ringing.
- [ ] Sound toggle immediately suppresses subsequent repeated ring cues.
- [ ] 320×568 portrait and 568×320 landscape keep Start reachable and title readable.
- [ ] Credits and language controls remain usable from the title screen.
