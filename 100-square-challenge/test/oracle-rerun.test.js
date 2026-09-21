// SPDX-License-Identifier: AGPL-3.0-or-later
// The stored headless re-run of the original JAR (tools/oracle/rerun-output.txt)
// must agree, scenario by scenario, with the audit log the parity tests are
// written against (test/fixtures/oracle_original_jar.txt). No Java is needed.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function states(url) {
  const out = new Map();
  for (const line of readFileSync(url, 'utf8').split(/\r?\n/)) {
    const m = /^(T\d\d)\s.*?(used=.*)$/.exec(line);
    if (m) out.set(m[1], m[2].replace(/\s+/g, ' ').trim());
  }
  return out;
}

test('the headless re-run of the original JAR reproduces the audit oracle log', () => {
  const log = states(new URL('./fixtures/oracle_original_jar.txt', import.meta.url));
  const rerun = states(new URL('../tools/oracle/rerun-output.txt', import.meta.url));
  assert.equal(log.size, 15, 'the audit log has 15 scenarios');
  assert.deepEqual([...rerun.keys()], [...log.keys()], 'same scenarios in the same order');
  for (const [id, state] of log) assert.equal(rerun.get(id), state, `${id} differs`);
});
