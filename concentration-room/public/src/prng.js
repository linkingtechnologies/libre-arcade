/*
 * Concentration Room 0.02 PRNG reimplementation.
 * Derived from src/shuffle.s in the GPL-3.0-or-later upstream.
 * The four bytes represent the 32-bit CRC register as
 * rand0:rand1:rand2:rand3 (most to least significant byte).
 */
export class CroomPRNG {
  constructor({ rand0 = 0x26, rand1 = 0x25, rand2 = 0x24, rand3 = 0x23 } = {}) {
    this.rand0 = rand0 & 0xff;
    this.rand1 = rand1 & 0xff;
    this.rand2 = rand2 & 0xff;
    this.rand3 = rand3 & 0xff;
  }

  clone() {
    return new CroomPRNG(this.snapshot());
  }

  snapshot() {
    return {
      rand0: this.rand0,
      rand1: this.rand1,
      rand2: this.rand2,
      rand3: this.rand3,
    };
  }

  randomBits(bitCount) {
    let y = bitCount & 0xff;
    while (y !== 0) {
      let carry = (this.rand3 >>> 7) & 1;
      this.rand3 = (this.rand3 << 1) & 0xff;

      let nextCarry = (this.rand2 >>> 7) & 1;
      this.rand2 = ((this.rand2 << 1) & 0xff) | carry;
      carry = nextCarry;

      nextCarry = (this.rand1 >>> 7) & 1;
      this.rand1 = ((this.rand1 << 1) & 0xff) | carry;
      carry = nextCarry;

      nextCarry = (this.rand0 >>> 7) & 1;
      this.rand0 = ((this.rand0 << 1) & 0xff) | carry;
      carry = nextCarry;

      if (carry) {
        this.rand0 ^= 0x04;
        this.rand1 ^= 0xc1;
        this.rand2 ^= 0x1d;
        this.rand3 ^= 0xb7;
      }
      y = (y - 1) & 0xff;
    }
    return this.rand3;
  }

  // titleModes index: 0 story, 1 solitaire, 2 two-player, 3 vs CPU, 4 license.
  mixTitleSelection(modeIndex, nmis) {
    this.rand0 = (this.rand0 + ((modeIndex & 0xff) << 1)) & 0xff;
    this.rand2 = (this.rand2 ^ (nmis & 0xff)) & 0xff;
    this.randomBits(2);
    return this;
  }

  mixDealTime(nmis) {
    this.rand3 = (this.rand3 ^ (nmis & 0xff)) & 0xff;
    this.randomBits(8);
    return this;
  }
}
