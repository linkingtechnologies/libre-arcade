import { EMPTY } from './constants.js';

export class BreakableBlock {
  constructor(spawn) {
    Object.assign(this, spawn);
    this.state = 0;
    this.step = 0;
    this.delay = 0;
  }

  update() {
    if (this.state !== 1) return;
    if (this.delay > 10) {
      if (this.step >= 1) this.state = -1;
      else this.step++;
      this.delay = 0;
    } else this.delay++;
  }

  hit(level) {
    if (this.state !== 0) return false;
    this.step = 0;
    this.delay = 0;
    this.state = 1;
    level.setTile(this.row, this.col, EMPTY);
    return true;
  }

  get frame() { return this.state === 0 ? 4 : 5 + Math.min(this.step, 1); }
}
