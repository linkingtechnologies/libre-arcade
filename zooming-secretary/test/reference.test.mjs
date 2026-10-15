// The record of the original (reference/): that it says what the oracle uses, that it agrees with itself and with the package's own record,
// and that no byte of the original is kept in the repository.
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { RAM_MAP, ROM_SHA256 } from '../tools/ram-map.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

test('the ROM the oracle accepts is the one the record names, and the one the package certified', () => {
  const lines = read('reference/ORIGINAL_SHA256.txt').trim().split(/\r?\n/);
  const [hash, size, name] = lines[0].split(/\s+/);
  assert.equal(name, 'Zooming_Secretary.nes');
  assert.equal(Number(size), 40976);
  assert.equal(hash, ROM_SHA256);
  assert.match(read('reference/SOURCE.md'), new RegExp(ROM_SHA256.slice(0, 8)));
  const manifest = JSON.parse(read('docs/development/package/reference/manifest.json'));
  assert.equal(manifest.baseline.rom_sha256, ROM_SHA256);
  assert.match(manifest.baseline.release, /v1\.02, 30\.12\.11/);
});

test('the release archive that was read is the one the package recorded for its own copy', () => {
  const manifest = JSON.parse(read('docs/development/package/reference/manifest.json'));
  const line = read('reference/ORIGINAL_SHA256.txt').trim().split(/\r?\n/).find((l) => l.endsWith('ia/zooming_secretary.zip'));
  assert.equal(line.split(/\s+/)[0], manifest.baseline.release_zip_sha256);
});

test('the record lists every file of the original that was used or read, once, with its size', () => {
  const names = read('reference/ORIGINAL_SHA256.txt').trim().split(/\r?\n/).map((l) => l.split(/\s+/)[2]);
  assert.deepEqual(names, ['Zooming_Secretary.nes', 'notes.txt', ...['compile.bat', 'crt0.s', 'game.c', 'memmap.inc', 'nes.cfg', 'neslib.h', 'neslib.s', 'npc.h'].map((f) => `zooming_secretary_src/${f}`),
    'ia/zooming_secretary.zip', 'ia/zooming_secretary_src.zip', 'ia/zooming_secretary/manual.pdf', 'ia/zooming_secretary/label_nes.png']);
  for (const line of read('reference/ORIGINAL_SHA256.txt').trim().split(/\r?\n/)) assert.match(line, /^[0-9a-f]{64}\s+\d+\s+\S+$/);
  assert.equal(new Set(names).size, names.length);
});

test('the record says where the original comes from, what is known about its licence, and what is not', () => {
  const s = read('reference/SOURCE.md');
  for (const needle of ['OpenEmu/OpenEmu-Update', 'ee1dc820f1e0e45a1b223fa1d2c8443e8b10f213', 'Creative Commons', 'version', 'v1.02, 30.12.11', 'archive.org/details/zooming_secretary', 'c61863bed7961dbba4ee02c20a5c2d3fa96ad0c746a638618f5132b58ab9eea9', 'version not stated']) assert.ok(s.includes(needle), needle);
});

test('the table of the ROM\'s variables is the one the source declares, in order, from the one array that can be found without it', () => {
  const byName = new Map(RAM_MAP.map(([name, address, size, count]) => [name, { address, size, count }]));
  assert.equal(byName.get('map').address, 0x347);
  assert.equal(byName.get('map').size * byName.get('map').count, 704);
  // consecutive declarations are consecutive in memory
  let expected = RAM_MAP[0][1];
  for (const [name, address, size, count] of RAM_MAP) { assert.equal(address, expected, `${name} is not where the one before it ends`); expected += size * count; }
  assert.equal(expected, 0x6fe);
});

test('no byte of the original is in the repository: no ROM, no CHR sheet, no tracker file, none of its source files', () => {
  const skip = new Set(['node_modules', '.git']);
  const found = [];
  (function walk(dir) {
    for (const name of readdirSync(dir)) {
      if (skip.has(name)) continue;
      const full = join(dir, name);
      if (statSync(full).isDirectory()) walk(full);
      else {
        const r = relative(ROOT, full).replaceAll('\\', '/');
        if (['.nes', '.chr', '.ftm', '.fms', '.pdf'].includes(extname(full)) || /^(game\.c|npc\.h|neslib\.(s|h)|crt0\.s)$/.test(name)) found.push(r);
        else if (!/\.(js|mjs|json|md|txt|html|css|png)$/.test(name) && !['.gitattributes', '.gitignore', 'LICENSE'].includes(name)) found.push(`${r} (an unexpected kind of file)`);
      }
    }
  })(ROOT);
  assert.deepEqual(found.filter((f) => !f.endsWith('.png') && !f.startsWith('screenshots/') && !f.startsWith('LICENSE')), []);
});
