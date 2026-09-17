# M0.9 RC3 — resting-contact correction

RC2 used velocity-based sleep on a simplified resting case. The live runtime exposed a failure on the right flipper where post-solver position was stable but sequential constraint solving recreated ~1.4–1.7 px/s of residual velocity every frame.

RC3:
- measures the full-table right flipper powered stop from vendored Box2D 2.3.2 (46.523 degrees);
- models that effective geometry stop;
- removes the RC2 single-flipper velocity projection;
- detects a stable resting manifold only when a powered flipper plus a second support hold the ball and post-solver positional drift is negligible;
- verifies both left and right Box2D resting equilibria and wake-up on input change.
