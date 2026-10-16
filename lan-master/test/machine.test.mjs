// The oracle's own machine, checked on the ROM: the game finds out by itself which console it runs on (it counts how much happens between two vertical blanks),
// so a console of the right speed is what makes it say PAL or NTSC; and the 6502 core agrees with the assembler on a few instructions of known cost.
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { RomGame } from '../tools/rom-run.mjs';
import { reader } from '../tools/ram-map.mjs';
import { RomRoutines } from '../tools/rom-call.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const rom = new Uint8Array(readFileSync(join(ROOT, 'reference', 'release', 'Lan_Master.nes')));

test('the ROM finds the PAL console PAL, and the NTSC one NTSC', () => {
  for (const [region, expected] of [['pal', 0], ['ntsc', 128]]) {
    const game = new RomGame(rom, { region });
    for (let i = 0; i < 60; i++) game.frame(0);
    assert.equal(reader(game.ram).get('GAME_NTSC'), expected, region);
  }
});

test('on the PAL console every frame is a tick of the game; on the NTSC one the game throws every fifth frame\'s work away', () => {
  const pal = new RomGame(rom, { region: 'pal' }), ntsc = new RomGame(rom, { region: 'ntsc' });
  for (let i = 0; i < 300; i++) { pal.frame(0); ntsc.frame(0); }
  assert.equal(pal.logicFrames, 300);
  assert.ok(ntsc.logicFrames >= 230 && ntsc.logicFrames <= 242, `${ntsc.logicFrames} logic frames in 300`);
});

test('a routine of the ROM called directly costs what its instructions cost', () => {
  const routines = new RomRoutines(rom);
  const result = routines.call('rand');                  // lda zp (3), asl a (2), bcc (2 or 3, or 4 across a page), eor # (2), sta zp (3), rts (6) + the jsr's 6 pushed by the call itself
  assert.ok(result.cycles >= 16 && result.cycles <= 19, `${result.cycles} cycles`);
});
