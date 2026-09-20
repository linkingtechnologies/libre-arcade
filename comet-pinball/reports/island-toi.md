# M6 island / TOI archaeology report

## Question

Why did M5 still diverge noticeably when a live flipper struck the ball even though the isolated revolute joint and the static contact solver were individually close to the native engine?

## Finding 1 — solver ordering matters

The old Box2D island solver initializes contacts, warm-starts them, initializes joints, then executes six velocity iterations. Every iteration solves the joints first and the contact solver second. M5 did not preserve that coupling.

M6 does. The same flipper COM velocity and angular velocity are shared by the joint and contact constraints throughout all six iterations.

## Finding 2 — the first historical frame has two solves

The new native `flipper-detail.csv` trace reports two `postSolve` callbacks on frame 0. Both are the tapered polygon fixture (fixture index 2). The first carries a normal impulse of about `0.040741123` scaled to browser units; the second reports zero normal impulse but occurs after the flipper angle has moved from about `-0.655504` to `-0.680072` rad.

That is strong evidence that the remaining state change belongs to the continuous/TOI positional phase rather than a missing ordinary contact impulse.

## Finding 3 — historical TOI settings

The Box2D 2.2.x reference source uses a TOI position factor of `0.75`, configures the TOI substep with `20` position iterations and disables warm starting. The TOI position solver is contact-centric rather than another ordinary joint/contact island pass.

M6 reconstructs only the subset needed by Comet's bullet ball against a moving flipper.

## Result

Measured against the preserved Comet native oracle:

- 8-frame flipper max position error: `0.000293519 m`;
- 8-frame max velocity error: `0.000727786 m/s`;
- 45-frame max position error: `0.000496559 m`;
- 45-frame max velocity error: `0.000728046 m/s`;
- max flipper angle error: `0.002294903 rad`;
- max flipper omega error: `0.003516398 rad/s`.

The isolated revolute-joint trace remains at the previous near-float-level parity, so the improvement did not trade away the M4/M5 joint result.

## Qualification

M6 still is not a generic Box2D reimplementation. The narrow TOI pass is deliberately limited to the observed Comet flipper case. Static upper-curve contacts and bumper CCD retain the M5 paths that already matched their historical oracle scenarios well.
