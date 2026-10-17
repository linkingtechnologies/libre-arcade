// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
// SPDX-License-Identifier: GPL-3.0-only

// What the page is checked against is itself checked: the source archive of the original is the one recorded, the data the page ships is the original's, and the
// package's own files are the ones its checksum list names. (The pictures are compared with the original's data files by tools/check-assets.mjs, which needs
// them unpacked; the sounds are compared here with the originals that the package kept.)
import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DATA_SHA256 } from '../tools/check-assets.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const walk = (dir) => readdirSync(dir).flatMap((name) => { const p = join(dir, name); return statSync(p).isDirectory() ? walk(p) : [p]; });

test('the source archive is Ri-li 2.0.1, as recorded', () => {
  assert.equal(sha256(readFileSync(join(ROOT, 'reference', 'Ri-li-2.0.1.tar.bz2'))), 'f71ccc20c37c601358d963e087ac0d524de8c68e96df09c3aac1ae65edd38dbd');
  const source = readFileSync(join(ROOT, 'reference', 'SOURCE.md'), 'utf8');
  assert.match(source, /f71ccc20c37c601358d963e087ac0d524de8c68e96df09c3aac1ae65edd38dbd/);
});

test('the levels the page loads are the original levels.dat', () => {
  assert.equal(sha256(readFileSync(join(ROOT, 'public', 'data', 'levels.dat'))), DATA_SHA256['levels.dat']);
});

test('every sprite frame of the manifest is a file of the right size, and every file is in the manifest', () => {
  const manifest = JSON.parse(readFileSync(join(ROOT, 'public', 'data', 'sprites.json'), 'utf8'));
  assert.equal(manifest.length, 2506);
  const listed = new Set();
  for (const m of manifest) {
    const file = join(ROOT, 'public', m.png);
    const head = readFileSync(file).subarray(0, 24);
    assert.equal(head.readUInt32BE(16), Number(m.width), `${m.png}: width`);
    assert.equal(head.readUInt32BE(20), Number(m.height), `${m.png}: height`);
    listed.add(m.png);
  }
  const files = walk(join(ROOT, 'public', 'assets')).map((p) => relative(join(ROOT, 'public'), p).split(sep).join('/'));
  assert.deepEqual(files.sort(), [...listed].sort());
});

test('the sound effects are the original WAV files, byte for byte (the package kept them next to the tracker originals)', () => {
  const originals = join(ROOT, 'docs', 'development', 'package', 'reference', 'audio-original');
  const wavs = readdirSync(originals).filter((n) => n.endsWith('.wav'));
  assert.equal(wavs.length, 9);
  for (const name of wavs) assert.equal(sha256(readFileSync(join(ROOT, 'public', 'audio', name))), sha256(readFileSync(join(originals, name))), name);
});

test('every file of the package\'s own folder is the one its checksum list names', () => {
  const dir = join(ROOT, 'docs', 'development', 'package');
  const recorded = new Map(readFileSync(join(dir, 'SHA256SUMS.txt'), 'utf8').split(/\r?\n/).filter(Boolean).map((line) => { const [hash, name] = line.split(/\s+\*?/); return [name.replace(/^\.\//, ''), hash]; }));
  // the page's own files and the archive live elsewhere in this repository (public/ and reference/); the list names them as the package had them
  const elsewhere = (name) => /^(index\.html|styles\.css|src\/|assets\/|audio\/|ui\/|data\/)/.test(name) || name === 'reference/Ri-li-2.0.1.tar.bz2' || name === 'reference/levels.dat';
  for (const [name, hash] of recorded) {
    if (elsewhere(name)) continue;
    const file = join(dir, name);
    assert.ok(existsSync(file), `${name} is named in the list and is missing`);
    assert.equal(sha256(readFileSync(file)), hash, name);
  }
  const files = walk(dir).map((p) => relative(dir, p).split(sep).join('/')).filter((n) => n !== 'SHA256SUMS.txt');
  for (const name of files) assert.ok(recorded.has(name), `${name} is not in the list`);
});

test('the page has the 19 languages of the original: a code, 79 pictures and a label for each, and the preferences take any of them', async () => {
  const { LANGUAGES, LABEL_NAMES } = await import('../public/src/languages.mjs');
  const { sanitizePrefs } = await import('../public/src/preferences.mjs');
  assert.equal(LANGUAGES.length, 19);
  assert.equal(new Set(LANGUAGES).size, 19);
  assert.deepEqual(readdirSync(join(ROOT, 'public', 'ui')).filter((n) => n !== 'lang').sort(), [...LANGUAGES].sort());
  assert.deepEqual(readdirSync(join(ROOT, 'public', 'ui', 'lang')).sort(), LANGUAGES.map((c) => `${c}.png`).sort());
  for (const code of LANGUAGES) {
    assert.deepEqual(readdirSync(join(ROOT, 'public', 'ui', code)).sort(), LABEL_NAMES.map((n) => `${n}.png`).sort(), code);
    assert.equal(sanitizePrefs({ language: code }).language, code);
  }
  assert.equal(sanitizePrefs({ language: 'xx' }).language, 'it');
});
