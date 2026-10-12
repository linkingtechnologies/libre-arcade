// The assembler of tools/assemble.mjs: the instructions and directives the v1.12 source uses, against bytes worked out by hand, and the
// whole source against what was recorded: the package this game came with carried two verification ROMs, made with a Python assembler
// that could not be run here; this one gives the same bytes. Neither is the author's binary (his assembler is not available).
import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash } from 'node:crypto';
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Assembler, assembleSource, ORGS_AT_8000 } from '../tools/assemble.mjs';
import { ROM_V11, SOURCE_V112 } from '../tools/rom-oracle.mjs';

const HEADER = '    .inesprg 1\n    .ineschr 0\n    .inesmir 1\n    .inesmap 0\n    .bank 0\n    .org $8000\n';
function assemble(source, files = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'lm-asm-'));
  writeFileSync(join(dir, 'game.asm'), HEADER + source);
  for (const [name, content] of Object.entries(files)) writeFileSync(join(dir, name), content);
  const assembler = new Assembler(dir);
  const rom = assembler.assemble('game.asm');
  return { prg: Array.from(rom.subarray(16, 16 + 64)), assembler };
}
const bytesOf = (source, count, files) => assemble(source, files).prg.slice(0, count);
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');

test('addressing modes and their opcodes', () => {
  assert.deepEqual(bytesOf('lda #$12\nlda $12\nlda $12,x\nlda $1234\nlda $1234,x\nlda $1234,y\n', 15), [0xA9, 0x12, 0xA5, 0x12, 0xB5, 0x12, 0xAD, 0x34, 0x12, 0xBD, 0x34, 0x12, 0xB9, 0x34, 0x12]);
  assert.deepEqual(bytesOf('lda [$10],y\nlda [$10,x]\njmp ($1234)\nasl a\nasl $10\n', 10), [0xB1, 0x10, 0xA1, 0x10, 0x6C, 0x34, 0x12, 0x0A, 0x06, 0x10]);
  assert.deepEqual(bytesOf('ldx $10,y\nstx $10,y\nldy $10,x\nbit $2002\nbit $10\n', 11), [0xB6, 0x10, 0x96, 0x10, 0xB4, 0x10, 0x2C, 0x02, 0x20, 0x24, 0x10]);
});

test('the width the author writes decides between zero page and absolute, as NESASM does: $00 is zero page, $000 is absolute, < forces zero page', () => {
  assert.deepEqual(bytesOf('sta $00\nsta $000\nsta <$1234\nsta $0300\n', 10), [0x85, 0x00, 0x8D, 0x00, 0x00, 0x85, 0x34, 0x8D, 0x00, 0x03]);
});

test('labels: forward and backward branches, local labels under each global label, the address of a label in data', () => {
  // a loop of two instructions (dex; bne back) and a forward skip
  assert.deepEqual(bytesOf('start\n.1\ndex\nbne .1\nbeq done\nnop\ndone\nrts\n.dw start\n', 9), [0xCA, 0xD0, 0xFD, 0xF0, 0x01, 0xEA, 0x60, 0x00, 0x80]);
  const { prg } = assemble('one\n.1\nnop\njmp .1\ntwo\n.1\nrts\njmp .1\n');
  assert.deepEqual(prg.slice(0, 8), [0xEA, 0x4C, 0x00, 0x80, 0x60, 0x4C, 0x04, 0x80], 'each .1 belongs to the label above it');
});

test('expressions: hex, binary, decimal, LOW, HIGH, integer division, shifts, and, or, parentheses, equ chains', () => {
  const source = 'FUEL equ 58*4\nMAX equ FUEL/6\nMASK equ %00001111\nlda #FUEL\nlda #MAX\nlda #(MASK|$f0)\nlda #LOW($1234)\nlda #HIGH($1234)\nlda #(1<<4)\nlda #$ff&$3c\n';
  assert.deepEqual(bytesOf(source, 14), [0xA9, 232, 0xA9, 38, 0xA9, 0xFF, 0xA9, 0x34, 0xA9, 0x12, 0xA9, 16, 0xA9, 0x3C]);
});

test('directives: .db with numbers and strings, .dw, .ifdef/.else/.endif, .include and .incbin', () => {
  assert.deepEqual(bytesOf('.db 1,2,"AB",$0d\n.dw $1234,label\nlabel\n', 9), [1, 2, 0x41, 0x42, 0x0D, 0x34, 0x12, 0x09, 0x80]);
  assert.deepEqual(bytesOf('FLAG equ 1\n.ifdef FLAG\n.db 1\n.else\n.db 2\n.endif\n.ifdef NOPE\n.db 3\n.endif\n.ifndef NOPE\n.db 4\n.endif\n', 2), [1, 4]);
  assert.deepEqual(bytesOf('.include "part.asm"\n.db 9\n', 3, { 'part.asm': '.db 7,8\n' }), [7, 8, 9]);
  assert.deepEqual(bytesOf('.incbin "blob.bin"\n.db 9\n', 4, { 'blob.bin': Buffer.from([5, 6, 7]) }), [5, 6, 7, 9]);
});

test('the assembler refuses what it cannot assemble', () => {
  assert.throws(() => assemble('frobnicate $12\n'), /unknown opcode/);
  assert.throws(() => assemble('beq far\n.org $8200\nfar\nnop\n'), /branch out of range/);
  assert.throws(() => assemble('lda #nowhere\n'), /unresolved/);
});

test('the v1.12 source assembles to the two verification ROMs of the package', () => {
  const upper = assembleSource(SOURCE_V112);
  const lower = assembleSource(SOURCE_V112, { at8000: true });
  assert.equal(upper.rom.length, 24592);
  assert.equal(lower.rom.length, 24592);
  assert.equal(sha(upper.rom), 'd3849eea926520cbc42d1c3d46134aac6d5e08dce0dea666a45619c72d66c2a9', 'origin $C000, as the source has it');
  assert.equal(sha(lower.rom), 'b4201c0783618f4c39b7b532b129ee4aaedc8166935925ffff50eb262fc861b2', 'origin $8000, as the competition ROM has it');
  assert.equal(upper.assembler.labels().reset, 0xC000);
  assert.equal(lower.assembler.labels().reset, 0x8000);
  assert.deepEqual(ORGS_AT_8000, { 0xC000: 0x8000, 0xE000: 0xA000, 0xFFFA: 0xBFFA });
});

test('against the competition ROM: the same header, the same character memory and a different program (the author cleaned the code up)', () => {
  const v11 = new Uint8Array(readFileSync(ROM_V11));
  const rebuilt = new Uint8Array(assembleSource(SOURCE_V112, { at8000: true }).rom);
  assert.deepEqual(rebuilt.subarray(0, 16), v11.subarray(0, 16));
  assert.deepEqual(rebuilt.subarray(16 + 16384), v11.subarray(16 + 16384), 'the pattern tables, which hold the ten levels, are identical');
  let differing = 0;
  for (let i = 16; i < 16 + 16384; i++) if (rebuilt[i] !== v11[i]) differing++;
  assert.equal(differing, 7638, 'the program differs (most of it moved when a loop was inlined); what the difference means is checked by running both');
  assert.equal(v11[16 + 0x3FFC] | (v11[16 + 0x3FFD] << 8), 0x8000, 'the competition ROM starts at $8000');
  assert.equal(sha(v11), '942f36376246dbdff99a0b94aad930b2cccf1f534e5390468ac9c0d50752d7dd', 'the competition ROM is the one that was preserved');
});
