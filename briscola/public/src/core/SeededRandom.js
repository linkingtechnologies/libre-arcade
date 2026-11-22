// SPDX-License-Identifier: GPL-3.0-only
export class SeededRandom {
  constructor(seed = Date.now()) {
    const normalized = Number(seed) >>> 0;
    this.state = normalized || 0x9e3779b9;
  }

  next() {
    // Mulberry32: deterministic, compact, sufficient for repeatable shuffles.
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  int(maxExclusive) {
    if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
      throw new RangeError("maxExclusive must be a positive integer");
    }
    return Math.floor(this.next() * maxExclusive);
  }
}
