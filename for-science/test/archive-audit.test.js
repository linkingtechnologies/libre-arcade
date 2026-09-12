import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';

const expected = {
  'reference/archives/forscience-final2.tar.gz': '5f2911c20a6483e1c9b1ecb9b378882ec4e5a737e6169f461a16af194be60d4d',
  'reference/archives/forscience-1.0.1.tar.gz': 'a1102b97f4ab5acbc6e06f7de97a768c6991e4b15aac549f7d6cfdc9d90c2deb',
};

for (const [path, digest] of Object.entries(expected)) {
  test(`${path} is preserved byte-for-byte`, () => {
    const actual = crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');
    assert.equal(actual, digest);
  });
}

function verifyTree(treeDir, manifestPath) {
  const manifest = fs.readFileSync(manifestPath, 'utf8').trim().split(/\r?\n/);
  for (const line of manifest) {
    const match = line.match(/^([0-9a-f]{64}) {2}\.\/(.+)$/);
    assert.ok(match, `invalid checksum line: ${line}`);
    const [, expectedDigest, relative] = match;
    const fullPath = `${treeDir}/${relative}`;
    assert.ok(fs.existsSync(fullPath), `missing preserved file: ${fullPath}`);
    const actual = crypto.createHash('sha256').update(fs.readFileSync(fullPath)).digest('hex');
    assert.equal(actual, expectedDigest, `preserved file changed: ${fullPath}`);
  }
}

test('expanded PyWeek final2 reference tree matches its preservation manifest', () => {
  verifyTree('reference/pyweek-final2', 'reference/pyweek-final2.SHA256SUMS');
});

test('expanded post-compo 1.0.1 reference tree matches its preservation manifest', () => {
  verifyTree('reference/postcompo-1.0.1', 'reference/postcompo-1.0.1.SHA256SUMS');
});
