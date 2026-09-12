import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const sourceDir = path.join(root, 'reference', 'postcompo-1.0.1', 'game', 'data');
const browserDir = path.join(root, 'public', 'assets', 'original');

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

test('browser original assets are byte-identical copies of the 1.0.1 reference data', async () => {
  const sourceNames = (await readdir(sourceDir)).sort();
  const browserNames = (await readdir(browserDir)).sort();

  assert.deepEqual(browserNames, sourceNames, 'asset copy must have exactly the reference filenames');
  assert.equal(sourceNames.length, 35, 'expected upstream 1.0.1 data file count');

  for (const name of sourceNames) {
    const [source, browser] = await Promise.all([
      readFile(path.join(sourceDir, name)),
      readFile(path.join(browserDir, name)),
    ]);
    assert.equal(sha256(browser), sha256(source), `${name} must remain byte-identical`);
  }
});
