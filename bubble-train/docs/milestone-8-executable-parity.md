# Milestone 8 — direct historical-executable parity audit

Milestone 8 moves the parity claim beyond source inspection by analyzing the actual historical compiled binaries recovered during the archaeology phase.

## Outcome

**PASS — direct static executable parity for the audited core gameplay invariants.**

No browser-port gameplay correction was required. Direct compiled evidence independently supports the web implementation of matching, ripple/insertion, bombs, Rainbow/Speed behavior, cannon geometry, spiral math, projectile motion, active-bullet limit, frame ordering and TrainStation spawn ordering.

The GP2X executable also exposes deliberate handheld adaptations (320×240 / 0.4 geometry and train-speed scale, approximately 30 Hz frame limiter, bullet-speed tuning to 8). These are not upstream rules and therefore are intentionally not imported into the OS4/upstream 800×600 @ 25 Hz browser baseline.

## New regression coverage

Three executable-derived tests were added in `tests/executable-parity.test.js`, bringing the complete suite from 57 to **60 passing tests**.

## Evidence

See:

- `docs/executable-parity-report.md`
- `docs/evidence/executable-parity/README.md`
- `docs/evidence/executable-parity/disassembly/`
- `docs/evidence/executable-parity/gp2x-level-scaling.csv`
- `docs/evidence/executable-parity/gp2x-vs-os4-level-hashes.csv`
- `docs/evidence/executable-parity/os4-literal-scan.txt`

## Remaining external gate

This milestone is static executable verification, not a live emulator/native-runtime capture. A validated OS4/GP2X runtime is still required before using the stronger label **live parity-certified**.
