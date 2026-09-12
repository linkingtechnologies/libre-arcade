// SPDX-License-Identifier: GPL-3.0-or-later
export class Rng {
  constructor(seed = 0x50535950) {
    this.state = (seed >>> 0) || 0x6d2b79f5;
  }

  nextU32() {
    let x = this.state;
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    this.state = x >>> 0;
    return this.state;
  }

  float() {
    return this.nextU32() / 0x100000000;
  }

  int(maxExclusive) {
    if (maxExclusive <= 0) return 0;
    return Math.floor(this.float() * maxExclusive);
  }

  pick(values) {
    return values[this.int(values.length)];
  }
}
