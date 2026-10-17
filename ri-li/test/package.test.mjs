// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
// SPDX-License-Identifier: GPL-3.0-only

// The restoration package's own tests (docs/development/package/test and /tests), run on the files this folder ships. They are the package's, kept as they were. They want the
// package's layout (index.html, src/, data/ and the rest beside test/ and reference/), so the files are copied into a temporary folder in that layout first.
// Eight of the twelve still pass, among them the one that compares the page with the original's own trace of level 1 (the package recorded it from a C++ run of its own
// that is not part of the package: the oracle in tools/ plays the original again, on many more cases). Four no longer pass, each for the reason below: they describe the
// page as the package had it, and the page has been changed where the original showed it was wrong (docs/development/CHANGES.md). If one fails for another reason,
// or one of the four passes, this test says so.
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
  dir = mkdtempSync(join(tmpdir(), 'rili-package-'));
  cpSync(join(ROOT, 'docs', 'development', 'package'), dir, { recursive: true });
  for (const name of ['index.html', 'styles.css']) copyFileSync(join(ROOT, 'public', name), join(dir, name));
  for (const folder of ['src', 'assets', 'audio', 'ui']) cpSync(join(ROOT, 'public', folder), join(dir, folder), { recursive: true });
  mkdirSync(join(dir, 'data'), { recursive: true });
  copyFileSync(join(ROOT, 'public', 'data', 'sprites.json'), join(dir, 'data', 'sprites.json'));
});
after(() => { if (dir) rmSync(dir, { recursive: true, force: true }); });

const run = (file) => spawnSync(process.execPath, [join(dir, file)], { cwd: dir, encoding: 'utf8', timeout: 600000 });
const errorLine = (result) => result.stderr.split('\n').find((l) => /Error/.test(l)) ?? result.stderr.slice(0, 300);

for (const file of ['test/parity_cpp.mjs', 'test/all_levels_render.mjs', 'test/assets.mjs', 'test/soak_all_levels.mjs', 'tests/test_preferences.mjs', 'tests/test_renderer_ui.mjs',
  'tests/test_publication_shell.mjs', 'tests/test_audio_manager.mjs']) {
  test(`the package's ${file} still passes`, () => {
    const result = run(file);
    assert.equal(result.status, 0, errorLine(result));
  });
}

// the tests that no longer pass, and the error each stops at
const CHANGED = {
  'test/progression.mjs': ['level2 playing: quiz_result != playing', 'it steps the session by the frame in which the quiz ends and the next level is loaded; the original does that after the frame is drawn, one frame later'],
  'test/campaign.mjs': ['level 1 enters quiz: "playing" != "quiz"', 'it expects the quiz to start in the frame in which the pause after the last wagon ends; the original starts it in the next one'],
  'test/playthrough_all_levels.mjs': ['level 3: illegal decision 1 at 3, choices 2,3', 'it replays the package\'s routes through the 50 levels in one session, with the arithmetic of the package\'s core; 14 of the 50 routes do not hold when the core does what the original does'],
  'tests/test_app_smoke.mjs': ['Error: unexpected fetch data/levels.dat', 'it answers a request for reference/levels.dat; the page now asks for data/levels.dat, which is inside public/'],
};
for (const [file, [message, why]] of Object.entries(CHANGED)) {
  test(`the package's ${file} fails, as it should: ${why}`, () => {
    const result = run(file);
    assert.notEqual(result.status, 0, 'it passes now: take it out of the list of changed tests');
    assert.ok(result.stderr.includes(message), `it fails, but not with "${message}": ${errorLine(result)}`);
  });
}
