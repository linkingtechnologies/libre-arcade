// SPDX-License-Identifier: GPL-3.0-or-later
// The delivered version of this test compiled test/PrintSpinnerOracle.java and
// invoked `java` live against reference/puzzlegames.jar on every run, which
// makes `npm test` depend on a JDK being installed. It was re-run here
// against the real jar (Java 1.8.0_503) and its output stored in
// test/fixtures/geometry-oracle.json, mix-oracle.json and spin-oracle.json;
// this version checks against that stored output, so no Java is needed for
// ordinary testing. See AGENTS.md for how to regenerate the fixtures.
const assert = require('assert');
const G = require('../src/game.js');
const geometryFixture = require('./fixtures/geometry-oracle.json');
const mixFixture = require('./fixtures/mix-oracle.json');
const spinFixture = require('./fixtures/spin-oracle.json');

class JavaRandom {
  constructor(seed) { this.mask = (1n << 48n) - 1n; this.seed = (BigInt(seed) ^ 0x5DEECE66Dn) & this.mask; }
  next(bits) { this.seed = (this.seed * 0x5DEECE66Dn + 0xBn) & this.mask; return Number(this.seed >> (48n - BigInt(bits))); }
  nextInt(bound) {
    if ((bound & -bound) === bound) return Math.floor((bound * this.next(31)) / 2147483648);
    let bits, val; do { bits = this.next(31); val = bits % bound; } while (bits - val + (bound - 1) >= 2147483648); return val;
  }
}
function stateString(s) { return s.originalIndex.map((v, i) => `${v}@${s.rotation[i]}`).join(';'); }

assert.equal(geometryFixture.scenarios.length, 4, 'expected 4 recorded board sizes');
for (const { boardWidth, boardHeight, descriptor, tiles, vertices } of geometryFixture.scenarios) {
  const l = G.layout(boardWidth, boardHeight);
  assert.deepEqual(
    [l.tileCount, l.tilesAcross, l.tilesDown, l.tileWidth, l.tileHeight, l.spacingX, l.spacingY, l.leftOffset, l.topOffset, l.boardWidth, l.boardHeight],
    descriptor, `layout ${boardWidth}x${boardHeight}`,
  );
  for (let i = 0; i < 7; i++) {
    const p = G.tilePosition(l, i);
    assert.deepEqual([p.x, p.y], tiles[i], `tile ${i} at ${boardWidth}x${boardHeight}`);
  }
  for (let v = 0; v < 6; v++) {
    const p = G.vertexPosition(l, v);
    assert.deepEqual([p.x, p.y], vertices[v], `vertex ${v} at ${boardWidth}x${boardHeight}`);
  }
}

assert.equal(mixFixture.scenarios.length, 3, 'expected 3 recorded seeds');
for (const { seed, state } of mixFixture.scenarios) {
  const s = G.mix(new JavaRandom(seed));
  const expected = state.map(([orig, rot]) => `${orig}@${rot}`).join(';');
  assert.equal(stateString(s), expected, `mix seed ${seed}`);
}

assert.equal(spinFixture.scenarios.length, 12, 'expected 6 vertices x 2 directions');
for (const { vertex, direction, state, changed } of spinFixture.scenarios) {
  const s = G.createSolvedState();
  const actualChanged = G.spin(s, vertex, direction);
  const expected = state.map(([orig, rot]) => `${orig}@${rot}`).join(';');
  assert.equal(stateString(s), expected, `spin v${vertex} d${direction}`);
  assert.deepEqual(actualChanged, changed, `spin v${vertex} d${direction} changed tiles`);
}

console.log('spinner-parity: ok (against stored oracle fixtures)');
