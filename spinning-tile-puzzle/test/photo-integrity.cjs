// SPDX-License-Identifier: GPL-3.0-or-later
// The 10 bundled photographs, their 10 thumbnails, and the two rotation
// cursor icons were verified byte for byte against
// reference/puzzlegames.jar's pics/ and images/ directories when this game
// joined the Libre Arcade collection (see PROVENANCE.md). Re-hashing the jar
// on every test run would need a zip/deflate reader with no other use here,
// so this instead guards the already-verified files against later corruption
// or accidental edits.
const assert = require('assert');
const { readFileSync } = require('fs');
const { createHash } = require('crypto');
const path = require('path');

const root = path.resolve(__dirname, '..');
const fixture = require('./fixtures/photo-hashes.json');
const files = Object.keys(fixture.files);
assert.equal(files.length, 22, 'expected 10 full photos + 10 thumbnails + 2 rotation cursors');
for (const rel of files) {
  const bytes = readFileSync(path.join(root, rel));
  const actual = createHash('sha256').update(bytes).digest('hex');
  assert.equal(actual, fixture.files[rel], `${rel} no longer matches the verified hash`);
}
console.log(`photo-integrity: ok (${files.length} bundled asset files unchanged)`);
