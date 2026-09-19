# Disk Field HTML5 M1 report

## Scope

M1 is the first playable preservation port. It deliberately excludes uncertain historical assets and focuses on behavioral fidelity.

## Implemented

- Vanilla JavaScript, no framework and no runtime dependencies.
- Canvas 2D renderer using the original 800×600 logical coordinate system.
- Fixed 30 Hz simulation separated from `requestAnimationFrame` rendering.
- All 17 active 1.01 levels.
- Original controllable/fixed vector-field split and bilinear grid interpolation.
- Gravity wells, repellers, spinners, area fields and fuzzy area fields.
- Static and moving walls, killer walls, boundary collision, angular/linear coupling.
- Black-hole transport sequence.
- Original immediate level progression and local unlocked-level persistence.
- Historical Level 7 (`Dodge!`) runtime randomization retained.
- Keyboard and touch controls.
- Responsive 4:3 display.
- IT/EN UI.
- Procedural Web Audio feedback; no historical audio assets.
- Archaeology query mode: `?all=1`.

## Oracle result

`node tests/run-oracle.mjs` passes all preserved test cases and all 85 field samples.

The long-running rotated cases show a maximum positional drift below 0.002 pixels from the Python oracle. All discrete event/state columns match exactly in the test corpus.

## Deliberate non-goals for M1

- Pixel-identical reproduction of the PyOpenGL menus/title screen.
- Reuse of MAKISUPA.TTF or historical audio.
- Reproduction of Python's Mersenne-Twister sequence for Level 7. Gameplay keeps the same random distributions; the oracle uses the preserved seeded level instance.
- Flash 2009 successor comparison.
- Reviving cut/dead crumble, blades, grow/shrink or generator experiments.

## Next preservation milestone

M2 should concentrate on UI/visual archaeology: compare the original screenshots and selector/menu code against this clean renderer, recreate the original menu/preview behavior without the quarantined font, and expand oracle coverage to moving-field and killer-wall edge cases before any aesthetic modernization.
