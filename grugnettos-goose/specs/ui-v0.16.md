# UI v0.16 — turn narration

## Goal

Make CPU/opponent turns understandable without reading the event log, while preserving the no-scroll viewport-fit layout introduced in v0.15.

## Behaviour

A transient overlay sits inside `.board-stage` and therefore does not consume document height. During a CPU turn it reports, in sequence:

- whose turn it is;
- dice result;
- square-to-square movement summary;
- Goose, Bridge, Inn, Well, Maze, Prison, Death, swaps and skipped turns;
- victory;
- return of control to the next human player.

The overlay is driven by the same event stream consumed by `Animator`; no gameplay rule is duplicated in the UI. `Animator.play()` exposes `onEventStart` and `onEvent` hooks so narration is displayed before the associated animation and the event log is updated afterwards.

## Naming cleanup

The normal selector now uses `Ganzenbord`; internal descriptive terms such as “schema/schematic” stay out of the player-facing UI.
