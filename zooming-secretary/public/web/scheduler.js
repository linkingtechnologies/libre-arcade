/* SPDX-License-Identifier: GPL-3.0-or-later */
export class FixedStepClock {
  constructor({ hz = 50, maxDeltaMs = 250 } = {}) {
    this.hz = hz;
    this.stepMs = 1000 / hz;
    this.maxDeltaMs = maxDeltaMs;
    this.accumulator = 0;
  }

  reset() { this.accumulator = 0; }

  consume(deltaMs) {
    const safe = Math.max(0, Math.min(deltaMs, this.maxDeltaMs));
    this.accumulator += safe;
    let steps = 0;
    while (this.accumulator + 1e-9 >= this.stepMs) {
      this.accumulator -= this.stepMs;
      steps++;
    }
    return { steps, alpha: this.accumulator / this.stepMs };
  }
}
