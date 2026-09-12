# Dimensional help

This is a reconstructed quality-of-life feature. It is **not** original 2001 behavior and is disabled by default.

Its purpose is to make the visual mapping of 3D/4D logical adjacency understandable without changing rules, exposing hidden state, or solving a puzzle.

## Visual language

- Blue outline: local X/Y relation inside the same 2D block.
- Gold outline: relation on the 3rd or 4th logical axis.
- Dashed outline: that relation crosses a Wrap boundary.
- Green outline in Peg Jumper: landing cell for a legal jump.
- `3D` / `4D` labels identify the logical axis; `W` marks Wrap.

## Per-game behavior

### Flip-Flop

The focused cell is outlined in white. The overlay shows exactly the cells that would be toggled by the move: the focused cell plus all orthogonal neighbours. On mouse/pen, focus follows hover; on touch, the last tapped cell remains the focus after the move so the dimensional effect can be inspected.

### Bomb Squad

The focused cell is outlined in white and only its orthogonal neighbours are shown. The helper returns geometry metadata only. It never reveals whether any covered neighbour contains a bomb and never changes covered/flagged state.

### Maze Runner

Every currently legal destination is shown. The list is produced by the same wall-clearance, collinearity, wrap and tie-break logic used by movement. No pathfinding, goal heuristic or solver is used.

### Peg Jumper

Before selecting a source peg, pegs with at least one legal jump may be highlighted. After a source peg is selected, the clickable jumped-over peg is highlighted and the corresponding landing hole is shown in green. The helper uses the same neighbour and wrap rules as the jump model.

### Tile Slider

Every tile that can currently be clicked to move toward the blank is highlighted. Higher-dimensional slides and Wrap routes use the same axis/direction logic as the normal move implementation.

## Preservation rule

Turning dimensional help off restores the unassisted browser behavior. The feature must remain optional. Future changes must not add solution hints, optimal moves, Bomb Squad hidden information, Maze Runner pathfinding, or automatic move selection.
