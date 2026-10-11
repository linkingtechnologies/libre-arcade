// java.util.Random compatible 48-bit LCG for deterministic archaeology/QA.
export class JavaRandom {
  constructor(seed = Date.now()) {
    this.mask = (1n << 48n) - 1n;
    this.mult = 0x5DEECE66Dn;
    this.add = 0xBn;
    this.seed = (BigInt(Math.trunc(seed)) ^ this.mult) & this.mask;
  }
  next(bits) {
    this.seed = (this.seed * this.mult + this.add) & this.mask;
    return Number(this.seed >> (48n - BigInt(bits)));
  }
  nextInt(bound) {
    if (!Number.isInteger(bound) || bound <= 0) throw new RangeError('bound');
    if ((bound & -bound) === bound) return Math.floor((bound * this.next(31)) / 0x80000000);
    let bits, val;
    do { bits = this.next(31); val = bits % bound; } while (bits - val + (bound - 1) >= 0x80000000);
    return val;
  }
}
