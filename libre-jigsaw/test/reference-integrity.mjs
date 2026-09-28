// SPDX-License-Identifier: GPL-3.0-or-later
// Verifies the preserved upstream archives in reference/ against their
// recorded SHA-256, the way `sha256sum -c reference/SHA256SUMS.txt` would.
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const manifest = readFileSync(new URL('../reference/SHA256SUMS.txt', import.meta.url), 'utf8');
let checked = 0;
for (const line of manifest.split(/\r?\n/)) {
  if (!line.trim()) continue;
  const m = /^([0-9a-f]{64})\s+(.+)$/.exec(line.trim());
  if (!m) throw new Error(`unparsable manifest line: ${line}`);
  const [, expected, name] = m;
  const bytes = readFileSync(new URL(`../reference/${name}`, import.meta.url));
  const actual = createHash('sha256').update(bytes).digest('hex');
  if (actual !== expected) throw new Error(`${name}: expected ${expected}, got ${actual}`);
  checked++;
}
if (checked !== 3) throw new Error(`expected 3 preserved archives, checked ${checked}`);
console.log(`reference-integrity: OK (${checked} archives match reference/SHA256SUMS.txt)`);
