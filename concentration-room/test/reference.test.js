// The preserved original (reference/ConcentrationRoom-0.02) is frozen: every file kept there still hashes to CHECKSUMS.txt, and to the
// value the archive's own file list gives. The two tile atlases the game draws from are byte for byte the archive's.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { ROOT } from '../tools/rom-oracle.mjs';

const ref = join(ROOT, 'reference', 'ConcentrationRoom-0.02');
const sha = (path) => createHash('sha256').update(readFileSync(path)).digest('hex');
const rows = (name) => readFileSync(join(ref, name), 'utf8').split(/\r?\n/).filter(Boolean).map((line) => { const [hash, ...rest] = line.split(/\s+/); return [rest.join(' ').replace(/^\*/, ''), hash]; });

const archive = new Map(rows('ARCHIVE_SHA256.txt'));
assert.equal(archive.size, 39, 'the archive holds 39 files');
assert.match(readFileSync(join(ref, 'SOURCE.md'), 'utf8'), /0e9773924b5d8b53d727f3359b62f3730ec95f139d64242236cb9ec28f871566/, 'SOURCE.md names the archive');

// every kept file matches CHECKSUMS.txt, and the archive's list (the ROM sat at the top level of the archive, the rest under source/)
const kept = rows('CHECKSUMS.txt');
assert.equal(kept.length, 34);
for (const [name, hash] of kept) {
  assert.equal(sha(join(ref, name)), hash, `${name} changed`);
  const inArchive = name.startsWith('source/') ? name.slice('source/'.length) : name === 'release/croom.nes' ? 'croom.nes' : name;
  assert.equal(archive.get(inArchive), hash, `${name} is not the archive's file`);
}

// nothing else lives in the reference folder
const onDisk = [];
(function walk(dir) { for (const entry of readdirSync(dir)) { const path = join(dir, entry); if (statSync(path).isDirectory()) walk(path); else onDisk.push(relative(ref, path).split('\\').join('/')); } })(ref);
const allowed = new Set([...kept.map(([name]) => name), 'CHECKSUMS.txt', 'ARCHIVE_SHA256.txt', 'SOURCE.md']);
assert.deepEqual(onDisk.filter((name) => !allowed.has(name)), [], 'unexpected files in the preserved original');

// the two atlases the game draws from are the archive's
for (const name of ['gamegfx.png', 'titlegfx.png']) {
  assert.equal(sha(join(ROOT, 'public', 'assets', 'original', name)), archive.get(`tilesets/${name}`), `${name} is not the archive's file`);
}

// no archive, ROM or illustration of the original is shipped in public/
const shipped = [];
(function walk(dir) { for (const entry of readdirSync(dir)) { const path = join(dir, entry); if (statSync(path).isDirectory()) walk(path); else shipped.push(relative(join(ROOT, 'public'), path).split('\\').join('/')); } })(join(ROOT, 'public'));
assert.deepEqual(shipped.filter((name) => /\.(nes|zip|jar)$/i.test(name)), []);
for (const name of ['Hombon_logo.png', 'croomlogo320.png', 'croom_screenshot01.png']) {
  const hash = archive.get(`docs/${name}`);
  assert.ok(hash, `${name} is listed in the archive`);
  for (const file of shipped.filter((f) => f.endsWith('.png'))) assert.notEqual(sha(join(ROOT, 'public', file)), hash, `${file} is the archive's ${name}`);
}
assert.ok(existsSync(join(ROOT, 'LICENSE')));

console.log('All Concentration Room reference checks passed.');
