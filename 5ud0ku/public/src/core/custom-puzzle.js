import { Grid } from './grid.js';

function validatePuzzleString(value, { solution = false } = {}) {
  if (typeof value !== 'string' || value.length !== 81) {
    throw new TypeError(`${solution ? 'solution' : 'puzzle'} must contain exactly 81 characters`);
  }
  for (const ch of value) {
    if (solution) {
      if (ch < '1' || ch > '9') throw new TypeError('solution must contain digits 1-9 only');
    } else if (!((ch >= '1' && ch <= '9') || ch === '0' || ch === '.')) {
      throw new TypeError('puzzle must contain digits 0-9 or dots only');
    }
  }
}

export function normalizeCustomPuzzle(puzzle) {
  validatePuzzleString(puzzle);
  return puzzle.replaceAll('.', '0');
}

/**
 * Build the grid produced by the historical SolverTask after it finds a solution.
 * Original givens remain original; non-givens receive the answer but are either
 * hidden (Solve & Play) or shown (Solve).
 */
export function customSolutionToGrid(puzzle, solution, { play = true, type = 'user' } = {}) {
  puzzle = normalizeCustomPuzzle(puzzle);
  validatePuzzleString(solution, { solution: true });

  const grid = new Grid(type);
  for (let i = 0; i < 81; i++) {
    const row = Math.trunc(i / 9);
    const col = i % 9;
    const given = Number(puzzle[i]);
    const answer = Number(solution[i]);
    const slot = grid.getSlot(row, col);

    slot.setAnswer(answer);
    slot.setOriginalDigit(given > 0);
    slot.setShown(play ? given : answer);
    slot.setPencilMarks(0);
  }
  grid.setElapsedTime(0);
  return grid;
}

export function emptyCustomGrid(type = 'user') {
  return Grid.fromPuzzle('0'.repeat(81), type);
}

/**
 * The grid of "edit current game" (SudokuMidlet.editCurrentGame): the given numbers stay, as plain digits that
 * can be changed, and everything else is cleared (Grid.resetForEdit). It works on a copy, so the game being
 * played is untouched until the edited puzzle is solved.
 */
export function editableGrid(grid, { type = 'user' } = {}) {
  const copy = grid.clone();
  copy.resetForEdit();
  copy.setType(type);
  copy.setElapsedTime(0);
  return copy;
}
