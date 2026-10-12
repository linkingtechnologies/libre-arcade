// The port's tables against the bytes of the competition ROM: the levels (packed in the cartridge's character memory), the tile
// and palette tables, the messages, the sprites of the mower, the two packed screens, the pattern tables themselves. A table that is
// not found byte for byte in the ROM, or found more than once, fails.
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ROM_V11, RomGame } from '../tools/rom-oracle.mjs';
import { loadRom } from '../tools/rom-oracle.mjs';
import { LEVELS } from '../public/src/levels-data.js';
import {
  TILES_TABLE, GAME_STAT_NAMETABLE, PAL_GAME_BG, PAL_GAME_SPR, PAL_LEVEL_TRIPLES, PAL_TITLE, PAL_DONE, META_PLAYER, MSG_LEVEL_CLEAR,
  MSG_OUT_OF_FUEL, TITLE_COLOR_ANIMATION, NES_RGB,
} from '../public/src/nes-assets.js';
import { RAW_TO_RUNTIME, FUEL_TIMER_BASES, BOOT_FRAME_COUNT, FUEL_MAX, FLOWER_PENALTY, STONE_PENALTY } from '../public/src/constants.js';
import { PAL_BRIGHT_TABLE } from '../public/src/ppu.js';
import { NOTE_TABLE } from '../public/src/famitone-player.js';
import { decodeShiruRle } from '../public/src/rle.js';

const rom = new Uint8Array(readFileSync(ROM_V11));
const prg = rom.subarray(16, 16 + 16384), chr = rom.subarray(16 + 16384, 16 + 16384 + 8192);
const asset = (name) => new Uint8Array(readFileSync(fileURLToPath(new URL(`../public/assets/${name}`, import.meta.url))));

function occurrences(haystack, needle) {
  let n = 0;
  outer: for (let i = 0; i + needle.length <= haystack.length; i++) {
    for (let j = 0; j < needle.length; j++) if (haystack[i + j] !== needle[j]) continue outer;
    n++;
  }
  return n;
}
const words = (list) => list.flatMap((w) => [w & 255, w >> 8]);

test('the pattern tables of the page are the ROM\'s character memory', () => {
  assert.equal(chr.length, 8192);
  assert.deepEqual(asset('patterns.chr'), new Uint8Array(chr));
});

test('the two packed screens of the page are in the ROM, and decode to whole nametables', () => {
  for (const name of ['title.rle', 'done.rle']) {
    const bytes = asset(name);
    assert.equal(occurrences(prg, bytes), 1, `${name} is in the program exactly once`);
    assert.equal(decodeShiruRle(bytes).length, 1024, `${name} fills a nametable (tiles and attributes)`);
  }
});

test('the ten levels are the records at $1000 of the character memory (95 bytes each)', () => {
  assert.equal(LEVELS.length, 10);
  LEVELS.forEach((level, n) => {
    const record = chr.subarray(0x1000 + 95 * n, 0x1000 + 95 * (n + 1));
    // 88 bytes of 4 cells each (2 bits, the first cell in the top bits) make 11 rows of 32 cells; the lawn starts at column 1
    const cells = [];
    for (const byte of record.subarray(0, 88)) cells.push(byte >> 6, (byte >> 4) & 3, (byte >> 2) & 3, byte & 3);
    const width = record[88];
    assert.equal(level.width, width, `level ${n + 1} width`);
    assert.deepEqual([level.start_game.x, level.start_game.y], [record[89], record[90]], `level ${n + 1} start`);
    assert.equal(level.grass_required, record[91] | (record[92] << 8), `level ${n + 1} cells to cut`);
    assert.equal(level.done_inc_raw_8_8, record[93] | (record[94] << 8), `level ${n + 1} completion step`);
    assert.equal(level.height, 11);
    for (let row = 0; row < 11; row++) {
      for (let x = 0; x < width; x++) {
        const want = { G: 1, F: 2, R: 3, '.': 0, S: 0 }[level.ascii[row][x]];
        assert.equal(cells[row * 32 + 1 + x], want, `level ${n + 1} row ${row} column ${x}`);
      }
    }
    assert.equal(level.fuel_timer_base_ticks, FUEL_TIMER_BASES[n]);
  });
  // the levels' address list and the fuel timers are words in the program
  assert.equal(occurrences(prg, words(Array.from({ length: 10 }, (_, n) => 0x1000 + 95 * n))), 1, 'levList');
  assert.equal(occurrences(prg, words(FUEL_TIMER_BASES)), 1, 'fuelTimeList');
});

test('the tables of tiles, status bar, palettes, messages and sprites are in the ROM byte for byte', () => {
  const tables = {
    'tilesTable (47 large tiles of 5 bytes)': TILES_TABLE.flat(),
    'tilesList (the four variants of each kind of tile)': RAW_TO_RUNTIME.flat(),
    gameStatNameTable: GAME_STAT_NAMETABLE,
    palGame: PAL_GAME_BG,
    palGameSprites: PAL_GAME_SPR,
    palList: PAL_LEVEL_TRIPLES.flat(),
    palTitle: PAL_TITLE,
    palDone: PAL_DONE,
    msgLevelClear: MSG_LEVEL_CLEAR,
    msgOutOfFuel: MSG_OUT_OF_FUEL,
    titleColorAnimation: TITLE_COLOR_ANIMATION.flat(),
    palBrightTable: Array.from(PAL_BRIGHT_TABLE),
    'noteTable (60 notes and 4 zeros)': words(Array.from(NOTE_TABLE).slice(0, 60)).concat(new Array(8).fill(0)),
  };
  for (const [name, bytes] of Object.entries(tables)) assert.equal(occurrences(prg, bytes), 1, `${name} is in the ROM once`);
  // the four metasprites of the mower: tile, y offset, palette, x offset (a signed byte), and a 0 to end them
  for (const [direction, entries] of Object.entries(META_PLAYER)) {
    const bytes = entries.flatMap(([tile, dy, palette, dx]) => [tile, dy & 255, palette, dx & 255]).concat([0]);
    assert.equal(occurrences(prg, bytes), 1, `the metasprite for direction ${direction}`);
  }
});

test('the start-up leaves the frame counter where the page starts it', () => {
  const boot = new RomGame(loadRom('v1.1')).boot();
  assert.equal(boot.read('frameCount'), BOOT_FRAME_COUNT);
  assert.equal(boot.read('frameCount2'), 0);
  assert.equal(boot.read('seed'), 1);
});

test('the fuel numbers: a full tank is 232, a flower costs a sixth and a stone a third', () => {
  assert.equal(FUEL_MAX, 232);
  assert.equal(FLOWER_PENALTY, Math.floor(232 / 6));
  assert.equal(STONE_PENALTY, Math.floor(232 / 3));
});

test('the colours of the page are a 64-entry table of RGB values (the console\'s colours vary between displays; this is a choice)', () => {
  assert.equal(NES_RGB.length, 64);
  assert.ok(NES_RGB.every((c) => Number.isInteger(c) && c >= 0 && c <= 0xffffff));
});
