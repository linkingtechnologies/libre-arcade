// The music and sound effects of the page are the data of the author's FamiTracker exports. `public/src/famitone-data.js` holds the
// seven export files assembled one after the other from $8000 (the instruments, the five tunes, the effects). Here they are assembled
// again, from the preserved sources, and compared with it byte for byte, label for label. (That this data plays as the competition
// ROM's does is shown by the sound comparison of the oracle, test/oracle-v1.1.test.js.)
import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, writeFileSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Assembler } from '../tools/assemble.mjs';
import { SOURCE_V112 } from '../tools/rom-oracle.mjs';
import { FAMITONE_BASE, FAMITONE_LABELS, SFX_LABELS, FAMITONE_MEMORY } from '../public/src/famitone-data.js';

const FILES = ['bgm_instruments.asm', 'bgm_title.asm', 'bgm_game.asm', 'bgm_levelclear.asm', 'bgm_outoffuel.asm', 'bgm_welldone.asm', 'sounds.asm'];

test('the page\'s music and effects data is the author\'s export files, assembled', () => {
  const dir = mkdtempSync(join(tmpdir(), 'lm-ft-'));
  for (const name of FILES) copyFileSync(join(SOURCE_V112, name), join(dir, name));
  writeFileSync(join(dir, 'game.asm'), `    .inesprg 1\n    .ineschr 0\n    .inesmir 1\n    .inesmap 0\n    .bank 0\n    .org $8000\n${FILES.map((f) => `    .include "${f}"\n`).join('')}`);
  const assembler = new Assembler(dir);
  const rom = assembler.assemble('game.asm');
  assert.equal(FAMITONE_BASE, 0x8000);
  assert.deepEqual(new Uint8Array(rom.subarray(16, 16 + FAMITONE_MEMORY.length)), FAMITONE_MEMORY);
  const labels = assembler.labels({ locals: true });
  for (const [name, address] of Object.entries(FAMITONE_LABELS)) assert.equal(labels[name], address, name);
  for (const [name, address] of Object.entries(SFX_LABELS)) assert.equal(labels[`sounds::.${name}`], address, name);
  assert.equal(Object.keys(SFX_LABELS).length, 14);
});
