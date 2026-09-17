# M0.9 RC7 — Flipper strike parity

## Finding
Central one-tick strikes were already close to the exact Box2D 2.3.2 reference. Increasing torque would have made normal contacts too strong.

The actual regression was the left joint-limit timing: after a one-tick tap Box2D continues inertially from about -45 degrees to about **-52.116 degrees** before the constraint corrects the joint. The JS solver previously clamped the lower limit early, stopping near -46 degrees and missing some late/tip contacts.

## Change
- active torque remains 25 N·m;
- motor target remains ±25 rad/s;
- while the left flipper is held, the stable RC3 hard-stop behaviour is retained;
- after release, the left lower-limit state includes Box2D angular slop, allowing the inertial snap before the next constraint correction;
- right-side behaviour is unchanged.

## Exact Box2D reference strikes
- left ball (165,724): min vy = -117.6624 px/s
- left ball (175,720): min vy = -105.1119 px/s
- right ball (233,720): min vy = -95.5480 px/s
- right ball (223,724): min vy = -97.5223 px/s

The previously missed left late-tip case at (175,714) also produces an upward strike again.
