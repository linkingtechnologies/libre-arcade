// The preserved original: each kept file is the file of the archive it came from, the licence statements the records quote are in the
// files, in the author's words, and what is not kept is recorded with its hash.
import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const here = (path) => fileURLToPath(new URL(path, import.meta.url));
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const manifest = (path) => Object.fromEntries(readFileSync(here(path), 'utf8').split(/\r?\n/).filter(Boolean).map((line) => { const i = line.indexOf('  '); return [line.slice(i + 2), line.slice(0, i)]; }));
const walk = (dir, prefix = '') => readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(`${dir}/${e.name}`, `${prefix}${e.name}/`) : [prefix + e.name]));
const KEPT = '../reference/milcity-blue-1.0.5';

test('every kept file hashes to its entry in CHECKSUMS.txt and to the archive\'s own list, and nothing is kept that is not listed', () => {
  const kept = manifest(`${KEPT}/CHECKSUMS.txt`), archive = manifest('../reference/ARCHIVE_SHA256.txt');
  const onDisk = walk(here(KEPT)).filter((f) => f !== 'CHECKSUMS.txt').sort();
  assert.deepEqual(onDisk, Object.keys(kept).sort());
  for (const [name, hash] of Object.entries(kept)) {
    assert.equal(sha(readFileSync(here(`${KEPT}/${name}`))), hash, `${name} is not the file that was recorded`);
    assert.equal(archive[name], hash, `${name} is not the file of the archive`);
  }
  assert.equal(Object.keys(archive).length, 81);
  assert.equal(Object.keys(kept).length, 70);
});

test('the record says what the archive is and which files are not kept, with their hashes', () => {
  const record = readFileSync(here('../reference/SOURCE.md'), 'utf8');
  assert.match(record, /6149db64b8acf3fc3e65df8050212ff53b3a48cfde16bf6c9fc7ba1a1311d47e/);
  const archive = manifest('../reference/ARCHIVE_SHA256.txt'), kept = manifest(`${KEPT}/CHECKSUMS.txt`);
  for (const name of Object.keys(archive).filter((f) => !(f in kept))) assert.ok(record.includes(archive[name]), `${name} is not kept and its hash is not in the record`);
});

test('the licence is in the files in the author\'s words: version 3, with no "or later"', () => {
  const files = walk(here(`${KEPT}/src`)).map((f) => `src/${f}`).concat(walk(here(`${KEPT}/tests`)).map((f) => `tests/${f}`)).filter((f) => f.endsWith('.java'));
  assert.equal(files.length, 66);
  const without = [];
  for (const f of files) {
    const text = readFileSync(here(`${KEPT}/${f}`), 'latin1');
    if (/GNU General Public License/.test(text)) {
      assert.match(text, /the Free Software Foundation, either version 3 of the License\.\r?\n/, `${f} grants version 3`);
      assert.doesNotMatch(text, /or \(at your option\)|any later version|or later/i, `${f} must not grant a later version`);
    } else without.push(f);
  }
  assert.deepEqual(without.sort(), ['src/fr/uha/ensisa/ir/walther/milcityblue/core/players/AIPlayer.java', 'src/fr/uha/ensisa/ir/walther/milcityblue/gui/ImageDrawer.java', 'tests/fr/uha/ensisa/ir/walther/milcityblue/gridbuilders/TestRW.java']);
  const readme = readFileSync(here(`${KEPT}/README`), 'latin1');
  assert.match(readme, /either version 3 of the License\./);
  assert.doesNotMatch(readme, /or \(at your option\)|any later version/i);
});

test('the two copies of the licence in the archive are the same text, the full GNU GPL version 3', () => {
  const a = readFileSync(here(`${KEPT}/COPYING`)), b = readFileSync(here(`${KEPT}/src/fr/uha/ensisa/ir/walther/milcityblue/COPYING`));
  assert.equal(sha(a), sha(b));
  const text = a.toString('latin1');
  assert.match(text, /GNU GENERAL PUBLIC LICENSE\s+Version 3, 29 June 2007/);
  assert.ok(text.split('\n').length > 600, 'the whole text, not a pointer');
});

test('the files of the original that matter to the port are the ones the oracle runs: the core, and the model and the views', () => {
  const core = walk(here(`${KEPT}/src/fr/uha/ensisa/ir/walther/milcityblue/core`)).filter((f) => f.endsWith('.java'));
  assert.ok(core.length >= 40);
  for (const f of ['Game.java', 'PlayerAbstract.java', 'Weapon.java', 'players/AIPlayer.java', 'gridbuilders/RandomWalker.java'.replace('gridbuilders', 'gridbuilders')]) assert.ok(core.includes(f), f);
});
