# M5 contact-solver archaeology report

## Why M4 diverged

M4 already had good geometry and an excellent isolated revolute-joint reconstruction, but its generic collision path still behaved like an immediate one-shot resolver. That differs from the old Box2D contact model in several ways that matter on Comet's segmented upper curve:

1. polygon fixtures have a collision skin beyond their core vertices;
2. multiple neighbouring fixture contacts can coexist;
3. normal and tangent impulses are accumulated, not recomputed independently from zero each time;
4. prior-frame impulses warm-start persistent contacts;
5. velocity constraints are iterated six times before positions are integrated;
6. penetration correction is partial (Baumgarte), not a full teleport out of overlap.

## Native evidence

`launch-contact.csv` shows the preserved engine's post-solver contact events. At frame 56 the ball overlaps the effective region of several adjacent upper-curve fixtures. The native solver reports multiple contacts, but only one carries a significant final impulse:

- normal approximately `(-0.9868265, -0.1617820)`;
- scaled-to-browser normal impulse approximately `0.123155251`;
- scaled-to-browser tangent impulse approximately `-0.034833565`.

That impulse reproduces the historical frame-56 velocity almost exactly when applied with Box2D's restitution threshold and friction clamp. The left-wall rebound later appears at frame 147 with normal `(1,0)`.

## M5 implementation scope

M5 reconstructs the sequential impulse path for **static polygon contacts**. It intentionally does not pretend to be a whole Box2D port.

Circular bumper contacts stay on the adaptive CCD path inherited from the earlier milestones because the native bumper trace is already matched to sub-millimetre position accuracy and near-float-noise velocity accuracy.

Dynamic flipper contacts are still simplified relative to an old Box2D island solve: the historical engine interleaves revolute-joint and contact constraints inside each velocity iteration. M5's joint itself is already independently certified, but the contact and joint solvers are not yet fully coupled.

## Result

The most visible M4 launch error was the later wall rebound. The 150-frame maximum velocity error falls from about `0.79447 m/s` to about `0.02097 m/s` in M5.

The remaining roughly `9 mm` maximum position drift at 150 frames is useful evidence rather than a failure to report: it identifies manifold/contact-position phase as the next problem instead of rebound impulse magnitude.
