// SPDX-License-Identifier: GPL-3.0-or-later

/** Exact 8-bit Galois RNG used by Lawn Mower v1.1/v1.12. */
export class LawnRng {
  constructor(seed = 1) { this.state = seed & 0xff; }
  setSeed(seed) { this.state = seed & 0xff; }
  next() {
    const carry = (this.state >>> 7) & 1;
    let value = (this.state << 1) & 0xff;
    if (carry) value ^= 0xcf;
    this.state = value;
    return value;
  }
}

/** Exact repeated-subtraction modulo semantics of the source's max routine. */
export function sourceModulo(value, max) {
  if (!Number.isInteger(max) || max <= 0) throw new RangeError('max must be a positive integer');
  let v = value & 0xff;
  while (v >= max) v -= max;
  return v;
}
