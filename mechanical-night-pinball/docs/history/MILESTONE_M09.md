# M0.9 RC2 — Physics parity hardening

M0.9 targets solver regressions that can survive ordinary gameplay tests even when the main numeric calibration is correct.

## Fixed

- Box2D 2.3.2 `b2_velocityThreshold` parity: contacts below 1 m/s (50 px/s) are inelastic.
- Box2D sleep constants are represented and the ball has sleep/wake state.
- `b2ChainShape::CreateChain` is now treated as an **open chain**. M0.8 incorrectly added a final last-to-first edge.
- Same-frame contact/sensor callbacks are debounced across internal substeps.
- Ramp, peg and top-right-bumper physical mutations are deferred until the end of the physics frame, matching the C++ module order.
- Adaptive substeps are used only for very fast motion to reduce tunnelling risk without disturbing normal calibrated trajectories.

## Invisible-barrier audit

The open-chain bug created genuine phantom closing segments. The longest were on the bumper-hugger chains and could make the ball appear to follow an invisible diagonal rail.

The clean-room artwork now explicitly renders all gameplay-relevant base collision rails and active ramp boundaries. Joint attacher circles are also represented as visible mechanical bearings.

For future audits, launch with:

`?debug=colliders`

This overlays collision chains, circles, rectangles and sensors over the artwork.

## Still intentionally not claimed

The JavaScript solver is not a bit-identical port of the full Box2D contact solver. Warm starting and the complete iterative manifold solver are not reimplemented. The archived Box2D harness remains the numerical reference for calibrated behaviours.


## RC2 resting-contact correction

RC1 still allowed a slow ball contact to perturb a powered flipper after it had reached its joint-limit stop. Because the clean-room solver resolves motor, limit and ball contact sequentially rather than as one Box2D constraint island, this could feed energy back into a nearly stationary ball. RC2 treats low-speed contact against a powered hard-stop flipper as a static support and projects only sub-pixel residual motion to zero before the normal Box2D sleep timer runs. A captured gameplay regression test now requires the ball to settle and remain asleep.
