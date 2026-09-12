// SPDX-License-Identifier: GPL-3.0-only
export class SeededRng {
  constructor(seed = 0x6d2b79f5, scripted = []) {
    this.state = (Number(seed) >>> 0) || 0x6d2b79f5;
    this.scripted = [...scripted];
  }

  next() {
    // Mulberry32: deterministic, tiny and sufficient for game simulation/tests.
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    const r = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    this.state >>>= 0;
    return r;
  }

  d6() {
    if (this.scripted.length) {
      const value = Number(this.scripted.shift());
      if (!Number.isInteger(value) || value < 1 || value > 6) {
        throw new Error(`Invalid scripted die value: ${value}`);
      }
      return value;
    }
    return Math.floor(this.next() * 6) + 1;
  }

  chancePercent(percent) {
    return Math.floor(this.next() * 100) < percent;
  }

  snapshot() {
    return { state: this.state >>> 0, scripted: [...this.scripted] };
  }
}
