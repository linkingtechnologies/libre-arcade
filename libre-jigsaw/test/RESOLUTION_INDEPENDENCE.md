# Resolution independence — RC 1

A running puzzle has a fixed logical playfield. The browser window is only a viewport onto that playfield.

## Frozen after New puzzle / image selection

- requested and actual piece count
- rows / columns
- generated cut geometry and seed
- piece positions and rotations
- ConnectedSet groups
- layer assignment and z-order
- logical playfield width and height

## Allowed to change on resize / orientation change

- canvas backing resolution / device-pixel ratio
- one uniform viewport scale
- horizontal or vertical centering (letterboxing)

The resize path does not call the geometry builders and does not rewrite piece coordinates.
Pointer input is converted through the inverse viewport transform before hit testing or dragging.

## Save/load

HTML5 `.ljf` format v2 stores the logical playfield dimensions together with the board and piece state. The same save therefore reopens with identical topology and logical coordinates on a different screen. Format-v1 saves from Beta 2 remain accepted and are migrated using the current screen as their missing logical playfield.
