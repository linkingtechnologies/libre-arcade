export class PresentationSequence {
  constructor(length) {
    this.length = length;
    this.index = 0;
    this.step = 0;
    this.done = length <= 0;
  }

  reset() {
    this.index = 0;
    this.step = 0;
    this.done = this.length <= 0;
  }

  update({ advance = false, escape = false } = {}) {
    if (this.done) return 'done';
    if (escape) {
      this.done = true;
      return 'done';
    }

    let shouldAdvance = false;
    if (this.step > 1000) shouldAdvance = true;
    if (this.step > 100 && advance) shouldAdvance = true;

    if (shouldAdvance) {
      if (this.index >= this.length - 1) {
        this.done = true;
        return 'done';
      }
      this.index++;
      this.step = 0;
    }

    this.step++;
    return shouldAdvance ? 'advanced' : 'waiting';
  }
}
