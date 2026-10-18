# Preservation notes

## Historical baseline

Repository: `fernjager/game-off-2013`  
Baseline commit: `56bcde6458af8957f8e439d98df8361a43d2f6e5`

The executable port does not use the original BY-NC artwork/dialogue assets. Historical material is isolated under `/reference`.

## Thermal model preserved

The port preserves the original mathematical cooking model, including:

- turkey density `1050 kg/m³`;
- specific heat `2000 J/kgK`;
- convection coefficient `9 W/m²K`;
- conductivity `0.412 W/mK`;
- initial temperature `20 °C`;
- measurement radii Skin `0.85 R`, Body `0.45 R`, Core `0.01 R`;
- equivalent radius derived from mass using the original turkey proportions;
- Fourier and Biot numbers;
- roots of `1 - λ cot(λ) - Bi = 0`;
- analytical transient spherical temperature series;
- oven temperature ramp and historical thermal re-anchoring behavior;
- water-loss accumulator `10^((T-20)/80)-1`;
- original cook-state thresholds.

## Historical behaviors intentionally retained

The preservation mode documents and retains several unusual original behaviors instead of silently correcting them:

- cooking time and wall-clock time can diverge under a stalled legacy browser loop;
- Casual skip performs 1200 one-second thermal ticks;
- the historical alarm can become negative after skip before its next real-time update;
- opening the oven does not introduce an additional thermal-loss term because the historical implementation left that behavior disabled;
- the original score defines a separate Core condition table but evaluates the Core with the Skin condition table;
- the original temperature-score helper contains a Skin optimum branch that the score screen does not actually select.

These are preserved as characteristics of the historical game implementation. Modern presentation and accessibility improvements are kept outside the preservation core.

## Save/resume

A saved session serializes the internal thermal and runtime state required to continue the numerical trajectory rather than reconstructing the turkey from visible temperatures alone.
