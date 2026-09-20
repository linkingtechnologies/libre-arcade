# M10 full-game differential: unchanged M7 input, unchanged native reference

The historical libGDX JAR trace is 1842 frames with 532 events, score 45, drains [602, 1216, 1830]. The JS replay is the unchanged M7-scripted 3,600-frame / 60 Hz run; M10 reaches score **75** and **0 scripted drains**. This is not game-level parity. After the frame-434 trajectory split, the simulated ball returns to the launcher; no second plunge exists in the unchanged input script. The existing game controls *do* support a manual relaunch; the M10 fullgame regression checks this impulse.

| Divergence threshold | M9 | M10 |
| --- | ---: | ---: |
| first1mm | 407 | 407 |
| first5mm | 433 | 433 |
| first10mm | 437 | 437 |
| firstVelocitySignificant | 434 | 434 |

The first scoring-event mismatch remains native frame **458**, versus JS frame **478**. The first raw callback mismatch remains frame **6**. The post-M9 callback feature mismatch remains at frame **434**: native starts `flipper-right:poly` but the already-drifting full-world JS state does not create it in that frame. The **isolated** native frame-433 state *does* match the new polygon-seeded JS TOI and the frame-402 predecessor test remains unchanged.

M10 horizontal ball range over all 3,600 JS frames: **0.029528445–0.736056428 m**. Manual relaunch state observed at frame **816**. M9, before both M10 changes, scored 435 and drained at [1673, 3358]; downstream game outcomes differ and were **not** fitted back to historical drains or score. See full machine-readable metrics in `reports/fullgame-differential.json`. The fixture inputs in `reference/oracle/` remain byte-identical to final M9.
