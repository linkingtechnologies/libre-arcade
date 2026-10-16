// What the game is checked against is itself checked: the author's ROM and source are the files recorded, the source assembles to that ROM bit for bit,
// the table of the ROM's variables says what the source says, and the licence words the documents quote are in the source.
import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assembleSource } from '../tools/assemble.mjs';
import { RAM_MAP, ROM_SHA256 } from '../tools/ram-map.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const REF = join(ROOT, 'reference');
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const rom = new Uint8Array(readFileSync(join(REF, 'release', 'Lan_Master.nes')));

function walk(dir) {
  return readdirSync(dir).flatMap((name) => { const p = join(dir, name); return statSync(p).isDirectory() ? walk(p) : [p]; });
}

test('the ROM is the author\'s v1.09: its SHA-256, its header, its version string', () => {
  assert.equal(sha256(rom), ROM_SHA256);
  assert.deepEqual([...rom.subarray(0, 8)], [0x4e, 0x45, 0x53, 0x1a, 2, 1, 1, 0], 'iNES: two 16 KiB program banks, one 8 KiB character bank, vertical mirroring, mapper 0');
  assert.equal(rom.length, 16 + 32768 + 8192);
  assert.match(Buffer.from(rom).toString('latin1'), /Lan Master v1\.09 14\.06\.11/);
});

test('every file of reference/ is the one recorded in SHA256SUMS.txt, and every file is recorded', () => {
  const recorded = new Map(readFileSync(join(REF, 'SHA256SUMS.txt'), 'utf8').split(/\r?\n/).filter(Boolean).map((line) => { const [hash, name] = line.split(/\s+\*?/); return [name, hash]; }));
  const files = walk(REF).map((p) => relative(REF, p).split(sep).join('/')).filter((name) => name.startsWith('release/') || name.startsWith('source/'));
  assert.deepEqual(files.sort(), [...recorded.keys()].sort());
  for (const name of files) assert.equal(sha256(readFileSync(join(REF, name))), recorded.get(name), name);
});

test('the author\'s source, assembled by tools/assemble.mjs, is the ROM, bit for bit', () => {
  const { rom: built, assembler } = assembleSource(join(REF, 'source'));
  assert.equal(built.length, rom.length);
  assert.ok(built.every((b, i) => b === rom[i]), 'the bytes differ');
  assert.ok(Object.keys(assembler.labels()).length > 300, 'the labels of the source');
});

test('the table of the ROM\'s variables (tools/ram-map.mjs) says what the source\'s own equates say', () => {
  const { assembler } = assembleSource(join(REF, 'source'));
  const labels = assembler.labels();
  for (const [name, address] of RAM_MAP) {
    assert.ok(name in labels, `${name} is not in the source`);
    assert.equal(labels[name], address, name);
  }
});

test('the words the documents quote about the licence are in the source', () => {
  const game = readFileSync(join(REF, 'source', 'game.asm'), 'latin1');
  const famitone = readFileSync(join(REF, 'source', 'famitone.asm'), 'latin1');
  assert.match(game, /The game and its source code are released into Public Domain/);
  assert.match(famitone, /consider it Public Domain/);
});
