// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
// SPDX-License-Identifier: GPL-3.0-only

// The restoration package's own test scripts (docs/development/package/archaeology/tests, milestones M1 to M12, summarised in
// docs/development/MILESTONES.md), run unmodified against the package's own page and modules (docs/development/package/game/src, which is
// the port of the original's earlier commit 56bcde6 and is not what public/ runs any more). They are plain scripts, not a test framework:
// each stops at its first failed assertion, and they expect the package's layout (game/ with src/ beside tests/, and the sibling folders of
// earlier milestones). This puts a copy of that layout together in a temporary directory, with copies of the core modules as the sibling
// folders that M8, M9 and M10 read.
//
// What is expected, and why (every other runner must pass completely):
//  - M1 stops at T03: its recorded oracle (archaeology/tests/oracle.json) holds a cook-condition fraction that differs from the port's in the
//    last binary digit (0.20471953130718815 against 0.20471953130718826, skin of a 10 lb turkey at 425 F after 2 hours). The original's own
//    model.js of that commit, run next to the package's port in the same process, gives the port's value exactly
//    (test/package-baseline-oracle.test.mjs), so the port is not what differs: the recorded number was made on another machine, and JavaScript
//    engines can round Math.pow, Math.exp and Math.sin one unit in the last place apart. M1 compares exactly. T01 and T02 pass before it.
//  - M12 passes 16 of its 18 checks: R17 and R18 look in the package's README for "Manual browser QA checklist" and "RC1", which that README
//    no longer says (it was rewritten after the test was last recorded as 18/18).
//  - M11 is not run: it reads /mnt/data/turkey-cooking-simulator-m10 (a folder of the package author's machine) and builds file paths from
//    a file URL's pathname, which does not work on Windows.
import assert from 'node:assert/strict';
import test, { after, before } from 'node:test';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PACKAGE = join(ROOT, 'docs', 'development', 'package');
const CORE = ['thermal-model.js', 'runtime.js', 'gameplay-state.js', 'game-session.js'];

let base;
let layout;

before(() => {
  base = mkdtempSync(join(tmpdir(), 'turkey-package-'));
  layout = join(base, 'turkey-cooking-simulator');
  mkdirSync(join(layout, 'tests'), { recursive: true });
  cpSync(join(PACKAGE, 'archaeology', 'tests'), join(layout, 'tests'), { recursive: true });
  cpSync(join(PACKAGE, 'game'), layout, { recursive: true });
  for (const milestone of ['m8', 'm9', 'm10']) {
    const dir = join(base, `turkey-cooking-simulator-${milestone}`, 'src', 'js');
    mkdirSync(dir, { recursive: true });
    for (const f of CORE) cpSync(join(PACKAGE, 'game', 'src', 'js', f), join(dir, f));
  }
});

after(() => {
  if (base) rmSync(base, { recursive: true, force: true });
});

function run(name) {
  const r = spawnSync(process.execPath, [join('tests', `${name}.test.js`)], { cwd: layout, encoding: 'utf8', timeout: 600000 });
  return { status: r.status, passes: (r.stdout.match(/^PASS /gm) ?? []).length, stdout: r.stdout, stderr: r.stderr };
}

test("the package's src/ is what its own SHA256SUMS says", () => {
  const sums = readFileSync(join(PACKAGE, 'game', 'SHA256SUMS'), 'utf8').split('\n').filter(Boolean).map((l) => l.split(/\s+/));
  const files = sums.filter(([, p]) => p.startsWith('./src/'));
  assert.equal(files.length, 8);
  for (const [hash, p] of files) assert.equal(createHash('sha256').update(readFileSync(join(PACKAGE, 'game', p))).digest('hex'), hash, p);
});

// [runner, PASS lines it prints, exit status]
const EXPECTED = [
  ['m2', 10, 0], ['m3', 12, 0], ['m4', 14, 0], ['m5', 12, 0], ['m6', 12, 0],
  ['m7', 14, 0], ['m8', 15, 0], ['m9', 16, 0], ['m10', 18, 0],
];
for (const [name, passes, status] of EXPECTED) {
  test(`the package's ${name} passes against the package's src/ (${passes} checks)`, () => {
    const r = run(name);
    assert.equal(r.status, status, r.stderr.slice(0, 600));
    assert.equal(r.passes, passes);
  });
}

test("the package's m1 stops at T03 (its recorded oracle differs in the last digit; T01 and T02 pass first)", () => {
  const r = run('m1');
  assert.notEqual(r.status, 0);
  assert.equal(r.passes, 2);
  assert.match(r.stderr, /T03\.skin\.condition/);
});

test("the package's m12 passes 16 of 18; R17 and R18 fail against its own README", () => {
  const r = run('m12');
  assert.notEqual(r.status, 0);
  assert.equal(r.passes, 16);
  const failed = [...r.stderr.matchAll(/^FAIL (R\d+) /gm)].map((m) => m[1]);
  assert.deepEqual(failed, ['R17', 'R18']);
});
