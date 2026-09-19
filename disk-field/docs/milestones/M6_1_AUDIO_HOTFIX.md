# Disk Field M6.1 — audio startup hotfix

M6.1 fixes a browser/Web Audio startup issue found during manual acceptance testing.

## Changes

- Web Audio unlock is attempted from the first global `pointerdown`, `touchstart`, or `keydown`, covering canvas, toolbar, touch controls, and keyboard navigation.
- `AudioSystem.unlock()` explicitly resumes a suspended `AudioContext` before starting music.
- Music remains controlled independently by **Musica / Music** and is not started when that setting is off.
- The procedural loop mix is raised moderately: lead notes `0.010 → 0.022`, bass `0.012 → 0.026`, accent `0.006 → 0.011`, and music master target `0.72 → 0.86`.
- Bass moves from ~55 Hz to ~73 Hz so it is less likely to disappear on laptop/phone speakers.
- No historical audio file is introduced.

## Preservation boundary

`public/js/engine.mjs` and `public/js/levels.mjs` are unchanged from M6. Physics, level data and the 17/17 solvability corpus are therefore untouched.

## Regression

`tests/m61-audio-start-checks.mjs` creates a suspended fake `AudioContext`, verifies that `unlock()` resumes it, verifies that music scheduling starts, and statically verifies the three global gesture hooks and audible mix constants.
