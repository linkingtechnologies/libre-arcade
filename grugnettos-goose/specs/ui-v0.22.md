# UI v0.22 — debug geometry and player identity

## Debug board geometry

The calibration editor must render the board artwork and the normalized 1–63 overlay in the same rectangle.

Earlier short-viewport debug layouts could compress the board element vertically while the historical image preserved its ratio through `object-fit: contain`. The overlay still filled the compressed element, making correct coordinates appear displaced.

v0.22 fixes this by fitting the debug board element itself inside the available stage at the historical artwork aspect ratio. The marker number is centered exactly on the normalized anchor; no cosmetic inward offset is applied.

## Player names

Player-facing identity now follows the Grugnetto/Kludgopol family convention:

- first human player: `Grugnetto`;
- CPU players, in order: `Zilla`, `Queen`, `Wallace`, `Hans`, `Mimrock`, `Lost Soul`, `Pazifik`, `Lemming`.

Names are presentation identity only and do not alter deterministic game behavior.
