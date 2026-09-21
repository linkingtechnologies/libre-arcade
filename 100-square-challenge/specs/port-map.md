# Port map: TAJJAVA v0.1 (Java Swing) to JavaScript

Baseline: `TAJJAVA.jar` v0.1 (March 2011). The Java sources are preserved unchanged in `../reference/tajjava-v0.1/src.zip`; class names below are relative to the `tajjava` package. The port is a clean reimplementation of documented and measured behavior, not a transcription: `public/src/` contains no Java-derived code.

## Verification level

Per the collection's verification hierarchy (`../../AGENTS.md`):

- **Game rules: level 1, executable oracle.** The original classes were run and observed in 15 scenarios (`../test/fixtures/oracle_original_jar.txt`). When the game was integrated the same 15 scenarios were re-run headless on the original JAR with a small harness (`../tools/oracle/`) and reproduced exactly. `../test/parity.test.js` checks the JavaScript rules against the same scenarios, with the four documented corrections asserted separately.
- **Reach of the rules: mathematical witnesses.** 15 complete 100-square knight paths, one for each start-square symmetry class, and one 24-square dead end, replayed through the JavaScript rules and, in the Python browser test, through the DOM.
- **UI, touch, keyboard, language, sound, first-play dialog: level 3.** New presentation code checked by `../test/browser_smoke.py` (Playwright, not run at integration) and by the tests in `../test/`.

## Modules

| Java (original) | JavaScript | Notes |
|---|---|---|
| `grid/GameSessionPanel`: `grid[10][10]`, `lastsq`, `plsq`, `gended` | `game.js`: `initialGame()`, state `board`, `last`, `previous`, `ended` | 10 by 10 fixed empty board; move 1 is offered at (0,0) and puts 1 there |
| `GameSessionPanel.proposeSquares()` | `candidates(board, last)` | The eight knight offsets (plus or minus 1 and 2), free squares only; the path ends at 100 or when nothing is offered |
| `grid/Square.mouseClicked` (place `last value + 1`, update `plsq` and `lastsq`, re-propose) | `clickCell(state, index)` | Invalid, occupied, out-of-grid and non-knight destinations do nothing |
| `GameSessionPanel.actionPerformed("undomove")` | `undo(state)` | Single-step undo, not a history. **Corrected:** disabled before the first move, and undoing move 1 offers (0,0) again |
| `GameSessionPanel.actionPerformed("newgame")` and `reset()` | `restart(state)` | **Corrected:** clears every game-end and Undo flag |
| `Square.mouseClicked` opening `if (gended) reset()` | `clickCell` returns the state unchanged when `ended` | **Corrected:** clicking a finished or blocked board no longer wipes it; it stays visible until Undo or New game |
| `GameSessionPanel.actionPerformed("backtomenu")`, `LauncherMain` (one-button menu, `JFrame`) | `app.js` (`enterGame`, `leaveGame`, menu screen) | The menu reopens the same board, as in the original |
| `Square.paintComponent`, `CoreGraphics` (centered text) | `app.js` `render()` and `styles.css` | Cells are buttons; the latest number is highlighted (red in the original), offered squares are shaded |
| `l10n/Strings`, `Strings_ru` (English, Russian) | `i18n.js` (English, Italian) | Italian is chosen when the browser's first preferred language is Italian; a header button toggles |
| (none) | `sound.js` | Optional Web Audio tones for a valid move, a full board and a dead end. Off by default; not a feature of the original |
| (none) | `app.js` help and credits dialogs | The How to play dialog opens on the first Play and remembers that with one `localStorage` flag |

## Deliberate departures from the original

- The four corrections above; the geometric rules are unchanged.
- English and Italian instead of English and Russian.
- Mouse, touch and keyboard (arrow keys move the focus, Enter or Space chooses) instead of mouse only.
- A first-play instructions dialog, a Credits dialog and an optional sound button.
- No scoring, hints, solver, levels, timer or random boards were added.
