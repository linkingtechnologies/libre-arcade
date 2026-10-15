// The package's own test suites (docs/development/package/tests, milestones M9 to M32, 349 tests), run unmodified against the code in
// public/. They expect the package's layout (index.html, src/, web/, data/, docs/, fixtures/ side by side), so this puts a copy of that
// layout together in a temporary directory: the package's files from docs/development/package, and the page and its modules from public/.
//
// These tests compare the port with what the package's authors read in the source and with recordings made by their private tracer
// (whose traces are not in the package). They do not run the original. The comparison with the original is test/rom-oracle.test.mjs.
import assert from 'node:assert/strict';
import test, { after, before } from 'node:test';
import { spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
let assembled;

before(() => {
  assembled = mkdtempSync(join(tmpdir(), 'zooming-secretary-package-'));
  cpSync(join(ROOT, 'docs', 'development', 'package'), assembled, { recursive: true });
  for (const name of ['index.html', 'web', 'src', 'data']) cpSync(join(ROOT, 'public', name), join(assembled, name), { recursive: true });
});

after(() => {
  if (assembled) rmSync(assembled, { recursive: true, force: true });
});

const runners = readdirSync(join(ROOT, 'docs', 'development', 'package', 'tests')).filter((f) => /^run-.*\.mjs$/.test(f)).sort();

// The cases of the package's tests that are expected to fail against public/, and why. Nothing else may fail.
//  - One case in each of the last six runners pins the bytes of the gameplay core ("byte-identical to the milestone before"): the package
//    froze that code as certified, and the comparison with the ROM changed it (docs/development/CHANGES.md, specs/port-map.md).
//  - Two cases of M25 check the exact words of the credits, which are now written in plain language (CHANGES.md).
//  - One case of M10 puts the Chief at x = 30 and expects him to slow the player; the program does not (the comparison with the ROM
//    found that its test of how near he is wraps below x = 32: specs/port-map.md).
//  - Two cases (M19, M20) look for the line `futureMissLimit=5` in the page: the Dream's reward is now added to the allowance (it is 2 each
//    time the Dream is won, as in the program), which is only different when the Dream is played again, and that the hidden code allows.
//  - Two cases of M31 look for the way the title screen used to advance the random generator (`titleRng.advanceTitleTicks(steps)`) and
//    for the constant of its 72-tick wait; the title screen is now the front end of the program (src/frontend.js: the same random numbers,
//    the hidden code, the sound test), compared with the ROM (specs/port-map.md).
const PINS = {
  'run-m10-tests.mjs': ['ZS-M10-011'],
  'run-m19-tests.mjs': ['ZS-M19-016'],
  'run-m20-tests.mjs': ['ZS-M20-017'],
  'run-m25-tests.mjs': ['ZS-M25-009', 'ZS-M25-010'],
  'run-m27-tests.mjs': ['ZS-M27-009'],
  'run-m28-tests.mjs': ['ZS-M28-010'],
  'run-m29-tests.mjs': ['ZS-M29-008'],
  'run-m30-tests.mjs': ['ZS-M30-009'],
  'run-m31-tests.mjs': ['ZS-M31-004', 'ZS-M31-005', 'ZS-M31-006'],
  'run-m32-tests.mjs': ['ZS-M32-011'],
};

test('the package has its 24 test runners', () => {
  assert.equal(runners.length, 24);
});

for (const runner of runners) {
  const pinned = PINS[runner] ?? [];
  test(`the package's ${runner} passes against public/${pinned.length ? `, except ${pinned.join(', ')} (see the header of this file)` : ''}`, () => {
    const result = spawnSync(process.execPath, [join(assembled, 'tests', runner)], { cwd: assembled, encoding: 'utf8' });
    const output = result.stdout + result.stderr;
    const failed = output.split(/\r?\n/).map((l) => /^FAIL (\S+)/.exec(l)?.[1]).filter(Boolean);
    assert.deepEqual(failed, pinned, `the cases that fail are not the ones expected:\n${output.split(/\r?\n/).filter((l) => /FAIL|Error/.test(l)).slice(0, 8).join('\n')}`);
    const lines = result.stdout.trim().split(/\r?\n/);
    const summary = [...lines].reverse().find((l) => /\d+\/\d+ .*passed/.test(l)) ?? lines.at(-1);
    const [, passed, total] = /(\d+)\/(\d+)/.exec(summary) ?? [];
    assert.equal(Number(passed), Number(total) - pinned.length, summary);
  });
}
