# Gameplay and completeness audit

54321 presents five public puzzle games in 2D, 3D or 4D. All dimensions are shown using multiple 2D tiers.

## 1. Flip Flop

Goal: clear all cells.

Clicking a cell toggles that cell and its orthogonal neighbors. Empty cells become full and full cells become empty. Clicking the same cell twice restores the prior configuration.

Status: **complete**.

## 2. Bomb Squad

Goal: mark all bombs and uncover the non-bomb cells.

- Left click uncovers a covered cell.
- The revealed number counts **orthogonal** neighboring bombs; diagonal neighbors do not count.
- Right-click or Shift-click marks/unmarks a suspected bomb.
- Uncovering a bomb loses the game.

Status: **complete**.

## 3. Maze Runner

Goal: reach the target through an n-dimensional maze.

The player clicks a cell in a direct line to move toward it. Walls/passages include connections between tiers; wrap mode can create passages across tier edges.

Status: **complete**.

## 4. Peg Jumper

Goal: remove as many pegs as possible.

- Board begins filled with pegs.
- The player opens a hole, selects a peg, then jumps it over a neighboring peg into a hole.
- Board presets exist for 2D, 3D and 4D, with wrap/non-wrap variants and multiple difficulty/pattern files.

Status: **complete**.

## 5. Tile Slider

Goal: restore tiles to their target coordinates.

- Clicking a neighbor of the empty cell slides that tile.
- Clicking farther away slides the whole line toward the empty cell.
- In wrap mode, the game chooses the shorter wrapped slide.
- Right-click or Shift-click previews the goal arrangement.

Status: **complete**.

## Hidden sixth mode: Life

The source contains a fully built `Life`, `LifeView`, and `LifeController` implementation. It is compiled into the program but is **not shown as one of the five menu games**.

The main program has a special `MAX_GAME` dispatch case that launches Life. The main-menu controller only selects it after a hidden state condition involving internal counters (`__counter == 76` and `__wonCount == 1`). The counters are manipulated by help navigation and Peg Jumper win state.

This is therefore best classified as an **intentional easter egg / hidden mode**, not merely abandoned dead code.

Life supports 1–4 dimensions internally and uses configurable survival/birth thresholds by dimension and skill level. Left click toggles cells; another mouse action advances a generation.

Preservation requirement: keep this hidden behavior documented. If the easter egg is exposed in a future parity pass, reproduce its historical activation flow rather than promoting it into the normal five-game menu.
