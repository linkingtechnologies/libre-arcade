# UI v0.32 — inclusive player pieces

This release changes presentation only. Gameplay, RNG, board coordinates and historical artwork are unchanged.

Each of the four player slots now has a redundant visual identity:

1. color;
2. large geometric mark (`●`, `▲`, `■`, `◆`);
3. fill pattern (solid, diagonal stripes, dots, crosshatch).

The identifier is shown consistently on board pawns, player-list pawns, setup previews and turn-notice avatars. Localized ARIA labels name both the shape and pattern. The CSS also contains a forced-colors fallback where the geometric symbol remains meaningful if authored color is removed by the operating system.
