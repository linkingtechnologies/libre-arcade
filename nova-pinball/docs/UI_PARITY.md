# UI parity audit — Nova Pinball v0.2.3 → Web Restoration 1.0.0

The 1.0.0 restoration revisits the original Lua source and bundled visual assets specifically to recover presentation behaviour that the earlier web prototypes simplified. The original binary/media remain outside the public restoration package.

## Source behaviours recovered for 1.0.0

### Main menu

The historical menu is a vertically centred text list with these entries:

1. Play (or Continue while a game is active)
2. Scores
3. Settings
4. About
5. Leave

The selected row is marked by a small metallic pinball at its left. Up/Down changes selection; Space/Enter activates it. The restoration restores the same menu hierarchy, keyboard navigation and ball-cursor idea using CSS/procedural drawing rather than the original raster ball.

`Leave` is intentionally omitted in the browser build because a normal web page cannot reliably close its own tab/window. This is documented as a platform divergence.

### Settings

The v0.2.3 source exposes:

- Camera: Ball / Table
- Mission Hints: LED / Lights / Both / None
- Screen: Full Screen / Window
- Game Sounds: On / Off
- Music: On / Off

The restoration restores the previously missing Mission Hints modes and presents the corresponding descriptions. The historical Beyond tracker soundtrack remains excluded, while a separate optional modern CC0 music selector is exposed as an explicit modernization.

### Playfield entry and camera

Before the first launch, the original pans down the table at 50 px/s. The restoration restores that table-preview pass. On first launch the LED queue changes from the welcome/launch messages to the gameplay objective and the normal Ball camera resumes.

### In-canvas HUD

The original does not use a web-style HUD above the table. It paints a 20 px status strip inside the LÖVE canvas:

- `Score` at the upper left;
- `Balls` at the upper right;
- a green-tinted status strip while Safe Mode is active;
- `BALL SAVER` feedback near the right side.

The restoration moves the visible HUD back into the canvas. The HTML score/status elements remain available only to assistive technology.

### LED display

The original reserves a 36 px black display along the bottom of the play surface. Green messages move vertically at 150 px/s, pause for 1.5 s (long messages stay longer), and support priority/sticky queue semantics. The restoration uses the same dimensions, colour family, motion rate and queue model.

Examples recovered from the historical source include the welcome/launch prompt, mission hints, TILT and GAME OVER messaging. The restrictive historical LED font is not copied; The restoration uses a new procedural 5×7 dot-matrix renderer for the HUD and LED display.

### Pause and About

The original pause overlay is a translucent teal panel with a pale green outline. The restoration restores that visual language. Historical tracker controls are not reproduced literally, but The restoration settings include a clearly labelled optional modern CC0 music selector and separate volume control.

The About screen historically presents paired cyan/yellow lines sliding in from opposite sides with an approximately three-second cadence. The restoration restores this presentation with CSS animation and clean text.

### Game Over

The original game-over sequence scrolls the table upward at about 150 px/s while drawing a magenta `GAME OVER` message. The restoration restores this transition and allows Space/Escape to skip it to the score flow.

## Asset-guided procedural reconstruction

The original raster assets were inspected as visual references only. RC6 does not redistribute them. The clean renderer now follows the observed visual language more closely:

- playfield wall colour approximately `#37358c`, 6 px stroke;
- black table with purple perspective/radial rays;
- dark blue structural panels;
- light grey flippers with dusty-pink/red outline;
- yellow/purple kickers;
- metallic grey bumpers with yellow halo;
- black/blue NOVA inserts with lime-green active letters;
- dark blue launcher cover;
- stable yellow star and later mission-state colour/effect changes.

The historical background image was 660×1022 and contained much of this decoration. The restoration recreates the motif procedurally so no historical pixels are copied.

## Intentional 1.0.0 differences

- Historical Shift flipper controls remain replaced by Z/M (plus arrows) to avoid Windows Sticky Keys.
- The modern browser footer (camera, sound, fullscreen, language, menu) remains outside the historical 800×600 surface as an accessibility/browser adaptation.
- The original splash/loading animation is documented but not restored in 1.0.0; it adds startup delay without affecting play and contains presentation/branding that is not needed for parity.
- `Leave` is omitted for browser-platform reasons.
- Original raster images, font binaries, WAVs and tracker music are not bundled; the dot-matrix font and SFX are clean reconstructions, while optional CC0 background music is a documented modernization.
- Physics remain the clean custom browser solver rather than Box2D.
