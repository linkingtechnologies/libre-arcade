# Disk Field 1.0 / 1.01 — oracle report

## Result

**All recorded v1.0 and v1.01 observations are byte-identical.**

The deterministic corpus covers **2,238 dynamic ticks** plus **85 vector-field samples** (5 fixed sample points × 17 levels).

Dynamic cases:

| Case | ticks | collision ticks | black-hole entry | completion |
|---|---:|---:|---:|---:|
| level0_idle | 240 | 209 | — | — |
| level0_rotate_ccw | 138 | 1 | — | tick 137 |
| level1_rotate_mix | 300 | 155 | — | — |
| level3_rotate_mix | 360 | 35 | — | — |
| level6_dodge_seeded | 360 | 144 | — | — |
| level8_holes | 420 | 98 | — | — |
| level12_blackholes | 420 | 108 | tick 299 | — |

The random case uses seed `20070906`; all other normal cases use a fixed seed declared in `cases.json`.

## Archaeological conclusion

The post-contest 1.01 changes do **not** alter the observed tick-domain simulation in this corpus. That agrees with the file-level stratigraphy: physics, level definitions and core object mechanics are unchanged. The observable improvements in 1.01 are compatibility, rendering and execution-performance changes.

There remains a distinction between **tick-domain equivalence** and **wall-clock equivalence**. Because Disk Field advances physics once per rendered frame and does not integrate a measured `dt`, a slow 1.0 runtime could advance fewer simulation steps per real second than a faster 1.01 runtime. Re-enabling Psyco and optimizing arrows could therefore improve real-time pacing without changing any per-tick trajectory.

## Baseline decision

Use **1.01 as the archaeological implementation baseline**, while keeping 1.0 as the official PyWeek submission snapshot. For any future port, the checked-in traces should be treated as regression fixtures; a port should reproduce them within an explicitly documented numeric tolerance before gameplay tuning is permitted.

## Confidence boundary

The source oracle executes the original state/physics modules but uses current Python/NumPy plus headless compatibility stubs. Absolute equivalence to the exact 2007 Python/Pygame numerical runtime remains a separate historical-runtime test. No Python 2 runtime was available in the current execution environment, so that claim is intentionally left open.
