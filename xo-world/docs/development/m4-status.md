# XO World M4 — Browser shell

M4 adds the first playable HTML5 presentation while keeping the M3 headless engine and game model unchanged.

## Scope completed

- Canvas 2D 10×10 board.
- Mouse/touch via Pointer Events.
- Responsive sizing with no game-page vertical scrolling.
- Original rules and M3 CPU retained.
- Last CPU move highlighted, preserving the purpose of the historical `slikao2.jpg` tile without redistributing the original artwork.
- EN/IT UI toggle.
- New Game control.
- Compact instructions and Libre Arcade link.
- No telemetry, backend, framework, audio, or uncertain historical assets.

## Fidelity choice

The original applet was 300×340 pixels: a 300×300 board plus a 40 pixel top strip. The M4 layout keeps the same board-first visual hierarchy but redraws the stone-like cells and X/O marks procedurally in Canvas. Historical JPEGs remain reference material only while their asset licensing remains YELLOW.

## Gate

- M2 behavioral oracle through unchanged M3 engine: 22/22 PASS.
- Headless game-model flow: PASS.
- Generated browser bundle smoke test: PASS.

M4 is suitable for interactive browser testing, but is not yet declared production-ready.
