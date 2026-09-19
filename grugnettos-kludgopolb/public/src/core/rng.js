export class SeededRng {
  constructor(seed = 1) {
    let n = Number(seed);
    if (!Number.isFinite(n)) n = 1;
    this.state = (n >>> 0) || 0x6d2b79f5;
  }

  nextUint32() {
    let t = this.state += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    this.state = (t ^ (t >>> 14)) >>> 0;
    return this.state;
  }

  next() {
    return this.nextUint32() / 4294967296;
  }

  int(maxExclusive) {
    if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) throw new Error('maxExclusive must be > 0');
    return Math.floor(this.next() * maxExclusive);
  }

  bool() {
    return this.next() < 0.5;
  }

  shuffle(array) {
    const out = [...array];
    for (let i = out.length - 1; i > 0; i -= 1) {
      const j = this.int(i + 1);
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  toSnapshot() {
    return { state: this.state >>> 0 };
  }

  restore(snapshot) {
    if (!snapshot || !Number.isInteger(snapshot.state)) throw new Error('Invalid RNG snapshot');
    this.state = snapshot.state >>> 0;
    return this;
  }

  static fromSnapshot(snapshot) {
    return new SeededRng(1).restore(snapshot);
  }
}
