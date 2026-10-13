# MilCity M5 — J2ME flow reconstruction

M5 reconstructs the original 1.0.5 interaction model before any Libre Arcade restyling.

## Source-derived findings

- The in-game model is **240×240 pixels** with an **80-pixel status/menu band**, yielding a **240×320 portrait game canvas** in source (`MilCityModel(..., 240, 240, 8, ...)` and `MenuView` drawing at y=240..320). This is more specific than the generic 320×240 device description sometimes attached to the project.
- Grid cells are exactly **8×8 pixels**, matching 30×30 cells into 240×240.
- Original mode cycle is `City` then `Military(Pn)`, skipping the local player.
- City action order is: Powerplant, Refinery (Commercial), House, Missile Silo, Factory, Airfield, Laboratory, Shield Generator, Nuke Silo, Shield.
- Military action order is: Missile, Artillery (Mortar), Aircraft, Nuke, Spy.
- City and Military remember separate selected-action positions when changing mode.
- Cursor is green when the selected action can be performed, otherwise red.
- Training Mode starts a one-player game and therefore has no Military target.
- Historical main menus reconstructed: Solo Game, Bluetooth Game, Options, Help, About, Exit; solo contains Easy, Medium, Hard, Madness, Training.

## M5 browser choices

Original runtime PNGs remain reference-only because asset provenance is not yet GREEN. The browser renderer uses simple procedural colours while preserving geometry and interaction flow.

Mouse/touch is added as a browser convenience. Keyboard mappings mirror the original conceptual controls rather than a particular handset key label.

Bluetooth remains historical/reference-only.
