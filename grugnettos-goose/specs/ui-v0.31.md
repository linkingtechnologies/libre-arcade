# UI v0.31 — compact setup sidebar

This release removes the vertical stretching regression visible on short desktop/laptop viewports.

- The setup card uses natural height rather than filling all remaining sidebar height.
- Player controls remain compact rows (38 px on short desktop, 36 px on very short windows).
- The roster is the only internally scrollable region when more player rows require it.
- The empty pre-game Players status card is hidden on short desktop viewports.
- Game options remain visible below the roster.
- Board geometry, calibrated coordinates, gameplay and audio are unchanged.
