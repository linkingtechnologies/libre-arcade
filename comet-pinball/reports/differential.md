# M6 differential report

Generated from `tests/differential.js` against the historical native oracle.

| Scenario | Frames | Max position error | Max velocity error | Max angle error | Max omega error |
| --- | ---: | ---: | ---: | ---: | ---: |
| Launch | 90 | 0.001316345 m | 0.020974924 m/s | — | — |
| Launch | 146 | 0.008512234 m | 0.020974924 m/s | — | — |
| Launch | 150 | 0.009012605 m | 0.020974924 m/s | — | — |
| Flipper | 8 | 0.000293519 m | 0.000727786 m/s | 0.002294903 rad | 0.003516398 rad/s |
| Flipper | 45 | 0.000496559 m | 0.000728046 m/s | 0.002294903 rad | 0.003516398 rad/s |
| Revolute joint | 60 | 0.000000026 m | 0.000000285 m/s | 0.000000512 rad | 0.000002252 rad/s |

M6's launch figures are intentionally unchanged from M5: this milestone targets the dynamic ball/flipper island and the narrow moving-flipper TOI follow-up.

The flipper improvement is the central M6 result. M5 measured roughly `9.696 mm / 0.112347 m/s` over the first eight frames; M6 measures roughly `0.294 mm / 0.000728 m/s`.
