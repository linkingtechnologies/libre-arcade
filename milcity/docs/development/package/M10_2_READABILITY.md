# M10.2 — HUD readability correction

A real-browser screenshot showed that the M10.1 game viewport was large enough, but the 8 px canvas HUD font became blurry and difficult to read after CSS scaling.

Changes:

- logical game coordinates remain 240×320;
- backing canvas is 480×640 (`RENDER_SCALE = 2`);
- all gameplay rendering continues in logical coordinates through a 2× canvas transform;
- image smoothing remains disabled;
- HUD font grows from 8 px regular monospace to up to 10 px bold monospace;
- each HUD line automatically steps down only when required to fit 230 logical pixels;
- line spacing grows to 11 px;
- legacy ammunition glyph placeholders are replaced by readable M / Mo / A / N / Sh / Sp abbreviations;
- desktop display scale ceiling grows from 1.65× to 1.8×.

This is a usability correction, not a gameplay change.
