# Bumper-triggered upper-boundary escape — deterministic reproduction

**Baseline:** unmodified earlier JavaScript game. This diagnostic record reports a reproduced failure, **not** a corrected playable release.

## Method

At 60 Hz with the real JS engine, original playfield and no flipper/launch input, starting positions were placed near each of the three bumpers with 1 mm initial surface overlap and x offsets of −15/0/+15 mm. Initial horizontal speeds: −7, −5, −3, −1, 0, 1, 3, 5 and 7 m/s; vertical speeds: 2, 4, 6, 8, 10, 12 and 16 m/s. Across **567** sequences of up to 85 frames each (until drain or first exit), **44,350** simulation frames were executed. The detector raised **24** upper-region alerts; **9** had a preceding bumper `onHit` event. The remaining 15 alerts were not attributed to bumper impulses.

The detector approximated upper-left and upper-right arcs from centers (.30,1.10) and (.46,1.10), radius .295 m plus ball radius .0135 m plus .004 m tolerance; it also checked y > 1.4175 m. It is a **conservative geometric alarm**, not proof of the particular historical polygon first crossed. The real upper arcs comprise 30 rectangles each. Both focused traces had upper-curve TOI contacts and crossed the geometric alarm boundary.

## Two deterministic reproductions

| Region | Initial state (x, y; vx, vy) | Bumper event | First outside frame (zero-based) | Outside position |
|---|---|---|---:|---|
| Upper left | (.265, 1.1425; 3, 10) | bumper 2, frame 4 | 11 | (.024535664, 1.263816687) m |
| Upper right | (.465, 1.1425; 1, 4) | bumper 2, frame 9 | 19 | (.775054320, 1.231422275) m |

When **only** the reactive bumper impulse was disabled through the diagnostic `onHit` handler, neither starting state raised a boundary alarm during the next 85 frames. The impulse determined these particular anomalous trajectories, but that did **not** establish that the force magnitude—rather than curve collision handling—was wrong. The right-hand trace also crossed the actual external side-wall coordinate x=.760 m; it was not merely the legitimate route into the launch lane.

## Historical engine comparison

`CometBumperEscapeNative.java` used native Box2D and original JAR fixtures for an **isolated upper-table world** with bumpers and nearby obstacles. It applied the original `applyForceToCenter` impulse at bumper contact completion. None of the five compared native states, including the two highlighted above, raised a boundary alarm over 85 frames. The older JavaScript solver escaped in the two focused cases. This isolated upper-region reference was not a full-game replay and did not pinpoint the faulty TOI sequence on its own.

## Reproduction and diagnostic status

The two original assertions in the archived failure-reproduction harness were positive checks that the **older build escaped**; once repaired, such a harness will intentionally fail if run against the fixed runtime. The fixed-runtime **absence-of-escape** regression is `tests/m13.12-bumper-upper-wall.js`. Do not interpret an archived reproduction trace as a present release test failure. Regenerating native traces requires a separately downloaded, hash-verified historical JAR and the JDK.
