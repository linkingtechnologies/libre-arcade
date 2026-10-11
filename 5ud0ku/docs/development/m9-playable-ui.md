# M9 — First playable HTML5 UI

M9 adds the first user-facing HTML5 interface on top of the parity-certified M8 engine. It deliberately does not change generator, solver, save format, or gameplay semantics.

## Included

- responsive 9×9 board;
- fixed/user digits and 3×3 block boundaries;
- pencil marks;
- mouse/touch cell selection;
- keyboard arrows, digits, Delete/Backspace, `P`, Ctrl/Cmd+Z and redo;
- on-screen digits 1–9;
- pencil mode, erase, undo, redo, historical Display Digit hint, conflict check;
- Easy / Normal / Hard new-game dialog;
- timer;
- autosave/restore using the M7 historical binary format inside `localStorage`;
- Beginner Mode;
- EN/IT UI;
- Help/Credits with Libre Arcade link;
- completion dialog;
- worker-backed puzzle generation from M8.

## Responsive contract

The game shell uses `100dvh` and `overflow:hidden`; the board is resized instead of introducing page scrolling. M9 layout smoke tests cover 1280×800, 360×640, and 320×480.

Measured board sizes during the smoke run:

- desktop 1280×800: 630×630 px;
- phone 360×640: 344×344 px;
- compact 320×480: 275×275 px.

Screenshots are stored as `docs/m9-desktop.png`, `docs/m9-mobile.png`, and `docs/m9-compact.png`.

## Parity choices

M9 keeps the historical gameplay semantics already certified in M3/M7:

- Hint is **Display Digit**, not an explanatory modern Sudoku tutor.
- Check reports Sudoku conflicts; it does not silently compare every entry to the hidden solution.
- Pencil/Beginner behaviour delegates to `GameSession`/`Grid` rather than reimplementing Sudoku logic in the UI.
- Generator remains isolated in the Web Worker.
- Autosave bytes still use the historical 1.8 grid serialization.

The 128×128 J2ME hit-box bug found in M4 is intentionally not reproduced in the responsive HTML5 controls.

## Browser validation note

The execution sandbox blocks Chromium navigation to both localhost and `file://` URLs with `ERR_BLOCKED_BY_ADMINISTRATOR`. Therefore M9 uses two complementary checks:

1. all engine/worker/game-state suites M2–M8 run normally;
2. Chromium renders the exact M9 HTML/CSS through Playwright `set_content()` for layout/no-scroll screenshot validation.

`src/browser/app.js` is additionally syntax-checked with Node. The production browser entry remains normal ES modules and should be served over HTTP(S), which is also required for module workers in ordinary browsers.
