import { Grid } from './grid.js';
import { Position, removePosition } from './position.js';
import { JavaRandom, javaAbsInt, javaRemainder } from './java-random.js';
import { BruteForceSolver } from './brute-force-solver.js';
import { GridSolver } from './grid-solver.js';

export class AlwaysRunningTask {
  isRunning() { return true; }
}

export class GridCreator {
  static NUMBER_RANDOM_HIDDENS = 36;
  static EASY_GAME = 40;
  static NORMAL_GAME = 33;
  static HARD_GAME = 23;
  static NUMBER_OF_SYMMETRIES = 3;

  constructor(seed = 0n, task = new AlwaysRunningTask()) {
    this.random = new JavaRandom(seed);
    this.task = task;
    this.board = null;
    this.numberOfGivens = 0;
    this.solver = null;
  }

  setSeed(seed) { this.random.setSeed(seed); }
  setTask(task) { this.task = task; return this; }

  getTypeForHints(givens) {
    if (givens <= GridCreator.HARD_GAME) return 'hard';
    if (givens <= GridCreator.NORMAL_GAME) return 'normal';
    return 'easy';
  }

  getNumbers() { return [1,2,3,4,5,6,7,8,9]; }

  removeRandomNumberFrom(numbers) {
    const size = numbers.length;
    if (size === 0) return 0;
    const next = javaRemainder(javaAbsInt(this.random.nextInt()), size);
    const number = numbers[next];
    numbers.splice(next, 1);
    return number;
  }

  createInitialMatrix() {
    for (let block = 0; block < 3; block++) {
      const numbers = this.getNumbers();
      for (let row = block * 3; row < block * 3 + 3; row++) {
        for (let col = block * 3; col < block * 3 + 3; col++) {
          const slot = this.board.getSlot(row, col);
          const digit = this.removeRandomNumberFrom(numbers);
          slot.setShown(digit); slot.setAnswer(digit); slot.setOriginalDigit(true);
        }
      }
    }
  }

  createShuffledBoard(newNumberOfGivens) {
    this.board = new Grid(this.getTypeForHints(newNumberOfGivens));
    this.numberOfGivens = newNumberOfGivens;
    this.createInitialMatrix();
    const initialSolver = new BruteForceSolver(this.task, true);
    const sol = initialSolver.searchSolutions(this.board);
    if (sol.length > 0) {
      this.board = sol[0];
      this.board.setAllShownDigitsAsOriginal();
    } else this.board = null;
  }

  randomDigit(n) { return javaRemainder(javaAbsInt(this.random.nextInt()), n); }

  hideNumbersByRandomUsingSymmetry(symmetry, positionsNotYetChecked) {
    const hidePositions = [];
    const index = javaRemainder(javaAbsInt(this.random.nextInt()), positionsNotYetChecked.length);
    const pos = positionsNotYetChecked[index];
    let wasFilled = this.board.hideNumber(pos);
    if (wasFilled) { hidePositions.push(pos); removePosition(positionsNotYetChecked, pos); }
    else return hidePositions;
    const r2 = 8 - pos.row, c2 = 8 - pos.col;
    const tryHide = (p) => {
      const filled = this.board.hideNumber(p);
      if (filled) { hidePositions.push(p); removePosition(positionsNotYetChecked, p); }
    };
    switch (symmetry) {
      case 0: tryHide(new Position(pos.col, pos.row)); break;
      case 1: tryHide(new Position(r2, c2)); break;
      case 2:
        tryHide(new Position(pos.row, c2));
        tryHide(new Position(r2, pos.col));
        tryHide(new Position(r2, c2));
        break;
    }
    return hidePositions;
  }

  hideNumbersAtStartup(symmetry, numbersToHide, positionsNotYetChecked) {
    while (numbersToHide > 0 && positionsNotYetChecked.length > 0) numbersToHide -= this.hideNumbersByRandomUsingSymmetry(symmetry, positionsNotYetChecked).length;
  }

  hideNumbersAndCheckUnique(symmetry, numbersToHide, positionsNotYetChecked) {
    while (numbersToHide > 0 && positionsNotYetChecked.length > 0 && this.task.isRunning()) {
      const hiddenNumbers = this.hideNumbersByRandomUsingSymmetry(symmetry, positionsNotYetChecked);
      if (this.solver.checkForUniqueSolutionWithMixedStrategy(this.board)) numbersToHide -= hiddenNumbers.length;
      else this.board.unhideNumbers(hiddenNumbers);
    }
  }

  hideNumbersForUniqueGrid() {
    const symmetry = this.randomDigit(GridCreator.NUMBER_OF_SYMMETRIES);
    const positionsNotYetChecked = Position.allPositions();
    const hideAtStartup = GridCreator.NUMBER_RANDOM_HIDDENS;
    this.hideNumbersAtStartup(symmetry, hideAtStartup, positionsNotYetChecked);
    this.solver = new GridSolver(this.task);
    if (!this.solver.checkForUniqueSolutionWithMixedStrategy(this.board)) return false;
    let numbersToHide = 81 - this.numberOfGivens - hideAtStartup;
    this.hideNumbersAndCheckUnique(symmetry, numbersToHide, positionsNotYetChecked);
    return true;
  }

  createNewUniqueGame(newNumberOfGivens) {
    this.createShuffledBoard(newNumberOfGivens);
    if (this.board && this.hideNumbersForUniqueGrid()) {
      this.board.clearPencilMarks();
      return this.board;
    }
    return null;
  }
}

export function selectBestHardCandidate(creator, wanted = 3, maxAttempts = 200) {
  let best = null, bestBt = 0, bestSingles = 0, bestGiven = 0;
  let found = 0, attempts = 0;
  while (found < wanted && attempts < maxAttempts) {
    attempts++;
    const g = creator.createNewUniqueGame(GridCreator.HARD_GAME);
    if (!g) continue;
    found++;
    const fg = g.getNumberOfGiven();
    g.setupPossibleDigits();
    const ns = g.getNumberOfSingles();
    const bt = g.getBackTrackingDepth();
    let store = false;
    if (!best) store = true;
    else if (bt > bestBt) store = true;
    else if (bt === bestBt) {
      if (ns + fg < bestSingles + bestGiven) store = true;
      else if (fg < bestGiven) store = true;
    }
    if (store) { best = g; bestGiven = fg; bestSingles = ns; bestBt = bt; }
  }
  return { grid: best, attempts, found };
}
