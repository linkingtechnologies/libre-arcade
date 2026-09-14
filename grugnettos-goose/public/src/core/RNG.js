export class RNG {
  constructor(seed = 0x12345678) {
    this.state = RNG.normalizeSeed(seed);
  }

  static normalizeSeed(seed) {
    if (typeof seed === 'number' && Number.isFinite(seed)) {
      return seed >>> 0 || 0x6d2b79f5;
    }

    const text = String(seed);
    let hash = 2166136261 >>> 0;
    for (let i = 0; i < text.length; i += 1) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 16777619) >>> 0;
    }
    return hash || 0x6d2b79f5;
  }

  nextUint32() {
    // Mulberry32: compact, deterministic, sufficient for reproducible game dice.
    let t = (this.state += 0x6d2b79f5) >>> 0;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    const result = (t ^ (t >>> 14)) >>> 0;
    this.state >>>= 0;
    return result;
  }

  nextFloat() {
    return this.nextUint32() / 0x100000000;
  }

  nextInt(min, max) {
    if (!Number.isInteger(min) || !Number.isInteger(max) || max < min) {
      throw new RangeError('Invalid integer range');
    }

    const range = max - min + 1;
    const limit = Math.floor(0x100000000 / range) * range;
    let value;
    do {
      value = this.nextUint32();
    } while (value >= limit);

    return min + (value % range);
  }

  exportState() {
    return { state: this.state >>> 0 };
  }

  importState(snapshot) {
    if (!snapshot || !Number.isInteger(snapshot.state)) {
      throw new TypeError('Invalid RNG state');
    }
    this.state = snapshot.state >>> 0;
  }
}
