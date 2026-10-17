# Archaeological baseline and restoration model

## Baseline

The behavioral baseline is the original **Ri-li 2.0.1** source release from 2007. Modern forks were not used to redefine gameplay behavior.

The key preserved rules are:

- fixed 17×15 board with 50 authored levels;
- continuous distance-based locomotive motion rather than grid-step Snake movement;
- straight track length 40 px and quarter-circle curve length 31.416 px;
- wagon positions reconstructed from the locomotive trajectory history;
- original wagon spacing, stretch/shrink/speed behavior and self-collision rules;
- direction-priority buffer at junctions rather than direct free steering;
- time-based simulation with the historical 60 FPS loop cap treated separately from speed;
- original level progression, lives, Human Rights quiz and high-score insertion behavior.

## Behavioral oracle

The JavaScript gameplay core was compared against executed original C++ logic using deterministic traces. The parity tests compare floating-point state, board state, RNG-dependent wagon types, trajectory history, score/lives, direction priorities and wagon geometry.

The core comparison retained in this release reports **16,265 comparisons and zero mismatches** across the reference scenarios.

## Rendering and assets

The original `sprites.dat` format was decoded losslessly into PNG frames while retaining dimensions and pivots. The Canvas renderer uses the original frame selection and pivot rules. Rasterized English/Italian UI assets are preserved rather than re-typeset for gameplay screens.

## RNG

The historical Linux baseline uses the glibc `rand()` sequence. The browser compatibility layer reproduces that stream so RNG-sensitive behavior remains deterministic relative to the validated baseline.
