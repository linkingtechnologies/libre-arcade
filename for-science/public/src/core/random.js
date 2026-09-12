/**
 * Python 2.7-compatible random helpers.
 *
 * Upstream uses Python 2.7's global random module. For all ranges in For
 * Science!, Python 2.7 randint/randrange use int(random() * width), and
 * shuffle uses the same float stream. The default source below implements the
 * same MT19937 core and 53-bit random() construction used by CPython.
 *
 * A 32-bit seed therefore gives the same random()/randint()/shuffle sequence
 * as Python 2.7 Random(seed). With no explicit seed we seed from Web Crypto;
 * the original also used OS entropy when available, so individual unseeded
 * runs are intentionally not reproducible across implementations.
 */
export class RandomSource {
  constructor(source) {
    if (typeof source === 'function') {
      // Test/fixture injection path retained for small deterministic unit tests.
      this.random = source;
      this.seed = null;
      this.engine = null;
      return;
    }

    this.seed = normalizeSeed(source ?? secureSeed32());
    this.engine = new MT19937Python(this.seed);
    this.random = () => this.engine.random();
  }

  static fromSeed(seed) {
    return new RandomSource(seed);
  }

  randint(min, max) {
    // Python 2.7 randrange fast path for our small integer widths.
    return min + Math.floor(this.random() * (max - min + 1));
  }

  shuffle(array) {
    // Literal Python 2.7 random.shuffle() algorithm.
    for (let i = array.length - 1; i > 0; i -= 1) {
      const j = Math.floor(this.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  choice(array) {
    return array[Math.floor(this.random() * array.length)];
  }
}

class MT19937Python {
  constructor(seed) {
    this.mt = new Uint32Array(624);
    this.index = 624;
    this.#initByArray([seed >>> 0]);
  }

  #initGenrand(seed) {
    this.mt[0] = seed >>> 0;
    for (let i = 1; i < 624; i += 1) {
      const prev = this.mt[i - 1];
      const mixed = (prev ^ (prev >>> 30)) >>> 0;
      this.mt[i] = (Math.imul(1812433253, mixed) + i) >>> 0;
    }
    this.index = 624;
  }

  #initByArray(key) {
    this.#initGenrand(19650218);
    let i = 1;
    let j = 0;
    let k = Math.max(624, key.length);

    for (; k > 0; k -= 1) {
      const prev = this.mt[i - 1];
      const mixed = (prev ^ (prev >>> 30)) >>> 0;
      this.mt[i] = ((this.mt[i] ^ Math.imul(mixed, 1664525)) + (key[j] >>> 0) + j) >>> 0;
      i += 1;
      j += 1;
      if (i >= 624) {
        this.mt[0] = this.mt[623];
        i = 1;
      }
      if (j >= key.length) j = 0;
    }

    for (k = 623; k > 0; k -= 1) {
      const prev = this.mt[i - 1];
      const mixed = (prev ^ (prev >>> 30)) >>> 0;
      this.mt[i] = ((this.mt[i] ^ Math.imul(mixed, 1566083941)) - i) >>> 0;
      i += 1;
      if (i >= 624) {
        this.mt[0] = this.mt[623];
        i = 1;
      }
    }

    this.mt[0] = 0x80000000;
    this.index = 624;
  }

  #twist() {
    const mag1 = 0x9908b0df;
    let y;
    let kk = 0;

    for (; kk < 227; kk += 1) {
      y = (this.mt[kk] & 0x80000000) | (this.mt[kk + 1] & 0x7fffffff);
      this.mt[kk] = (this.mt[kk + 397] ^ (y >>> 1) ^ ((y & 1) ? mag1 : 0)) >>> 0;
    }
    for (; kk < 623; kk += 1) {
      y = (this.mt[kk] & 0x80000000) | (this.mt[kk + 1] & 0x7fffffff);
      this.mt[kk] = (this.mt[kk - 227] ^ (y >>> 1) ^ ((y & 1) ? mag1 : 0)) >>> 0;
    }
    y = (this.mt[623] & 0x80000000) | (this.mt[0] & 0x7fffffff);
    this.mt[623] = (this.mt[396] ^ (y >>> 1) ^ ((y & 1) ? mag1 : 0)) >>> 0;
    this.index = 0;
  }

  #int32() {
    if (this.index >= 624) this.#twist();
    let y = this.mt[this.index++];
    y ^= y >>> 11;
    y ^= (y << 7) & 0x9d2c5680;
    y ^= (y << 15) & 0xefc60000;
    y ^= y >>> 18;
    return y >>> 0;
  }

  random() {
    // CPython _randommodule.c: 53 random bits from two MT outputs.
    const a = this.#int32() >>> 5;
    const b = this.#int32() >>> 6;
    return (a * 67108864 + b) / 9007199254740992;
  }
}

function normalizeSeed(seed) {
  const n = Number(seed);
  if (!Number.isFinite(n)) throw new TypeError('seed must be a finite number');
  return Math.trunc(Math.abs(n)) >>> 0;
}

function secureSeed32() {
  if (globalThis.crypto?.getRandomValues) {
    const value = new Uint32Array(1);
    globalThis.crypto.getRandomValues(value);
    return value[0];
  }
  return Math.floor(Math.random() * 0x100000000) >>> 0;
}
