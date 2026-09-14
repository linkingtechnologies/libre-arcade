# UI v0.11 — historical board fidelity + calibration

## Goal

Use the real historical `Ganzenbordspel.jpg` scan as the alternative theme while keeping board geometry independent from gameplay rules.

## Runtime themes

1. `ganzenbord-pd`
   - main historical SVG presentation;
   - geometry in `data/board-layouts/ganzenbord-pd.json`.

2. `ganzenbordspel`
   - original Daan Hoeksema scan requested through the canonical Wikimedia Commons `Special:Redirect/file/...` URL;
   - local `assets/boards/ganzenbordspel-inspired.svg` remains a fallback if the remote scan cannot load;
   - geometry in `data/board-layouts/ganzenbordspel.json`.

The second geometry file is intentionally marked `provisional` until its 63 hotspots have been reviewed against the original scan.

## Calibration mode

Open the game with:

```text
?debugBoard=1
```

In this mode:

- all 63 square hotspots become visible;
- a hotspot can be dragged with pointer/mouse/touch;
- coordinates are normalized percentages of the rendered board;
- changes remain presentation-only;
- `Save` stores the calibration in localStorage for the active theme;
- `Reset` restores the project defaults;
- `Export JSON` exports a complete calibrated board-layout file.

## Separation from gameplay

The rules engine still addresses only integer square numbers. The rendering flow is:

```text
core square index
    -> selected board-layout JSON
    -> normalized x/y coordinate
    -> DOM hotspot
    -> token animation
```

Switching or calibrating artwork therefore cannot change dice, turn order, rules, seeded RNG, save state or victory conditions.
