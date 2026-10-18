// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
// SPDX-License-Identifier: GPL-3.0-only

// The record of where the code comes from. Two sets of the original's files are kept:
//  - reference/original/ is commit 13afa12, the last of 1 December 2013, which the game follows (reference/ORIGINAL_SHA256.txt);
//  - reference/package-baseline/ is commit 56bcde6, which the restoration package followed (reference/package-baseline/SHA256.txt), whose blob IDs
//    agree with the ones the package recorded in its own SOURCE.md.
// Each file is checked by SHA-256, git blob SHA-1 and size. The page's files in public/ are compared with the package's own (docs/development/package/game/src):
// two are byte for byte the package's, the others are listed in docs/development/CHANGES.md.
import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p));
const sha256 = (b) => createHash('sha256').update(b).digest('hex');
const blobSha1 = (b) => createHash('sha1').update(Buffer.concat([Buffer.from(`blob ${b.length}\0`), b])).digest('hex');

const parse = (path) => read(path).toString('utf8').split('\n').filter((l) => l && !l.startsWith('#'))
  .map((l) => { const [s256, s1, size, file] = l.trim().split(/\s+/); return { s256, s1, size: Number(size), file }; });

const NINE = ['LICENSE', 'README.md', 'index.html', 'js/dialogue.js', 'js/main.js', 'js/model.js', 'js/screens.js', 'js/soundmanager.js', 'js/ui.js'];
const SETS = [
  { name: 'reference/original', dir: 'reference/original', record: parse('reference/ORIGINAL_SHA256.txt') },
  { name: 'reference/package-baseline', dir: 'reference/package-baseline', record: parse('reference/package-baseline/SHA256.txt') },
];

for (const { name, dir, record } of SETS) {
  test(`${name}: the record lists the nine files kept from the original`, () => {
    assert.deepEqual(record.map((r) => r.file), NINE);
  });

  for (const r of record) {
    test(`${name}/${r.file} is what the record says`, () => {
      const b = read(`${dir}/${r.file}`);
      assert.equal(b.length, r.size);
      assert.equal(sha256(b), r.s256);
      assert.equal(blobSha1(b), r.s1);
    });
  }

  test(`${name}: the original is GPL version 3, and no file kept says "or later"`, () => {
    assert.match(read(`${dir}/LICENSE`).toString('utf8'), /GNU GENERAL PUBLIC LICENSE\s+Version 3, 29 June 2007/);
    for (const r of record.filter((x) => x.file !== 'LICENSE')) {
      assert.ok(!/or any later version|or \(at your option\) any later|or later/i.test(read(`${dir}/${r.file}`).toString('utf8')), r.file);
    }
  });
}

test("the package baseline's blob IDs agree with the ones in the package's own record (docs/development/package/game/reference/SOURCE.md)", () => {
  const source = read('docs/development/package/game/reference/SOURCE.md').toString('utf8');
  for (const r of SETS[1].record.filter((x) => x.file !== 'index.html')) {
    assert.ok(source.includes(`\`${r.file}\` | \`${r.s1}\``), `${r.file}: ${r.s1} is not in the package's SOURCE.md`);
  }
});

test('the two sets differ in the files the authors changed on 1 December 2013, and in no others', () => {
  const [now, before] = SETS.map((s) => new Map(s.record.map((r) => [r.file, r.s1])));
  const changed = NINE.filter((f) => now.get(f) !== before.get(f));
  assert.deepEqual(changed, ['README.md', 'js/main.js', 'js/model.js', 'js/screens.js', 'js/ui.js']);
});

test("the page's files are the package's where docs/development/CHANGES.md says so, and changed where it says so", () => {
  const sums = read('docs/development/package/game/SHA256SUMS').toString('utf8').split('\n').filter(Boolean)
    .map((l) => { const [hash, path] = l.split(/\s+/); return [hash, path.replace(/^\.\/src\//, '')]; })
    .filter(([, p]) => !p.startsWith('.') && !p.includes('/docs') && /\.(js|css|html)$/.test(p) && (p === 'index.html' || p.startsWith('css/') || p.startsWith('js/')));
  assert.equal(sums.length, 8);
  const unchanged = [];
  for (const [hash, p] of sums) if (sha256(read(`public/${p}`)) === hash) unchanged.push(p);
  assert.deepEqual(unchanged.sort(), ['css/app.css', 'js/game-session.js']);
});

test('the full GPL v3 text is the licence of the game', () => {
  const license = read('LICENSE').toString('utf8');
  assert.match(license, /GNU GENERAL PUBLIC LICENSE\s+Version 3, 29 June 2007/);
  assert.ok(license.length > 34000);
});
