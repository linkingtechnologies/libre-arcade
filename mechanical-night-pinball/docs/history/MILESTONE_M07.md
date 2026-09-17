# M0.7 — UX + gameplay parity fine pass

## UX
- hi-score restored to the HUD (present in DocDonkeys 1.0);
- transient score feedback and event messages;
- distinct flipper press/release procedural clicks;
- quiet generic ball-contact sound restored alongside event-specific sounds;
- no debug/technical text added to the player UI.

## Gameplay parity verification
Added regression coverage for:
- upper-light multiplier cycle;
- third-ramp arming/hit/reset;
- two-ramp extra-ball sequence;
- lower-light/peg restoration scoring;
- tunnel timing and exit vector.

No calibrated M0.4 physics constants were retuned in this milestone.
