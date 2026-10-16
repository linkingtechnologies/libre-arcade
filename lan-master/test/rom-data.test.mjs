// The data of the page (public/src) against the ROM and the author's source: the fifty levels, the passcodes, the pictures' tables, the palettes,
// the brightness maps of the fades, the text of the ending. The ROM is the author's own (reference/release), and the labels come from his source
// assembled by tools/assemble.mjs, which gives exactly that ROM (test/reference.test.mjs checks it).
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { packageModules } from '../tools/package-modules.mjs';
import { loadSymbols } from '../tools/symbols.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const rom = new Uint8Array(readFileSync(join(ROOT, 'reference', 'release', 'Lan_Master.nes')));
const symbols = loadSymbols(rom);
const m = packageModules();
const { LanMasterCore: C, LanMasterNESAssets: A, LanMasterNESGfx: G, LanMasterTransitions: TR, LAN_MASTER_LEVELS: LEVELS, LAN_MASTER_PASSWORDS: PASSWORDS, LAN_MASTER_ENDING_CODE: ENDING } = m;

const prg = (address, length) => rom.subarray(16 + (address - 0x8000), 16 + (address - 0x8000) + length);
const chr = rom.subarray(16 + 0x8000, 16 + 0x8000 + 0x2000);
const same = (a, b, what) => assert.deepEqual([...a], [...b], what);

test('the fifty levels are what the ROM has: the tiles, the terminals\' share, the random rotation time, the time, the start', () => {
  assert.equal(LEVELS.length, 50);
  for (let i = 0; i < 50; i++) {
    const pointer = prg(symbols.levList + 2 * i, 2);
    const at = pointer[0] | (pointer[1] << 8);
    const data = prg(at, 60);
    // 12 by 12 tiles of three bits, three bytes (eight tiles) at a time, lowest bits first, as unpackLevel shifts them out
    const classes = [];
    for (let g = 0; g < 18; g++) {
      let v = data[g * 3] | (data[g * 3 + 1] << 8) | (data[g * 3 + 2] << 16);
      for (let k = 0; k < 8; k++) { classes.push(v & 7); v >>= 3; }
    }
    const level = LEVELS[i];
    same(level.tile_classes, classes, `level ${i + 1}: tiles`);
    assert.equal(level.term_fp, data[54] | (data[55] << 8), `level ${i + 1}: term_fp`);
    assert.equal(level.rrot_time, data[56] | (data[57] << 8), `level ${i + 1}: rrot_time`);
    assert.equal(level.timer, data[58], `level ${i + 1}: time`);
    assert.equal(level.start_pos, data[59], `level ${i + 1}: start`);
    assert.equal(level.rom_offset, at - 0x8000 + 16, `level ${i + 1}: where the package says it is`);
  }
});

test('the passcodes are the ROM\'s table: 49 for the levels 2 to 50, and 6502, which the ROM treats as the fiftieth, for the ending', () => {
  assert.equal(PASSWORDS.length, 49);
  const table = prg(symbols.passwords, 100);
  const codes = [];
  for (let i = 0; i < 50; i++) codes.push((table[2 * i + 1] >> 4).toString(16) + (table[2 * i + 1] & 15).toString(16) + (table[2 * i] >> 4).toString(16) + (table[2 * i] & 15).toString(16));
  assert.deepEqual([...PASSWORDS], codes.slice(0, 49));
  assert.equal(ENDING, codes[49]);
  assert.equal(ENDING, '6502');
});

test('the pictures are the ROM\'s: the character sheet, the title, the game board and the ending (compressed as the ROM has them)', () => {
  same(G.b64(A.patternsChrB64), chr, 'patterns.chr');
  const rle = (b64, label, length) => { const bytes = G.b64(b64); assert.equal(bytes.length, length, label); return bytes; };
  same(rle(A.titleRleB64, 'title', symbols.gameBgNameTable - symbols.titleNameTable), prg(symbols.titleNameTable, symbols.gameBgNameTable - symbols.titleNameTable), 'the title\'s name table');
  same(rle(A.gameBgRleB64, 'game board', symbols.tilesTable - symbols.gameBgNameTable), prg(symbols.gameBgNameTable, symbols.tilesTable - symbols.gameBgNameTable), 'the game board\'s name table');
  const done = rle(A.wellDoneRleB64, 'ending', 358);
  same(done, readFileSync(join(ROOT, 'reference', 'source', 'welldone.rle')), 'the ending\'s name table is welldone.rle');
  same(prg(symbols.wellDoneTable, 358), done, 'and it is where the ROM has it');
});

test('the palettes, the tile table, the cursor colours and the menu colours are the ROM\'s', () => {
  same(A.palTitle, prg(symbols.palTitle, 20), 'palTitle');
  same(A.palGame, prg(symbols.palGame, 20), 'palGame');
  same(A.palDone, prg(symbols.palDone, 20), 'palDone');
  same(A.tilesTable.flat(), prg(symbols.tilesTable, 27 * 4), 'the tiles of the 27 pictures of a cell');
  same(A.curColors, prg(symbols.curColors, 12), 'cursor colours');
  same(A.menuColors.flat(), prg(symbols.menuColors, 7 * 6), 'menu attribute rows');
});

test('the tables of the pause menu, of the level clear panel and of the time out panel are the ROM\'s, tile for tile', () => {
  same(A.gameMenuTable, prg(symbols.gameMenuTable, 140), 'the pause menu');
  same(A.gameMenuAttrTable.flat(), prg(symbols.gameMenuAttrTable, 40), 'the pause menu\'s attributes');
  same(A.levelClearTable, prg(symbols.levelClearTable, 144), 'the level clear table');
  same(A.timeOutTable, prg(symbols.timeOutTable, 144), 'the time out table (8 rows of 18 tiles)');
});

test('the fades are the ROM\'s four brightness maps, and the ending\'s text, background and fade are the ROM\'s', () => {
  same(TR.PAL_BRIGHT, prg(symbols.palBrightTable, 256), 'the brightness maps');
  same(TR.WELL_DONE_FADE, prg(symbols.wellDoneFade, 6), 'the text\'s fade');
  const text = prg(symbols.wellDoneText, TR.WELL_DONE_TEXT.length);
  same(TR.WELL_DONE_TEXT, text, 'the ending\'s text');
  same(TR.WELL_DONE_BG, prg(symbols.wellDoneBG, TR.WELL_DONE_BG.length), 'the ending\'s background');
});

test("the rules' tables are the ROM's: which tile each class of the level data makes, how a tile turns, which pins it has (where a computer looks is checked by the trace test of rom-routines)", () => {
  same(C.MAP_CODES, prg(symbols.mapCodes, 8), 'mapCodes');
  same(C.ROTATE_LEFT, prg(symbols.rotateLeft, 19), 'rotateLeft');
  same(C.PINS, prg(symbols.pinsTable, 19), 'pinsTable');
});
