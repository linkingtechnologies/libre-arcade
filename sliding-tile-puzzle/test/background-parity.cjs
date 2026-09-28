// The delivered version of this test compiled test/PrintBackgroundColors.java
// and invoked `java` live on every run, which makes `npm test` depend on a
// JDK being installed. It was re-run here against real java.awt.Color math
// (Java 1.8.0_503) and its output stored in test/fixtures/background-oracle.json;
// this version checks against that stored output, so no Java is needed for
// ordinary testing. See AGENTS.md for how to regenerate the fixture if
// game.js's color math ever changes.
const assert = require('assert');
const G = require('../src/game.js');
const fixture = require('./fixtures/background-oracle.json');

assert.equal(fixture.scenarios.length, 11, 'expected 11 recorded mean colors (10 photos + the default)');
const js = fixture.scenarios.map(({ rgb }) => G.backgroundFromMean(...rgb));
const expected = fixture.scenarios.map((s) => s.hex);
assert.deepEqual(js, expected);
console.log('background-parity: ok (against stored oracle fixture)', js.join(' '));
