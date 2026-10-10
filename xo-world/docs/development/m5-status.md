# XO World M5 — Visual/UX parity gate

## Scope
M5 keeps the certified M3/M4 game engine unchanged and concentrates on browser presentation, terminal-state feedback, compact responsive layout and accessibility.

## Historical visual references preserved
- 10×10 square stone-like board.
- X and O are the only playing marks.
- The most recent CPU O remains highlighted.
- The main action/status strip follows the original applet composition: New Game at left, a prominent central result/status banner, board immediately below.
- Win feedback deliberately uses the original-style wording `You WIN!!!` rather than replacing it with a modern modal.

The original bitmap assets are not redistributed in the web build; the board and marks are drawn procedurally.

## UX changes that do not alter gameplay
- Responsive square board.
- EN/IT labels.
- Pointer/touch input.
- Keyboard navigation: arrows move the focus cell; Enter/Space plays.
- New Game resets the historical model and returns focus to the board.
- Small-height layout hides the help block so the game itself remains on one viewport.
- Document scrolling remains disabled during play.

## Terminal-state verification
The model suite explicitly covers both human victory (`status=2`) and CPU victory (`status=3`). The UI maps these states to the central banner and prevents further moves after the result.

## QA gate
- Historical AI oracle: 22/22 PASS.
- Model flow: PASS.
- Explicit human/CPU terminal states: PASS.
- Browser bundle smoke: PASS.
- UI contract: PASS.

## Known non-blockers
- The browser presentation is a faithful reconstruction, not a pixel-perfect copy of uncertain historical raster assets.
- Random fallback remains historical `Math.random()` in player mode; QA can inject a deterministic RNG.
- Credits/repository packaging remain a subsequent publication milestone rather than being mixed into the game screen.
