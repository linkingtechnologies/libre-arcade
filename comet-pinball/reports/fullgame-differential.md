# M8 full-table differential report

M8 reruns the deterministic three-ball replay from M7 after two measured historical-physics corrections: dynamic flipper/static lower-corner contact and the frame-133 `ball ↔ obstacle:7` circle/polygon TOI.

The native Comet Pinball 1.1.0 JAR remains the oracle. Full-game equivalence is **not** claimed.

## Historical oracle

The original libGDX/Box2D engine produces:

- 1,842 state frames, 30.7 s at 60 Hz;
- 532 ordered events;
- drain frames `602`, `1216`, `1830`;
- final score `45`.

## M8 browser replay

The current JS replay produces:

- 906 state frames, 15.1 s;
- drain frames `290`, `592`, `894`;
- final score `0`.

The later-game outcome is chaotic and still non-equivalent. M8 deliberately does not fit constants to force the final score or drain timing.

## Differential boundaries

The velocity-error significance threshold used by this report is `0.05 m/s`.

| Metric | M7 baseline | M8 |
| --- | ---: | ---: |
| first position error > 1 mm | 87 | 87 |
| first position error > 5 mm | 118 | 118 |
| first position error > 10 mm | 153 | 169 |
| first velocity error > 0.05 m/s | 133 | 182 |

At frame 133, after the new `obstacle:7` TOI path, the remaining error is:

- position `0.006112635 m`;
- velocity `0.006584507 m/s`.

M7 at the same frame had about `1.288077 m/s` velocity error. The frame-133 material velocity discontinuity is therefore removed.

At frame 182 the error grows to:

- position `0.010488161 m`;
- velocity `0.326582186 m/s`.

## Contact-event differential

The optional JS diagnostic contact trace is stored in `reports/fullgame-js-contact-events.csv`.

Two contact boundaries must be distinguished:

1. **Raw callback timing:** the first exact per-frame contact-event mismatch is frame 6. JS reports `CONTACT_BEGIN ground`; the native callback occurs at frame 7. This early one-frame callback phase difference predates the material trajectory boundary.
2. **First post-obstacle feature mismatch:** frame 182. The native engine begins both `sling-corner:5` and `sling-reactive:5`; JS begins `sling-corner:5` only.

The second mismatch is dynamically material. It explains the next velocity discontinuity and the subsequent scoring divergence.

## Scoring differential

The native first scoring event is:

`frame 183: HIT sling-reactive:5, +5`

M8 has no scoring hit before its first drain at frame 290. Therefore the first scoring-event divergence remains frame 183, but its cause is now localized after the corrected frame-133 obstacle collision.

## Flipper/corner result

The left flipper lower-corner path is no longer a material early-table source of divergence. Across the first 90 full-game frames:

- maximum left-flipper angle error ≈ `2.384e-6 rad`;
- maximum left-flipper angular-velocity error ≈ `7.629e-6 rad/s`.

The dedicated isolated test gives frame-57 normal impulse `3.575741215` vs native `3.575747013` and tangent impulse `-0.715148224` vs native `-0.715149283`.

## Next target

The next parity investigation should isolate the frame-182 slingshot feature set, especially the relationship between the circular corner fixture and the reactive polygon. The pre-existing upper-curve phase error visible from frames 87/118 should also remain visible and measured; it must not be removed by trajectory fitting.
