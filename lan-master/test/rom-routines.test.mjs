// The routines of the ROM that have no timing of their own, called on the ROM itself (tools/rom-call.mjs) and compared with the page's functions on the
// same inputs: the random number generator, the unpacking of a level, the choice of a random rotation, the trace of the network (the number of computers
// it finds, the "all connected" answer, the sums and the map of the tiles it visited), and the order in which the ROM shows a level tile by tile.
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { RomRoutines } from '../tools/rom-call.mjs';
import { packageModules } from '../tools/package-modules.mjs';
import { solveLevel } from '../tools/solver.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const rom = new Uint8Array(readFileSync(join(ROOT, 'reference', 'release', 'Lan_Master.nes')));
const R = new RomRoutines(rom);
const { LanMasterCore: C, LanMasterTransitions: TR, LAN_MASTER_LEVELS: LEVELS } = packageModules();
const SEEDS = [1, 77, 200];

// the board's cells (offsets in the ROM's 16 by 16 map)
const CELLS = [];
for (let y = 0; y < 12; y++) for (let x = 0; x < 12; x++) CELLS.push((y + 1) * 16 + x + 1);

let state = 12345;   // a small generator of our own, so that the cases are the same on every run
const random = (n) => { state = (state * 1103515245 + 12345) & 0x7fffffff; return (state >> 8) % n; };

test('the random number generator: the ROM\'s rand and the page\'s randStep agree for all 256 seeds', () => {
  for (let seed = 0; seed < 256; seed++) {
    R.set('RAND_SEED', seed);
    const result = R.call('rand');
    const page = C.randStep(seed);
    assert.equal(R.get('RAND_SEED'), page.seed, `seed ${seed}`);
    assert.equal(result.a, page.seed, `the accumulator, seed ${seed}`);
    assert.equal(result.c, page.carry, `the carry, seed ${seed}`);
  }
});

test('unpackLevel: the map, the list of computers, the seed it leaves, for every level and three seeds', () => {
  for (let level = 0; level < 50; level++) {
    for (const seed of SEEDS) {
      R.set('GAME_LEVEL', level); R.set('RAND_SEED', seed); R.ram.fill(0, 0x300, 0x400);
      R.call('unpackLevel');
      const page = C.unpackLevel(LEVELS[level], seed);
      assert.deepEqual([...R.bytes('GAME_MAP', 256)], [...page.map], `level ${level + 1}, seed ${seed}: the map`);
      assert.deepEqual([...R.ram.slice(0x500, 0x500 + R.get('GAME_TERM_CNT'))], [...page.terminals], `level ${level + 1}, seed ${seed}: the computers`);
      assert.equal(R.get('RAND_SEED'), page.seed, `level ${level + 1}, seed ${seed}: the seed`);
      assert.equal(R.getWord('GAME_TERM_FP'), LEVELS[level].term_fp, `level ${level + 1}: each computer's share`);
      assert.equal(R.getWord('GAME_RROT_TIME'), LEVELS[level].rrot_time, `level ${level + 1}: the random rotation time`);
      assert.equal(R.get('GAME_TIME'), LEVELS[level].timer, `level ${level + 1}: the time`);
      assert.equal(R.get('GAME_START_POS'), LEVELS[level].start_pos, `level ${level + 1}: where the reveal starts`);
    }
  }
});

test('the random rotation: which tile, how far, and the sound, for every level', () => {
  for (let level = 0; level < 50; level++) {
    for (const seed of SEEDS) {
      R.set('GAME_LEVEL', level); R.set('RAND_SEED', 1); R.ram.fill(0, 0x300, 0x400);
      R.call('unpackLevel');
      const map = Array.from(R.bytes('GAME_MAP', 256));
      R.set('RAND_SEED', seed);
      R.call('setRandomRotate');
      const page = C.chooseRandomRotation(map, seed);
      const offset = (R.get('GAME_ROTATE_Y') + 1) * 16 + R.get('GAME_ROTATE_X') + 1;
      assert.equal(offset, page.offset, `level ${level + 1}, seed ${seed}: the tile`);
      assert.equal(R.get('GAME_ROTATE'), page.amount, `level ${level + 1}, seed ${seed}: the turns`);
      assert.equal(R.get('GAME_ROTATE_SFX'), page.amount === 1 ? 7 : 8, `level ${level + 1}, seed ${seed}: the sound`);
      assert.equal(R.get('RAND_SEED'), page.seed, `level ${level + 1}, seed ${seed}: the seed`);
    }
  }
});

// The arrangements the trace is tried on: each level's tiles in the orientation of the level data with a few of them turned at random (so that some
// computers are connected and some are not), and the package's own solved board of the level.
function arrangements(level) {
  const base = new Array(256).fill(0);
  CELLS.forEach((off, i) => { base[off] = C.MAP_CODES[LEVELS[level].tile_classes[i]]; });
  const list = [];
  for (let trial = 0; trial < 6; trial++) {
    const map = base.slice();
    for (let k = trial === 0 ? 0 : random(40); k > 0; k--) { const off = CELLS[random(144)]; if (map[off]) map[off] = C.rotate(map[off], 1 + random(3)); }
    list.push(map);
  }
  list.push(solveLevel(level));
  return list;
}

test('traceMap: what the ROM finds from each computer is what the page finds, on 50 levels and seven arrangements each', () => {
  let cases = 0;
  for (let level = 0; level < 50; level++) {
    R.set('GAME_LEVEL', level); R.set('RAND_SEED', 1); R.ram.fill(0, 0x300, 0x400);
    R.call('unpackLevel');
    const computers = R.get('GAME_TERM_CNT'), share = R.getWord('GAME_TERM_FP');
    for (const map of arrangements(level)) {
      for (let ordinal = 0; ordinal < computers; ordinal++) {
        R.load('GAME_MAP', map);
        R.ram.fill(0, 0x400, 0x500);
        R.set('GAME_TERM_TRACE', ordinal); R.setWord('GAME_ONLINE', 0);
        const result = R.call('traceMap');
        const page = C.trace(map, ordinal);
        const where = `level ${level + 1}, computer ${ordinal}`;
        assert.equal(R.get('T_ONLINE_CNT'), page.reached, `${where}: the computers it found`);
        assert.equal(result.z === 1, page.all, `${where}: everything connected`);
        assert.equal(R.getWord('T_ONLINE'), (page.reached * share) & 0xffff, `${where}: the sum of their shares`);
        assert.equal(R.get('GAME_TERM_TRACE'), (ordinal + 1) % computers, `${where}: the next computer to trace from`);
        const check = R.bytes('GAME_CHECK', 256);
        for (let off = 0; off < 256; off++) {
          const visited = (page.visited.has(`${off}:0`) ? 1 : 0) | (page.visited.has(`${off}:1`) ? 2 : 0);
          if ((check[off] & 3) !== visited) assert.fail(`${where}: the tiles it visited differ at offset ${off} (ROM ${check[off] & 3}, page ${visited})`);
        }
        cases++;
      }
    }
  }
  assert.ok(cases > 2000, `${cases} traces compared`);
});

test('the package\'s solved board of each level connects every computer, by the ROM\'s own trace', () => {
  for (let level = 0; level < 50; level++) {
    R.set('GAME_LEVEL', level); R.set('RAND_SEED', 1); R.ram.fill(0, 0x300, 0x400);
    R.call('unpackLevel');
    const map = solveLevel(level);
    for (let ordinal = 0; ordinal < R.get('GAME_TERM_CNT'); ordinal++) {
      R.load('GAME_MAP', map);
      R.ram.fill(0, 0x400, 0x500);
      R.set('GAME_TERM_TRACE', ordinal); R.setWord('GAME_ONLINE', 0);
      assert.equal(R.call('traceMap').z, 1, `level ${level + 1}, computer ${ordinal}`);
    }
  }
});

test('showLevel: the ROM draws a level tile by tile in the order, and the pairs per frame, that the page reveals it in', () => {
  const symbols = R.symbols, machine = R.game.m;
  for (let level = 0; level < 50; level++) {
    for (const seed of [1, 77]) {
      R.set('GAME_LEVEL', level); R.set('RAND_SEED', seed); R.ram.fill(0, 0x300, 0x400);
      R.call('unpackLevel');
      const map = Array.from(R.bytes('GAME_MAP', 256));
      // every wait for the next frame ends the frame; every call to updateTile is a tile drawn in it
      const frames = [[]];
      const before = machine.beforeStep;
      machine.beforeStep = (cpu) => {
        if (cpu.pc === symbols.waitNMI50) { frames.push([]); const low = cpu.pull(), high = cpu.pull(); cpu.pc = ((high << 8) | low) + 1; return; }
        if (cpu.pc === symbols.updateTile) frames.at(-1).push([cpu.x, cpu.y]);
      };
      R.call('showLevel', { a: 1 });
      machine.beforeStep = before;
      const rom = frames.filter((f) => f.length);
      const page = TR.showLevelBatches(map, R.get('GAME_START_POS')).map((batch) => batch.map((off) => [(off & 15) - 1, (off >> 4) - 1]));
      assert.equal(JSON.stringify(page), JSON.stringify(rom), `level ${level + 1}, seed ${seed}`);
    }
  }
});
