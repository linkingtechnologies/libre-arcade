# M0.9 RC8 — Flash-style flipper snap

## Archaeological finding
The recovered Flash bytecode applies an additional impulse `(0,-13.5)` near the flipper tip (application offset about ±45 px at the Flash physics scale of 30 px/m) on the initial key-down event. DocDonkeys 1.0 omits that impulse and uses motor control only.

## Restoration choice
RC8 keeps the DocDonkeys 2018 table, rules, motor settings and calibrated contact model, but the normal player profile restores the *effect* of the historical key-down impulse.

The raw Flash impulse is not copied numerically because the two implementations use different scale, mass, inertia, limits and geometry. Instead, the clean-room solver applies a bounded ±6 rad/s angular-velocity assist once per flipper press edge.

## Profiles
- `flash-enhanced` — default player experience.
- `docdonkeys` — strict 2018 flipper reference; select with `?flipper=docdonkeys`.

## Safety/parity constraints
- active torque remains 25 N·m;
- motor target remains ±25 rad/s;
- ball restitution/mass unchanged;
- assist is one-shot only;
- held-flipper resting-contact sleep still passes;
- all DocDonkeys calibration tests continue to run against the `docdonkeys` profile.

## Regression measurement
At a representative one-tick strike near `(170,724)`:
- DocDonkeys profile: approximately -122 px/s vertical velocity;
- Flash-enhanced profile: approximately -236 px/s.

This is behavioural restoration, not numerical Flash parity.
