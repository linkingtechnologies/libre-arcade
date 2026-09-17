# M0.9 RC4 — Flipper snap-input parity

RC4 fixes a browser/fixed-timestep input regression that could swallow a very short flipper tap.

A physical press and release that both occur between two 60 Hz physics ticks are now queued as:

1. one KEY_DOWN physics tick;
2. one KEY_UP physics tick.

This mirrors the original SDL KEY_STATE semantics without increasing flipper torque or motor speed. The calibrated M0.4 physical constants and the RC3 resting-contact hardening remain unchanged.

Regression tests cover both flippers and wake-up of a sleeping ball.
