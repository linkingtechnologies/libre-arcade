// The delivered version of this test compiled test/PrintSliderMix.java and
// invoked `java` live against reference/puzzlegames.jar on every run, which
// makes `npm test` depend on a JDK being installed. It was re-run here
// against the real jar (Java 1.8.0_503) and its output stored in
// test/fixtures/mix-oracle.json; this version checks against that stored
// output, so no Java is needed for ordinary testing. See AGENTS.md for how
// to regenerate the fixture from the original classes if game.js ever
// changes.
const assert = require('assert');
const path = require('path');
const G = require('../src/game.js');
const fixture = require('./fixtures/mix-oracle.json');

class JavaRandom {
  constructor(seed) { this.mask = (1n << 48n) - 1n; this.seed = (BigInt(seed) ^ 0x5DEECE66Dn) & this.mask; }
  next(bits) { this.seed = (this.seed * 0x5DEECE66Dn + 0xBn) & this.mask; return Number(this.seed >> (48n - BigInt(bits))); }
  nextInt(bound) {
    if (bound <= 0) throw new Error('bound');
    if ((bound & -bound) === bound) return Math.floor((bound * this.next(31)) / 2147483648);
    let bits, val; do { bits = this.next(31); val = bits % bound; } while (bits - val + (bound - 1) >= 2147483648); return val;
  }
}

assert.equal(fixture.scenarios.length, 9, 'expected 9 recorded scenarios (3 sizes x 3 seeds)');
for (const { size, seed, blank, board } of fixture.scenarios) {
  const state = G.mix(size, new JavaRandom(seed));
  assert.equal(state.blank, blank, `size ${size} seed ${seed}: blank`);
  assert.deepEqual(state.board, board, `size ${size} seed ${seed}: board`);
}
console.log('mix-parity: ok (' + path.basename(__filename) + ', against stored oracle fixture)');
