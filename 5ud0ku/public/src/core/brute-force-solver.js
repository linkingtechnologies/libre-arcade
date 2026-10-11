import { Solver } from './solver.js';

export class BruteForceSolver extends Solver {
  constructor(task = null, findFirst = false) {
    super(task);
    this.maxNumberOfSolutionsToSearch = findFirst ? 1 : 2;
  }

  searchSolutions(newGrid) {
    this.findSolutions(newGrid);
    return this.possibleSolutions;
  }

  findSolutions(newGrid) {
    this.grid = newGrid.clone();
    this.possibleSolutions.length = 0;
    this.grid.setupPossibleDigits();
    const emptyPositions = this.grid.allEmptyPositions();
    this.emptyPositionsForCompare = emptyPositions.slice();
    this.checkSolution(0);
    return this.possibleSolutions;
  }

  checkSolution(pos) {
    if (this.task && !this.task.isRunning()) return;
    if (this.possibleSolutions.length >= this.maxNumberOfSolutionsToSearch) return;
    if (pos >= 81) {
      this.addSolution(this.grid, 0);
      return;
    }
    const row = Math.trunc(pos / 9), col = pos % 9;
    const slot = this.grid.getSlot(row, col);
    if (slot.isOriginalDigit()) {
      this.checkSolution(pos + 1);
    } else {
      for (let d = 1; d <= 9; d++) {
        if (slot.isPencilMark(d - 1) && this.possible(row, col, d)) {
          slot.setShown(d);
          this.checkSolution(pos + 1);
        }
      }
    }
  }

  possible(row, col, d) {
    for (let r = 0; r < row; r++) if (this.grid.getSlot(r, col).getShown() === d) return false;
    for (let c = 0; c < col; c++) if (this.grid.getSlot(row, c).getShown() === d) return false;
    const br = Math.trunc(row / 3) * 3, bc = Math.trunc(col / 3) * 3;
    for (let r = br; r < br + 3; r++) {
      for (let c = bc; c < bc + 3; c++) {
        if (r === row && c === col) return true;
        if (this.grid.getSlot(r, c).getShown() === d) return false;
      }
    }
    return true;
  }
}
