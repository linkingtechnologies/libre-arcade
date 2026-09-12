# Port map

This map links the preserved implementation to the JavaScript port.

| Original function/file | Extracted equivalent | Status |
| --- | --- | --- |
| `util.c` `SRandom`, `Random` | `NetrisRandom` | Preserved exactly, same constants (31751, 15437) |
| `shapes.c` shape definitions (turtle-command programs) | `shape`/`fourWay`/`twoWay` builders | Preserved as the same turtle-command representation, not flattened to coordinates |
| `shapes.c` `ShapeIterate` | `shapeIterate` (private) | Preserved |
| `shapes.c` `ChooseOption` | `chooseShape` | Preserved, including weighted-choice form (all weights are 1 in `stdOptions`) |
| `board.c` `GetBlock`/`SetBlock` | `NetrisBoard.getBlock`/`setBlock` | Preserved |
| `board.c` `ShapeFits`/`ShapeVisible` | `NetrisBoard.shapeFits`/`shapeVisible` | Preserved |
| `board.c` `MovePiece`/`RotatePiece`/`DropPiece` | `NetrisGame.movePiece`/`rotatePiece`/`dropPiece` | Preserved, including hard drop not locking immediately |
| `board.c` `ClearFullLines` (from/to compaction scan) | `NetrisBoard.clearFullLines` | Preserved algorithm, not simplified to a shift-down |
| `board.c` `FreezePiece` | `NetrisBoard.freezePiece` | Preserved |
| `game.c` `StartNewPiece` | `NetrisGame.startNewPiece` | Preserved |
| `game.c` `OneGame`'s `E_alarm` case (single-player only) | `NetrisGame.tick` | Preserved: fall, lock, clear, spawn next |
| `game.c` `KT_faster` | `NetrisGame.goFaster` | Preserved: one-way, `speed *= 0.8` |
| `game.c`'s `pieceCount` (incremented per new piece, used to tag robot commands) | `NetrisGame.pieceSerial` | Preserved purpose: distinguishes two spawns of the same piece type for the robot |
| `game.c` `OneGame`'s multiplayer/network branches | — | Not ported; see `PROVENANCE.md` |
| `inet.c` | — | Not ported; requires a network server |
| `robot.c` | — | Not ported; a pipe protocol shell with no playing algorithm of its own |
| `curses.c` | `public/src/ui.js` (canvas) | Replaced, not ported — no original behavior to be faithful to |
| `sr.c` `FindPiece` | `findPiece` | Preserved |
| `sr.c` `RotatePiece1` | `rotatePiece1` | Preserved, including the row0-anchored, height-packed transform |
| `sr.c` `PieceFits` | `pieceFits` (private) | Preserved |
| `sr.c` `SimPlacement` | `simPlacement` (private) | Preserved, including reusing the same from/to compaction scan as `ClearFullLines` |
| `sr.c` `BoardScore` | `boardScore` (private) | Preserved term-for-term (height, holes-times-depth, dependency bitmask, hardFit, topShape, closeToTop) |
| `sr.c` `MakeDecision` | `makeDecision` | Preserved, including starting the drop search from the piece's current row, not the top of the board |
| `sr.c`'s `TimeStamp`-driven actuator state machine (`pieceState`) | `NetrisRobot.step` | Reimplemented against the engine directly instead of over `robot.c`'s text pipe; same one-move-at-a-time behavior, decided once per piece (tracked by `NetrisGame.pieceSerial`, the faithful port of game.c's own `pieceCount`, since the port's shape objects are shared singletons and can't be told apart by identity) |

## Verification

No C compiler is available in this environment to build and run
`reference/netris/` as an executable oracle, the approach used for
Klondike's `js-solitaire`. Verification instead falls back to the next
rung of the same verification hierarchy `briscola/` documents for its own
ports (`briscola/specs/faithful-porting.md`): careful, documented
source-level equivalence review, plus hand-computed exact values for
anything that is pure arithmetic — the RNG's output sequence for a fixed
seed is checked against values computed directly from `util.c`'s formula,
not merely checked for "looking random." See `tests/engine.test.mjs`.
