# Parity notes — release candidate

Parity claims in this project must be traceable to files in `reference/54321-1.0.2001.11.16/`.

## Shared cube/view behavior

Sources: `code/cube.cpp`, `code/cube.h`, `code/view.cpp`, `code/view.h`.

- Side length: 4 cells on every active axis.
- Public games use 2D, 3D or 4D logical spaces.
- Neighbours are orthogonal only.
- Wrap mode joins opposite edges along each active axis.
- Logical array lengths are 16 / 64 / 256 cells for 2D / 3D / 4D.
- Original cell size: 36 px; tier gap: 4 px; board region: 600×600 within an 800×600 screen.
- Higher-dimensional spaces are rendered as multiple 2D tiers. There is no polygonal 3D engine.

## Flip-Flop

Sources: `code/flipflop.cpp`, `code/flipflop.h`, `data/ff*.hlp`.

Preserved mechanics:
- Clicking toggles the selected cell and every orthogonal neighbour.
- Goal: all cells off.
- Difficulty controls the number of distinct scramble moves.
- Scramble moves: 2D = 3/5/8, 3D = 5/8/12, 4D = 8/16/32.
- Scrambling starts solved and applies legal moves, so generated positions are solvable.

## Bomb Squad

Sources: `code/bomb.cpp`, `code/bomb.h`, `code/bombController.cpp`, `code/bombView.cpp`, `data/bs1.hlp` through `data/bs4.hlp`.

Preserved mechanics:
- Bomb counts: 2D = 2/4/8, 3D = 4/8/16, 4D = 16/32/64.
- Bombs are placed without duplication.
- Numbers count orthogonal bomb neighbours only; diagonals do not count.
- Left click uncovers.
- Right-click or Shift-click toggles a flag.
- Uncovering a zero recursively uncovers orthogonal neighbours.
- Uncovering a bomb loses immediately.
- There is **no first-click safety rule** in the original.
- Victory requires the number of flags and number of still-covered cells both to equal the bomb count while not already lost.

## Maze Runner

Sources: `code/maze.cpp`, `code/maze.h`, `code/mazeController.cpp`, `code/mazeView.cpp`, `data/mr1.hlp`, `data/mr2.hlp`, `data/mr3.hlp`.

Preserved mechanics:
- Generation starts with all eight directional wall bits set on every cell.
- Candidate walls are the undirected orthogonal neighbour edges for the selected dimensions/wrap mode.
- Walls are processed in random order. A wall is always removed when it connects two previously disconnected sets.
- A redundant wall can also be removed according to difficulty: Easy 20%, Medium 10%, Hard 0%.
- Hard is consequently a perfect maze with exactly `cellCount - 1` passages.
- Player starts at index 0.
- Non-wrap goal: coordinate 3 on each active axis. Wrap goal: coordinate 2 on each active axis.
- Clicking a non-collinear cell does nothing.
- Clicking a collinear cell moves only if one of the two axial routes is uninterrupted by walls.
- With Wrap, if both directions are open, the shorter route is chosen; positive direction wins equal-distance ties.
- Source and intermediate cells traversed during a move become marked; the destination is not marked until it is departed later.
- `stepsTaken` counts traversed steps, while `repeatsTaken` counts steps through cells that were already marked.
- Victory occurs upon arriving at the goal.
- Wall overlays `wall0.png` through `wall7.png` represent the eight negative/positive walls of the four logical axes. The higher-dimensional walls are shown inside each 2D cell, as described by the original help.

## Maze Runner optional dimensional-move aid

Milestone 8 adds an **optional, disabled-by-default** browser aid. It is not an original 2001 feature.

- `MazeRunner.legalMoves()` evaluates candidate destinations with the same collinearity, wall-clearance, wrap and tie-break rules used by `move()`.
- The UI highlights only destinations that the original movement logic would currently accept.
- Local X/Y destinations are visually distinct from 3rd/4th-axis destinations.
- A wrap-crossing route is marked separately.
- The helper exposes no goal path, heuristic or solver state.
- Regression tests verify every reported destination can actually be traversed by the normal movement logic.

## Optional dimensional help (browser reconstruction)

Milestone 8 generalizes the earlier Maze Runner aid into an **optional, disabled-by-default** aid for all five advertised games. It is not an original 2001 feature and never changes model state by itself. Blue marks local X/Y relations, gold marks the 3rd/4th logical axes, dashed outlines mark a Wrap crossing, and Peg Jumper uses green for a landing cell.

- **Flip-Flop:** `affectedCells()` reports exactly the selected cell plus the orthogonal neighbours that `flip()` will toggle. Desktop hover previews before a click; touch retains the last focused cell after interaction.
- **Bomb Squad:** `neighborsOf()` reports only orthogonal-neighbour geometry. It contains no bomb-state field and does not inspect hidden cell contents.
- **Maze Runner:** `legalMoves()` evaluates candidate destinations with the same collinearity, wall-clearance, wrap and tie-break rules used by `move()`. It exposes no goal path, heuristic or solver state.
- **Peg Jumper:** `legalJumps()` derives source, jumped peg and landing cell from the same orthogonal/wrap rules used by `jump()`. Before source selection it can mark pegs with at least one legal jump; after selection it shows the clickable jumped peg and the landing cell.
- **Tile Slider:** `legalMoves()` lists exactly the cells collinear with the blank under the same axis and wrap-direction logic used by `move()`.
- Regression tests verify the aid metadata against the gameplay topology, including higher-axis and Wrap cases.

## Peg Jumper

Sources: `code/peg.cpp`, `code/peg.h`, `code/pegController.cpp`, `code/pegView.cpp`, `nws/peg.nw`, `data/b*-*.peg`, `data/pj1.hlp` through `data/pj4.hlp`.

Preserved mechanics:
- Board contents use `EMPTY=0`, `HOLE=1`, `PEG=2` and a `SELECTED=4` overlay bit.
- The board is selected by dimension, skill and wrap using the historical naming scheme `b<dims>-<skill><w|n>.peg`.
- The original parser ignores all characters except `-`, `o` and `x`; the browser's embedded payloads are regression-tested against those exact meaningful characters.
- Every historical wrap/non-wrap file pair has identical meaningful board contents.
- Initial peg counts are 2D 6/12/16, 3D 32/56/64 and 4D 80/176/256 for Easy/Medium/Hard.
- First move: clicking a peg removes it and turns that cell into a hole.
- Later moves: select a source peg, then click an orthogonally adjacent peg to jump over.
- The destination is computed by extending the source→jumped-peg vector one more cell with modulo-4 arithmetic.
- Destination must be a `HOLE` and must itself be a legitimate neighbour of the jumped-over peg under the current wrap setting.
- A legal jump turns source and jumped-over cells into holes and the destination into a peg.
- Each legal jump decrements `pegsRemaining` and increments `stepsTaken`.
- Victory occurs when one peg remains.
- Selection is cleared before jump validation, so an illegal second click cancels selection.
- Non-left mouse clicks select/reselect a peg instead of attempting the current jump, matching `PegController`.

Recorded original defect / deterministic port fix:
- `Peg::reset()` does not initialize `stepsTaken`, although the Noweb prose says game statistics are reset. This leaves the original C++ counter indeterminate after construction/reset. The browser port initializes it to zero and marks that difference explicitly rather than inventing a pseudo-random emulation of undefined memory.

## Deliberate milestone differences / reconstructions

- The original used the platform `random()` PRNG; the browser model uses a deterministic PRNG when seeded so tests are reproducible. Generated topology follows the same algorithmic rules but is not claimed to reproduce the exact historical random sequence for a numeric seed.
- The original bitmap font is not used for newly rendered browser text while its provenance remains under review.
- The HTML game selector is a temporary development scaffold, not the original main menu.
- Touch devices get an explicit Reveal/Flag toggle for Bomb Squad because they do not have right-click; this is a reconstructed accessibility/input adaptation.
- Peg Jumper `stepsTaken` is deterministically reset to zero instead of reproducing the original uninitialized C++ integer defect.
- Original scripted `.hlp` presentation and main-menu transitions remain represented by a browser-native shell rather than recreated screen-for-screen.
- `SoundDev::ding()` is reconstructed with Web Audio from the source algorithm; it is classified as reconstructed audio implementation, not a byte-identical SDL audio buffer.

## Tile Slider

Sources: `code/tile.cpp`, `code/tile.h`, `code/tileController.cpp`, `code/tileView.cpp`, `nws/tile.nw`, `nws/tcontrol.nw`, `nws/tview.nw`, `data/ts1.hlp` through `data/ts4.hlp`.

Preserved mechanics:
- Solved state is the identity permutation: cell `i` contains tile `i`.
- The tile with value `cellCount - 1` is rendered as the blank, and reset leaves it at the final cell.
- Difficulty uses the same swap table for 1D through 4D; for the public 2D/3D/4D modes this is Easy 2, Medium 4, Hard 8 pair swaps.
- Each shuffle transposition chooses two distinct non-blank cells. The original comment explicitly requires an even number of transpositions to preserve an even permutation.
- A clicked cell must differ from the blank along exactly one of the four coordinate axes; otherwise nothing moves.
- A valid click can be more than one cell away. Tiles are shifted one at a time from the click toward the blank until the blank reaches the clicked cell.
- `stepsTaken` increments once per shifted tile, not once per user click.
- Without Wrap, direction follows the ordinary sign of the coordinate difference.
- With Wrap, `Cube::determineAxis()` computes `(SIDE_LENGTH + diff) % SIDE_LENGTH`; values `>= SIDE_LENGTH/2` select the negative direction. On the four-cell axis this means an exact distance-two tie selects the negative route.
- Once victory has occurred, `hasWon` remains latched even if the player continues moving tiles, matching the original source.
- Victory requires the blank to be in the final cell and every tile value to equal its cell index.
- Non-left click, or Shift/Meta-modified click as translated by `main.cpp`, displays the solved arrangement only while the alternate click is held.
- The solved preview changes rendering only; it does not mutate cube contents.
- The tile view composes two historical sprite sheets. Coordinates 0/1 select a 36×36 region from `centers.png`; coordinates 2/3 select a 36×36 region from `borders.png`.

Milestone reconstruction:
- Touch devices receive a hold-to-show-goal button because they do not have the original desktop right-click/Shift-click interaction.
- The browser uses a deterministic seeded PRNG for regression tests. It preserves the shuffle algorithm and swap counts but does not claim numeric-seed equivalence with the platform `random()` used in 2001.

## Localized outcome overlays

The 2001 `victory.png` and `defeat.png` graphics contain English text. They remain untouched and are used in English mode. Italian mode renders equivalent outcome text at runtime. This is classified as a localized UI reconstruction, not an alteration of the preserved assets.
