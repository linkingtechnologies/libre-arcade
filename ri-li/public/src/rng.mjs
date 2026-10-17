/* Ri-li 2.0.1 deterministic RNG compatibility layer. SPDX-License-Identifier: GPL-3.0-only */
export class GlibcRand {
  constructor(seed = 1) {
    this.seed = Number(seed) >>> 0;
    if (this.seed === 0) this.seed = 1;
    this.r = new Array(344).fill(0);
    this.calls = [];
    this.#initState(this.seed);
    this.nextIndex = 344;
  }
  #initState(seed) {
    let word = seed < 0x80000000 ? seed : seed - 0x100000000;
    this.r[0] = word >>> 0;
    for (let i = 1; i < 31; i++) {
      const hi = Math.trunc(word / 127773);
      const lo = word - hi * 127773;
      word = 16807 * lo - 2836 * hi;
      if (word < 0) word += 2147483647;
      this.r[i] = word >>> 0;
    }
    for (let i = 31; i < 34; i++) this.r[i] = this.r[i - 31];
    for (let i = 34; i < 344; i++) this.r[i] = (this.r[i - 31] + this.r[i - 3]) >>> 0;
  }
  rand(tag = 'rand') {
    const i = this.nextIndex;
    this.r.push((this.r[i - 31] + this.r[i - 3]) >>> 0);
    const raw = this.r[i] >>> 1;
    this.nextIndex++;
    this.calls.push({ index: this.calls.length, tag, raw, modulus: null, value: raw });
    return raw;
  }
  randMod(modulus, tag) {
    if (!(modulus > 0)) throw new Error(`bad modulus ${modulus}`);
    const raw = this.rand(tag);
    const value = raw % modulus;
    this.calls[this.calls.length - 1] = { index: this.calls.length - 1, tag, raw, modulus, value };
    return value;
  }
  get callCount() { return this.calls.length; }
}
