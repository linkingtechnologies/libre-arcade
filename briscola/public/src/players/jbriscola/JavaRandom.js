// SPDX-License-Identifier: GPL-3.0-only
// Compatibility implementation used by the faithful JBriscola port.
/**
 * Minimal java.util.Random-compatible generator used to reproduce the only
 * random branch in the original JBriscola CPU.
 */
export class JavaRandom {
  static MULTIPLIER = 0x5deece66dn;
  static ADDEND = 0xbn;
  static MASK = (1n << 48n) - 1n;

  constructor(seed = Date.now()) {
    this.setSeed(seed);
  }

  setSeed(seed) {
    const value = BigInt(Math.trunc(Number(seed)));
    this.seed = (value ^ JavaRandom.MULTIPLIER) & JavaRandom.MASK;
  }

  next(bits) {
    this.seed = (this.seed * JavaRandom.MULTIPLIER + JavaRandom.ADDEND) & JavaRandom.MASK;
    return Number(this.seed >> (48n - BigInt(bits)));
  }

  nextInt() {
    const unsigned = this.next(32) >>> 0;
    return unsigned >= 0x80000000 ? unsigned - 0x100000000 : unsigned;
  }
}
