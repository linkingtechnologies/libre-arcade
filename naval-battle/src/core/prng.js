/** Deterministic 32-bit Mulberry PRNG. Not an emulation of any historical libc RNG. */
export class SeededRng {
  constructor(seed = 0x1a2b3c4d) {
    this.state = seed >>> 0;
  }

  next() {
    let t = (this.state += 0x6d2b79f5) >>> 0;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  int(maxExclusive) {
    if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) throw new RangeError('maxExclusive must be positive');
    return Math.floor(this.next() * maxExclusive);
  }

  pick(items) {
    if (!items.length) throw new RangeError('cannot pick from an empty list');
    return items[this.int(items.length)];
  }
}
