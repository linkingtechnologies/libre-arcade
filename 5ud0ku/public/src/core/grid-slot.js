export class GridSlot {
  constructor() {
    this.shown = 0;
    this.answer = 0;
    this.originalDigit = false;
    this.pencilMarks = 0;
  }
  getAnswer() { return this.answer; }
  setAnswer(v) { this.answer = v; }
  getShown() { return this.shown; }
  setShown(v) { this.shown = v; }
  isOriginalDigit() { return this.originalDigit; }
  setOriginalDigit(v) { this.originalDigit = Boolean(v); }
  promote() { this.shown = this.answer; }
  getPencilMarks() { return this.pencilMarks; }
  setPencilMarks(v) { this.pencilMarks = v | 0; }
  isPencilMark(idx) { return (this.pencilMarks & (1 << idx)) !== 0; }
  setPencilMark(idx, mark) {
    if (mark) this.pencilMarks |= (1 << idx);
    else this.pencilMarks &= ~(1 << idx);
  }
}
