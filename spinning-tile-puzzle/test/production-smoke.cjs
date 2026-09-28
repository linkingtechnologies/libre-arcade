// SPDX-License-Identifier: GPL-3.0-or-later
// Node port of the delivered test/production-smoke.sh's static-content
// checks (the parts that need neither bash nor a JDK). The Java-backed
// checks live in spinner-parity.cjs against stored fixtures;
// test/production-smoke.sh remains for an optional full, live-Java
// re-verification.
const assert = require('assert');
const { readFileSync } = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const html = readFileSync(path.join(root, 'public/index.html'), 'utf8');

for (const required of [
  'Spinning Tile Puzzle', 'id="directionSelect"', 'id="backgroundInput"',
  'aria-keyshortcuts="1 2 3 4 5 6 Enter Space"',
]) {
  assert.ok(html.includes(required), `missing ${required}`);
}
assert.ok(!html.includes('type="module"'), 'index must not require ES modules');

// The player-facing UI must not leak archaeology/milestone jargon.
for (const forbidden of [/milestone/i, /oracle/i, /connectedset/i, /debug/i, /seed/i, /parity/i, /randomizer/i]) {
  assert.ok(!forbidden.test(html), `player UI contains internal jargon matching ${forbidden}`);
}

// The only remote script allowed is the collection's GoatCounter beacon.
const remote = [...html.matchAll(/<script[^>]+src=["']((?:https?:)?\/\/[^"']+)["']/g)].map((m) => m[1]);
assert.deepEqual(remote, ['//gc.zgo.at/count.js'], `unexpected remote scripts: ${JSON.stringify(remote)}`);

console.log('production-smoke: ok');
