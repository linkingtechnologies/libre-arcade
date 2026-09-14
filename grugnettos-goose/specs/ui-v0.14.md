# UI v0.14 — local historical originals + calibrated Ganzenbordspel

## Goal

Use locally bundled historical artwork directly at runtime and remove all board-art network fallbacks.

## Bundled board assets

- `assets/boards/original/Ganzenbord_pd.svg`
  - exact Commons SVG;
  - published Commons SHA-1 verified.
- `assets/boards/original/Ganzenbordspel.jpg`
  - locally supplied 2048×1470 representation of the Daan Hoeksema historical scan;
  - runtime SHA-256 recorded in provenance.

## Ganzenbordspel calibration

The 63 circular numbered spaces were detected from the bundled JPEG and ordered along the continuous spiral beginning at square 1.

The resulting centres are stored as normalized percentages in:

`data/board-layouts/ganzenbordspel.json`

They are independent from the Ganzenbord PD layout.

## Runtime policy

- no board-art HTTP requests;
- no generated replacement board;
- if a bundled board file is missing, the UI marks the artwork as missing;
- game rules remain independent from board artwork.
