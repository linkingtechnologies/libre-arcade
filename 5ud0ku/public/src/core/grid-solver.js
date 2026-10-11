import { Solver } from './solver.js';

// Enumerates a mutable Vector the way java.util.Vector.elements() did in the original:
// the cursor always increments, so removing the current element can skip the shifted successor.
function enumerateMutable(vector, callback) {
  let index = 0;
  while (index < vector.length) {
    const value = vector[index];
    index++;
    callback(value);
  }
}

export class GridSolver extends Solver {
  checkForUniqueSolutionWithMixedStrategy(newGrid) {
    this.findSolutionsWithMixedStrategy(true, newGrid);
    if (this.possibleSolutions.length === 1) {
      newGrid.setBackTrackingDepth(this.possibleSolutions[0].getBackTrackingDepth());
      return true;
    }
    return false;
  }

  searchSolutions(newGrid) {
    this.findSolutionsWithMixedStrategy(true, newGrid);
    return this.possibleSolutions;
  }

  findSolutionsWithMixedStrategy(containsValidSolution, newGrid) {
    this.grid = newGrid.clone();
    this.possibleSolutions.length = 0;
    if (containsValidSolution) this.addFirstSolution();
    const emptyPositions = this.grid.allEmptyPositions();
    this.grid.intializePencilMarks(emptyPositions);
    GridSolver.solveWithSingleStrategy(this.grid, emptyPositions);
    this.emptyPositionsForCompare = emptyPositions.slice();
    this.solveWithGuessStrategy(this.grid, emptyPositions, 1);
    return this.possibleSolutions;
  }

  static checkForHiddenSingles(currentGrid, emptyPositions) {
    let singleFound = 0;
    enumerateMutable(emptyPositions, (pos) => {
      const digit = currentGrid.isHiddenSingle(pos);
      if (digit !== 0) {
        currentGrid.setSolvedDigit(pos, digit, emptyPositions);
        singleFound++;
      }
    });
    return singleFound;
  }

  static checkForSingles(currentGrid, emptyPositions) {
    let singleFound = 0;
    let failed = false;
    enumerateMutable(emptyPositions, (pos) => {
      if (failed) return;
      const digit = currentGrid.isSingle(pos);
      if (digit === -1) failed = true;
      else if (digit !== 0) {
        currentGrid.setSolvedDigit(pos, digit, emptyPositions);
        singleFound++;
      }
    });
    return failed ? -1 : singleFound;
  }

  static solveWithSingleStrategy(currentGrid, emptyPositions) {
    let size = emptyPositions.length, oldSize;
    do {
      oldSize = size;
      const found = GridSolver.checkForSingles(currentGrid, emptyPositions);
      if (found === -1) return false;
      GridSolver.checkForHiddenSingles(currentGrid, emptyPositions);
      size = emptyPositions.length;
    } while (size !== oldSize);
    return true;
  }

  solveWithGuessStrategy(currentGrid, emptyPositions, depth) {
    if (this.task && !this.task.isRunning()) return;
    if (this.possibleSolutions.length > 1) return;
    if (emptyPositions.length === 0) {
      this.addSolution(currentGrid, depth);
      return;
    }
    const nextPos = emptyPositions[0];
    emptyPositions.splice(0, 1);
    for (let digit = 1; digit <= 9; digit++) {
      if (currentGrid.getSlot(nextPos.row, nextPos.col).isPencilMark(digit - 1)) {
        const copyGrid = currentGrid.clone();
        const copyPos = emptyPositions.slice();
        copyGrid.setSolvedDigit(nextPos, digit, copyPos);
        if (GridSolver.solveWithSingleStrategy(copyGrid, copyPos)) this.solveWithGuessStrategy(copyGrid, copyPos, depth + 1);
      }
    }
  }

  addFirstSolution() {
    const firstSolution = this.grid.clone();
    for (let row = 0; row < 9; row++) for (let col = 0; col < 9; col++) {
      const slot = firstSolution.getSlot(row, col);
      slot.setShown(slot.getAnswer());
    }
    this.addSolution(firstSolution, 0);
  }
}
