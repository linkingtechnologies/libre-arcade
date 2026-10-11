/*
 * java.util.Random compatibility for 5ud0ku parity tests.
 * Uses the Java 48-bit LCG exactly, including signed nextInt() results.
 */
export class JavaRandom {
  static MULTIPLIER = 0x5DEECE66Dn;
  static ADDEND = 0xBn;
  static MASK = (1n << 48n) - 1n;

  constructor(seed = 0n) {
    this.setSeed(seed);
  }

  setSeed(seed) {
    const s = BigInt(seed);
    this.seed = (s ^ JavaRandom.MULTIPLIER) & JavaRandom.MASK;
  }

  next(bits) {
    this.seed = (this.seed * JavaRandom.MULTIPLIER + JavaRandom.ADDEND) & JavaRandom.MASK;
    return Number(this.seed >> (48n - BigInt(bits)));
  }

  nextInt() {
    const u = this.next(32) >>> 0;
    return u >= 0x80000000 ? u - 0x100000000 : u;
  }
}

// Java Math.abs(int) preserves Integer.MIN_VALUE because of overflow.
export function javaAbsInt(value) {
  return value === -2147483648 ? -2147483648 : Math.abs(value);
}

export function javaRemainder(a, b) {
  // JS % has the same sign-of-dividend rule as Java integer remainder.
  return a % b;
}
