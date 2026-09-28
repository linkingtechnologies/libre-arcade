// SPDX-License-Identifier: GPL-3.0-or-later
// Verifies the preserved upstream archives in reference/ against their
// recorded SHA-256, the way `sha256sum -c reference/SHA256SUMS.txt` would.
const assert = require('assert');
const { readFileSync } = require('fs');
const { createHash } = require('crypto');
const path = require('path');

const root = path.resolve(__dirname, '..');
const manifest = readFileSync(path.join(root, 'reference/SHA256SUMS.txt'), 'utf8');
let checked = 0;
for (const line of manifest.split(/\r?\n/)) {
  if (!line.trim()) continue;
  const m = /^([0-9a-f]{64})\s+(.+)$/.exec(line.trim());
  if (!m) throw new Error(`unparsable manifest line: ${line}`);
  const [, expected, name] = m;
  const bytes = readFileSync(path.join(root, 'reference', name));
  const actual = createHash('sha256').update(bytes).digest('hex');
  assert.equal(actual, expected, `${name}: expected ${expected}, got ${actual}`);
  checked++;
}
assert.equal(checked, 3, 'expected 3 preserved archives');
console.log(`reference-integrity: ok (${checked} archives match reference/SHA256SUMS.txt)`);
