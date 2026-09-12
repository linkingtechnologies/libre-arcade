import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { Cube } from '../public/src/core/cube.js';
import { PegJumper, PEG_CELL } from '../public/src/games/pegjumper.js';
import { PEG_BOARDS } from '../public/src/games/pegboards.js';

const here = dirname(fileURLToPath(import.meta.url));
const referenceData = resolve(here, '../reference/54321-1.0.2001.11.16/data');

function compactPegFile(text) {
  return [...text].filter((ch) => ch === '-' || ch === 'o' || ch === 'x').join('');
}

function cells(model) {
  const len = Cube.ARRAY_LENGTHS[model.dimensions];
  return Array.from({ length: len }, (_, i) => model.cube.get(i));
}

test('all 18 embedded Peg Jumper layouts match the original .peg payloads exactly', async () => {
  for (const dimensions of [2, 3, 4]) {
    for (const skillLevel of [0, 1, 2]) {
      for (const suffix of ['n', 'w']) {
        const key = `${dimensions}-${skillLevel}${suffix}`;
        const text = await readFile(resolve(referenceData, `b${key}.peg`), 'utf8');
        assert.equal(PEG_BOARDS[key], compactPegFile(text), key);
      }
    }
  }
});

test('historical wrap/non-wrap board payloads are identical for every dimension and skill', () => {
  for (const dimensions of [2, 3, 4]) {
    for (const skillLevel of [0, 1, 2]) {
      assert.equal(PEG_BOARDS[`${dimensions}-${skillLevel}n`], PEG_BOARDS[`${dimensions}-${skillLevel}w`]);
    }
  }
});

test('initial peg counts match the original board files', () => {
  const expected = {
    '2-0': 6, '2-1': 12, '2-2': 16,
    '3-0': 32, '3-1': 56, '3-2': 64,
    '4-0': 80, '4-1': 176, '4-2': 256,
  };
  for (const [key, count] of Object.entries(expected)) {
    const [dimensions, skillLevel] = key.split('-').map(Number);
    const model = new PegJumper({ dimensions, skillLevel, wrap: true });
    assert.equal(model.pegsRemaining, count, key);
  }
});

test('the first peg clicked is removed and becomes a hole', () => {
  const model = new PegJumper({ dimensions: 2, skillLevel: 2, wrap: false });
  const before = model.pegsRemaining;
  const result = model.select(2);
  assert.equal(result.removedFirstPeg, true);
  assert.equal(model.firstMove, false);
  assert.equal(model.pegsRemaining, before - 1);
  assert.equal(model.cube.get(2), PEG_CELL.HOLE);
  assert.equal(model.isSelected(), false);
});

test('clicking an empty shape cell does not consume the first move', () => {
  const model = new PegJumper({ dimensions: 2, skillLevel: 0, wrap: false });
  assert.equal(model.cube.get(0), PEG_CELL.EMPTY);
  model.select(0);
  assert.equal(model.firstMove, true);
  assert.equal(model.pegsRemaining, 6);
});

test('standard non-wrap jump removes source and jumped peg and lands in the hole', () => {
  const model = new PegJumper({ dimensions: 2, skillLevel: 2, wrap: false });
  model.select(2); // first move: make destination hole
  model.select(0); // select source
  const result = model.jump(1); // jump over cell 1 into cell 2
  assert.equal(result.jumped, true);
  assert.equal(result.destination, 2);
  assert.equal(model.cube.get(0), PEG_CELL.HOLE);
  assert.equal(model.cube.get(1), PEG_CELL.HOLE);
  assert.equal(model.cube.get(2), PEG_CELL.PEG);
  assert.equal(model.pegsRemaining, 14);
  assert.equal(model.stepsTaken, 1);
  assert.equal(model.isSelected(), false);
});

test('an illegal second click cancels selection, matching the original controller/model behavior', () => {
  const model = new PegJumper({ dimensions: 2, skillLevel: 2, wrap: false });
  model.select(2); // first hole
  model.select(0);
  const before = cells(model);
  const result = model.jump(4); // 4 is adjacent, but the computed landing cell 8 is still a peg
  assert.equal(result.jumped, false);
  assert.equal(model.isSelected(), false);
  const after = cells(model);
  // Only the SELECTED overlay bit is expected to disappear.
  assert.equal(before[0] & ~PEG_CELL.SELECTED, after[0]);
  for (let i = 1; i < after.length; i += 1) assert.equal(after[i], before[i]);
});

test('wrap mode allows an edge-crossing jump that non-wrap mode rejects', () => {
  const wrapped = new PegJumper({ dimensions: 2, skillLevel: 2, wrap: true });
  wrapped.select(1); // hole at 1
  wrapped.select(3); // source x=3
  assert.equal(wrapped.jump(0).jumped, true); // jump through x=0 into x=1

  const plain = new PegJumper({ dimensions: 2, skillLevel: 2, wrap: false });
  plain.select(1);
  plain.select(3);
  assert.equal(plain.jump(0).jumped, false);
});

test('victory occurs when a legal jump leaves exactly one peg', () => {
  const model = new PegJumper({ dimensions: 2, skillLevel: 2, wrap: false });
  model.cube.fill(PEG_CELL.EMPTY);
  model.cube.set(0, PEG_CELL.PEG);
  model.cube.set(1, PEG_CELL.PEG);
  model.cube.set(2, PEG_CELL.HOLE);
  model.pegsRemaining = 2;
  model.firstMove = false;
  model.hasWon = false;
  model.select(0);
  const result = model.jump(1);
  assert.equal(result.jumped, true);
  assert.equal(model.pegsRemaining, 1);
  assert.equal(model.hasWon, true);
});

test('reset initializes stepsTaken to zero as the documented browser bugfix', () => {
  const model = new PegJumper({ dimensions: 2, skillLevel: 2, wrap: false });
  model.stepsTaken = 99;
  model.reset();
  assert.equal(model.stepsTaken, 0);
});

test('Peg Jumper dimensional aid finds a legal third-axis jump and landing', () => {
  const model = new PegJumper({ dimensions: 3, skillLevel: 2, wrap: false });
  model.cube.fill(PEG_CELL.EMPTY);
  const source = Cube.vectorToIndex([0, 0, 0, 0]);
  const jumped = Cube.vectorToIndex([0, 0, 1, 0]);
  const destination = Cube.vectorToIndex([0, 0, 2, 0]);
  model.cube.set(source, PEG_CELL.PEG);
  model.cube.set(jumped, PEG_CELL.PEG);
  model.cube.set(destination, PEG_CELL.HOLE);
  model.pegsRemaining = 2;
  model.firstMove = false;
  const jumps = model.legalJumps(source);
  assert.ok(jumps.some((jump) => jump.jumped === jumped && jump.destination === destination && jump.axis === 2 && jump.dimensional));
});

test('Peg Jumper dimensional aid reports wrap when a two-step jump crosses an edge', () => {
  const model = new PegJumper({ dimensions: 3, skillLevel: 2, wrap: true });
  model.cube.fill(PEG_CELL.EMPTY);
  const source = Cube.vectorToIndex([0, 0, 3, 0]);
  const jumped = Cube.vectorToIndex([0, 0, 0, 0]);
  const destination = Cube.vectorToIndex([0, 0, 1, 0]);
  model.cube.set(source, PEG_CELL.PEG);
  model.cube.set(jumped, PEG_CELL.PEG);
  model.cube.set(destination, PEG_CELL.HOLE);
  model.pegsRemaining = 2;
  model.firstMove = false;
  const jump = model.legalJumps(source).find((item) => item.destination === destination);
  assert.ok(jump);
  assert.equal(jump.dimensional, true);
  assert.equal(jump.wrapped, true);
});
