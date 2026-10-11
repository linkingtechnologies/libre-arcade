import { GridSlot } from './grid-slot.js';
import { Position, removePosition } from './position.js';
import { JavaRandom, javaAbsInt, javaRemainder } from './java-random.js';

export class Grid {
  static random = new JavaRandom(0n);

  static setRandomSeed(seed) { Grid.random.setSeed(seed); }

  constructor(type = '') {
    this.elapsedTime = 0;
    this.type = type;
    this.backTrackingDepth = 0;
    this.board = Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => new GridSlot()));
  }

  clone() {
    // Deliberately mirrors the 1.8 source: elapsedTime and backTrackingDepth are NOT copied.
    const out = new Grid(this.type);
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const src = this.board[row][col];
        const dst = new GridSlot();
        dst.setAnswer(src.getAnswer());
        dst.setShown(src.getShown());
        dst.setOriginalDigit(src.isOriginalDigit());
        dst.setPencilMarks(src.getPencilMarks());
        out.board[row][col] = dst;
      }
    }
    return out;
  }

  getSlot(row, col) { return this.board[row][col]; }

  equalShown(other, positions) {
    for (const pos of positions) {
      if (this.getSlot(pos.row, pos.col).getShown() !== other.getSlot(pos.row, pos.col).getShown()) return false;
    }
    return true;
  }

  promote(row, col) { this.getSlot(row, col).promote(); }

  clearPencilMarks() {
    for (let row = 0; row < 9; row++) for (let col = 0; col < 9; col++) this.board[row][col].setPencilMarks(0);
  }

  clearDigits() {
    for (let row = 0; row < 9; row++) for (let col = 0; col < 9; col++) if (!this.board[row][col].isOriginalDigit()) this.board[row][col].setShown(0);
  }

  isSolved() {
    for (let row = 0; row < 9; row++) for (let col = 0; col < 9; col++) if (this.board[row][col].getShown() !== this.board[row][col].getAnswer()) return false;
    return true;
  }

  isCompletelyFilled() {
    for (let row = 0; row < 9; row++) for (let col = 0; col < 9; col++) if (this.board[row][col].getShown() === 0) return false;
    return true;
  }

  setupPossibleDigits() {
    for (let row = 0; row < 9; row++) for (let col = 0; col < 9; col++) for (let i = 0; i < 9; i++) this.getSlot(row, col).setPencilMark(i, true);
    let sum = 81 * 9;
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const slot = this.getSlot(row, col);
        const d = slot.getShown();
        if (d > 0) {
          for (let i = 0; i < 9; i++) {
            if (i !== d - 1) {
              if (slot.isPencilMark(i)) sum--;
              slot.setPencilMark(i, false);
            }
          }
        }
        for (let r = 0; r < 9; r++) {
          const checkSlot = this.getSlot(r, col);
          const digit = checkSlot.getShown();
          if (digit > 0 && checkSlot !== slot) {
            if (slot.isPencilMark(digit - 1)) sum--;
            slot.setPencilMark(digit - 1, false);
          }
        }
        for (let c = 0; c < 9; c++) {
          const checkSlot = this.getSlot(row, c);
          const digit = checkSlot.getShown();
          if (digit > 0 && checkSlot !== slot) {
            if (slot.isPencilMark(digit - 1)) sum--;
            slot.setPencilMark(digit - 1, false);
          }
        }
        const basicRow = Math.trunc(row / 3) * 3;
        const basicCol = Math.trunc(col / 3) * 3;
        for (let i = 0; i < 3; i++) {
          for (let j = 0; j < 3; j++) {
            const checkSlot = this.getSlot(basicRow + i, basicCol + j);
            const digit = checkSlot.getShown();
            if (digit > 0 && checkSlot !== slot) {
              if (slot.isPencilMark(digit - 1)) sum--;
              slot.setPencilMark(digit - 1, false);
            }
          }
        }
      }
    }
    return sum;
  }

  intializePencilMarks(emptyPositions) {
    for (let row = 0; row < 9; row++) for (let col = 0; col < 9; col++) for (let digit = 0; digit < 9; digit++) this.board[row][col].setPencilMark(digit, true);
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (this.board[row][col].isOriginalDigit()) this.setSolvedDigit(new Position(row, col), this.board[row][col].getAnswer(), emptyPositions);
      }
    }
  }

  getElapsedTime() { return this.elapsedTime; }
  setElapsedTime(v) { this.elapsedTime = v; }
  getType() { return this.type; }
  setType(v) { this.type = v; }

  setSolvedDigit(pos, digit, emptyPositions) {
    const slot = this.board[pos.row][pos.col];
    slot.setShown(digit);
    slot.setOriginalDigit(true);
    slot.setPencilMarks(0);
    slot.setPencilMark(digit - 1, true);
    removePosition(emptyPositions, pos);
    this.eliminatePencilMarks(pos, digit, emptyPositions);
  }

  eliminatePencilMarks(pos, digit, emptyPositions) {
    for (const p of emptyPositions) {
      if (p.row === pos.row && p.col !== pos.col) this.board[pos.row][p.col].setPencilMark(digit - 1, false);
      if (p.col === pos.col && p.row !== pos.row) this.board[p.row][pos.col].setPencilMark(digit - 1, false);
      if (p.getBlockNumber() === pos.getBlockNumber()) {
        if (p.row !== pos.row && p.col !== pos.col) this.board[p.row][p.col].setPencilMark(digit - 1, false);
      }
    }
  }

  allEmptyPositions() {
    const result = [];
    for (let row = 0; row < 9; row++) for (let col = 0; col < 9; col++) if (!this.board[row][col].isOriginalDigit()) result.push(new Position(row, col));
    return result;
  }

  isSingle(pos) {
    let count = 0, last = 0;
    const slot = this.board[pos.row][pos.col];
    for (let i = 0; i < 9; i++) if (slot.isPencilMark(i)) { count++; last = i + 1; }
    if (count === 1) return last;
    if (count === 0) return -1;
    return 0;
  }

  isHiddenSingle(pos, digitArg = undefined) {
    if (digitArg === undefined) {
      for (let digit = 0; digit < 9; digit++) if (this.board[pos.row][pos.col].isPencilMark(digit) && this.isHiddenSingle(pos, digit)) return digit + 1;
      return 0;
    }
    const digit = digitArg;
    let count = 0;
    for (let r = 0; r < 9; r++) if (this.board[r][pos.col].isPencilMark(digit)) count++;
    if (count === 1) return true;
    count = 0;
    for (let c = 0; c < 9; c++) if (this.board[pos.row][c].isPencilMark(digit)) count++;
    if (count === 1) return true;
    count = 0;
    const br = Math.trunc(pos.row / 3) * 3;
    const bc = Math.trunc(pos.col / 3) * 3;
    for (let r = br; r < br + 3; r++) for (let c = bc; c < bc + 3; c++) if (this.board[r][c].isPencilMark(digit)) count++;
    return count === 1;
  }

  hideNumber(pos) {
    const slot = this.board[pos.row][pos.col];
    if (slot.getShown() > 0) { slot.setShown(0); slot.setOriginalDigit(false); return true; }
    return false;
  }

  unhideNumber(pos) {
    const slot = this.board[pos.row][pos.col];
    slot.setShown(slot.getAnswer());
    slot.setOriginalDigit(true);
  }

  unhideNumbers(positions) { for (const pos of positions) this.unhideNumber(pos); }

  copyShownToAnswer() { for (let row = 0; row < 9; row++) for (let col = 0; col < 9; col++) this.getSlot(row, col).setAnswer(this.getSlot(row, col).getShown()); }

  resetForEdit() {
    for (let row = 0; row < 9; row++) for (let col = 0; col < 9; col++) {
      const slot = this.getSlot(row, col);
      if (!slot.isOriginalDigit()) { slot.setShown(0); slot.setAnswer(0); }
      slot.setOriginalDigit(false);
      slot.setPencilMarks(0);
    }
  }

  setAllShownDigitsAsOriginal() {
    for (let row = 0; row < 9; row++) for (let col = 0; col < 9; col++) {
      const slot = this.getSlot(row, col);
      if (slot.getShown() > 0) { slot.setAnswer(slot.getShown()); slot.setOriginalDigit(true); }
    }
  }

  getBackTrackingDepth() { return this.backTrackingDepth; }
  setBackTrackingDepth(v) { this.backTrackingDepth = v; }
  getNumberOfGiven() { return 81 - this.allEmptyPositions().length; }

  getNumberOfSingles() {
    let sum = 0;
    for (const pos of this.allEmptyPositions()) if (this.isSingle(pos) > 0 || this.isHiddenSingle(pos) > 0) sum++;
    return sum;
  }

  checkForRules() {
    this.setupPossibleDigits();
    for (let row = 0; row < 9; row++) for (let col = 0; col < 9; col++) {
      const slot = this.getSlot(row, col);
      let count = 0;
      for (let i = 0; i < 9; i++) if (slot.isPencilMark(i)) count++;
      if (count === 0) return false;
    }
    return true;
  }

  getDigitCounts() {
    const count = Array(10).fill(0);
    for (let row = 0; row < 9; row++) for (let col = 0; col < 9; col++) count[this.getSlot(row, col).getShown()]++;
    return count;
  }


  getConflictPositions(row, col, digit) {
    if (digit === 0) return null;
    const out = [];
    for (let i = 0; i < 9; i++) {
      if (i !== row && this.board[i][col].getShown() === digit) out.push(new Position(i, col));
      if (i !== col && this.board[row][i].getShown() === digit) out.push(new Position(row, i));
    }
    const br = Math.trunc(row / 3) * 3, bc = Math.trunc(col / 3) * 3;
    for (let r = br; r < br + 3; r++) { if (r === row) continue; for (let c = bc; c < bc + 3; c++) { if (c === col) continue; if (this.board[r][c].getShown() === digit) out.push(new Position(r,c)); } }
    return out;
  }

  randomizeDigits() {
    for (let d1 = 1; d1 <= 9; d1++) {
      let d2 = d1;
      while (d1 === d2) d2 = this.randomDigit(9) + 1;
      for (let row = 0; row < 9; row++) for (let col = 0; col < 9; col++) {
        const slot = this.getSlot(row, col);
        if (slot.getAnswer() === d1) {
          slot.setAnswer(d2);
          if (slot.getShown() !== 0) slot.setShown(d2);
        } else if (slot.getAnswer() === d2) {
          slot.setAnswer(d1);
          if (slot.getShown() !== 0) slot.setShown(d1);
        }
      }
    }
  }

  randomDigit(n) { return javaRemainder(javaAbsInt(Grid.random.nextInt()), n); }

  isValidSolution() {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const digit = this.board[row][col].getShown();
        if (digit === 0) return false;
        for (let i = 0; i < 9; i++) {
          if (i !== row && this.board[i][col].getShown() === digit) return false;
          if (i !== col && this.board[row][i].getShown() === digit) return false;
        }
        const br = Math.trunc(row / 3) * 3, bc = Math.trunc(col / 3) * 3;
        for (let r = br; r < br + 3; r++) {
          if (r === row) continue;
          for (let c = bc; c < bc + 3; c++) {
            if (c === col) continue;
            if (this.board[r][c].getShown() === digit) return false;
          }
        }
      }
    }
    return true;
  }

  shownString() {
    let out = '';
    for (let row = 0; row < 9; row++) for (let col = 0; col < 9; col++) out += String(this.board[row][col].getShown());
    return out;
  }

  answerString() {
    let out = '';
    for (let row = 0; row < 9; row++) for (let col = 0; col < 9; col++) out += String(this.board[row][col].getAnswer());
    return out;
  }

  static fromPuzzle(puzzle, type = 'fixture') {
    const g = new Grid(type);
    for (let i = 0; i < 81; i++) {
      const d = puzzle.charCodeAt(i) >= 49 && puzzle.charCodeAt(i) <= 57 ? Number(puzzle[i]) : 0;
      const slot = g.getSlot(Math.trunc(i / 9), i % 9);
      slot.setShown(d);
      if (d > 0) { slot.setAnswer(d); slot.setOriginalDigit(true); }
    }
    return g;
  }
}
