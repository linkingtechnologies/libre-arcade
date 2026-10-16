// The restoration package's own tests (docs/development/package/tests), run on the files this folder ships.
// They are the package's, kept as they were. They want the package's layout (index.html and src/ beside tests/ and reference/), so the files are copied into
// a temporary folder in that layout first, with the author's ROM where the package keeps its own copy.
// Five of them still pass. Six no longer do, each for the reason below: they describe the page as the package had it, and the page has been
// changed where the ROM showed it was wrong (docs/development/CHANGES.md). If one fails for another reason, or one of the six passes, this test says so.
import assert from 'node:assert/strict';
import test, { before, after } from 'node:test';
import { cpSync, copyFileSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
let dir;

before(() => {
  dir = mkdtempSync(join(tmpdir(), 'lan-master-package-'));
  cpSync(join(ROOT, 'docs', 'development', 'package'), dir, { recursive: true });
  copyFileSync(join(ROOT, 'public', 'index.html'), join(dir, 'index.html'));
  cpSync(join(ROOT, 'public', 'src'), join(dir, 'src'), { recursive: true });
  mkdirSync(join(dir, 'reference'), { recursive: true });
  copyFileSync(join(ROOT, 'reference', 'release', 'Lan_Master.nes'), join(dir, 'reference', 'Lan_Master.nes'));
});
after(() => { if (dir) rmSync(dir, { recursive: true, force: true }); });

const run = (name) => spawnSync(process.execPath, [join(dir, 'tests', `${name}.js`)], { cwd: dir, encoding: 'utf8' });

for (const name of ['test-core', 'test-gfx', 'test-audio', 'test-transitions', 'test-m13-ui']) {
  test(`the package's ${name} still passes`, () => {
    const result = run(name);
    assert.equal(result.status, 0, result.stderr.split('\n').find((l) => l.startsWith('Error')) ?? result.stderr.slice(0, 300));
  });
}

// the tests that no longer pass, and the line of the error each stops at
const CHANGED = {
  'test-integration': ['timeout delay', 'it checks the time out as the package had it (a delay of 50 frames at once); the ROM waits two frames, traces once more, waits 50, then another, then shows the table'],
  'test-m11-integration': ['50-frame level-clear glow', 'it checks the clear animation as the package had it (the glow of the computers by a set); the ROM redraws four computers a frame, after two frames of its own'],
  'test-production': ['broken local reference data:,', 'it takes the page\'s empty icon (`<link rel="icon" href="data:,">`, which stops the browser asking for a favicon) for a file that is not there'],
  'test-m14-release': ['M13 frozen payload changed: index.html', 'it freezes the files of an earlier release by their SHA-256'],
  'test-m15-release': ['frozen production payload changed: index.html', 'it freezes the files of the release by their SHA-256'],
  'test-m16-release': ['M16 changed frozen runtime/reference file: index.html', 'it freezes the files of the release by their SHA-256'],
};
for (const [name, [message, why]] of Object.entries(CHANGED)) {
  test(`the package's ${name} fails, as it should: ${why}`, () => {
    const result = run(name);
    assert.notEqual(result.status, 0, 'it passes now: take it out of the list of changed tests');
    assert.ok(result.stderr.includes(`Error: ${message}`), `it fails, but not with "${message}": ${result.stderr.split('\n').find((l) => l.startsWith('Error')) ?? result.stderr.slice(0, 300)}`);
  });
}
