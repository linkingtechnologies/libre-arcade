/*
 * Copyright (C) 2026 Libre Arcade contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Browser adaptation of the documented behavior of 100-Square Challenge
 * from TAJJAVA v0.1, copyright (C) 2011 Jasen Borisov, AGPL-3.0-or-later.
 * This is a separate implementation, not a copy of the Java source.
 * Rules follow the original; two documented historical UI/state defects are repaired.
 */
export const BOARD_SIZE = 10;
export const CELL_COUNT = BOARD_SIZE * BOARD_SIZE;

const KNIGHT_OFFSETS = Object.freeze([
  [-1, -2], [1, -2], [-1, 2], [1, 2],
  [-2, -1], [-2, 1], [2, -1], [2, 1],
]);

export function indexOf(x, y) { return y * BOARD_SIZE + x; }
export function coordinates(index) { return { x: index % BOARD_SIZE, y: Math.floor(index / BOARD_SIZE) }; }

export function candidates(board, last) {
  if (last === null) return [];
  const { x, y } = coordinates(last);
  return KNIGHT_OFFSETS.flatMap(([dx, dy]) => {
    const nx = x + dx, ny = y + dy;
    return nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && board[indexOf(nx, ny)] === 0
      ? [indexOf(nx, ny)] : [];
  });
}

export function initialGame() {
  return {
    board: Array(CELL_COUNT).fill(0),
    last: indexOf(0, 0),
    previous: indexOf(0, 0),
    undoPossible: false,
    undoEnabled: false, // Disable the no-op button before any move.
    proposed: [indexOf(0, 0)],
    ended: false,
  };
}

// Quality correction to the 2011 Java original: explicitly restarting must
// restore the entire initial state, not leave ended/Undo flags behind.
export function restart(_state) {
  return initialGame();
}

export function clickCell(state, index) {
  if (!Number.isInteger(index) || index < 0 || index >= CELL_COUNT) return state;
  // A completed or blocked path remains visible until Undo or New game.
  // The Java original silently reset the board on some post-game clicks.
  if (state.ended || !state.proposed.includes(index)) return state;
  const board = state.board.slice();
  board[index] = board[state.last] + 1;
  const proposed = candidates(board, index);
  return {
    ...state,
    board,
    last: index,
    previous: state.last,
    undoPossible: true,
    undoEnabled: true,
    proposed,
    ended: proposed.length === 0,
  };
}

export function undo(state) {
  if (!state.undoPossible) return state;
  const board = state.board.slice();
  board[state.last] = 0;
  // Quality correction: undoing move 1 must re-offer (0,0), not
  // offer knight moves from an empty start cell.
  const proposed = board.some(value => value > 0)
    ? candidates(board, state.previous) : [indexOf(0, 0)];
  return {
    ...state,
    board,
    last: state.previous,
    previous: state.previous,
    undoPossible: false,
    undoEnabled: false,
    proposed,
    ended: proposed.length === 0,
  };
}

export function progress(state) {
  return state.board.reduce((count, value) => count + (value > 0 ? 1 : 0), 0);
}

export function inspect(state) {
  return {
    board: state.board.slice(),
    last: coordinates(state.last),
    proposed: state.proposed.map(coordinates),
    used: progress(state),
    ended: state.ended,
    undoEnabled: state.undoEnabled,
  };
}
