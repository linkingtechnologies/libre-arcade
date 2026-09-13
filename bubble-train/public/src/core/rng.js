// SPDX-License-Identifier: GPL-3.0-or-later
/** Deterministic gameplay RNG. The original used platform C rand(); this object
 * deliberately isolates randomness so tests/replays can be stable. */
export class SeededRng {
  constructor(seed = 0x6d2b79f5) {
    this.state = (Number(seed) >>> 0) || 0x6d2b79f5;
  }
  nextUint32() {
    // xorshift32: tiny, deterministic, client-side and dependency-free.
    let x = this.state >>> 0;
    x ^= (x << 13) >>> 0;
    x ^= x >>> 17;
    x ^= (x << 5) >>> 0;
    this.state = x >>> 0;
    return this.state;
  }
  nextFloat() { return this.nextUint32() / 0x100000000; }
  nextInt(maxExclusive) {
    if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) throw new RangeError('maxExclusive must be a positive integer');
    return this.nextUint32() % maxExclusive; // preserves the original rand()%N style selection semantics.
  }
  between(min, max) { return min + (max - min) * this.nextFloat(); }
  clone() { const c = new SeededRng(1); c.state = this.state; return c; }
}

export function randomSeed() {
  if (globalThis.crypto?.getRandomValues) {
    const a = new Uint32Array(1); globalThis.crypto.getRandomValues(a); return a[0] || 1;
  }
  return (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0 || 1;
}
