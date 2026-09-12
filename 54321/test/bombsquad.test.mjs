import test from 'node:test';
import assert from 'node:assert/strict';
import { Cube } from '../public/src/core/cube.js';
import { BombSquad, BOMB_CELL } from '../public/src/games/bombsquad.js';

const expectedBombs = {
  2: [2, 4, 8],
  3: [4, 8, 16],
  4: [16, 32, 64],
};

function bombIndices(model) {
  const max = Cube.ARRAY_LENGTHS[model.dimensions];
  const out = [];
  for (let i = 0; i < max; i += 1) {
    if ((model.cube.get(i) & BOMB_CELL.BOMB) !== 0) out.push(i);
  }
  return out;
}

test('Bomb Squad preserves original bomb-count table in 2D/3D/4D', () => {
  for (const dimensions of [2, 3, 4]) {
    for (const skillLevel of [0, 1, 2]) {
      const model = new BombSquad({ dimensions, skillLevel, seed: 1234 });
      assert.equal(model.bombCount, expectedBombs[dimensions][skillLevel]);
      assert.equal(bombIndices(model).length, expectedBombs[dimensions][skillLevel]);
    }
  }
});

test('Bomb placement is deterministic for a supplied seed', () => {
  const a = new BombSquad({ dimensions: 4, skillLevel: 2, wrap: true, seed: 987654 });
  const b = new BombSquad({ dimensions: 4, skillLevel: 2, wrap: true, seed: 987654 });
  assert.deepEqual(bombIndices(a), bombIndices(b));
});

test('neighbour counts equal orthogonal bomb neighbours', () => {
  const model = new BombSquad({ dimensions: 3, skillLevel: 2, wrap: false, seed: 777 });
  const max = Cube.ARRAY_LENGTHS[model.dimensions];
  for (let i = 0; i < max; i += 1) {
    const expected = Cube.getNeighbors(i, model.dimensions, model.wrap)
      .filter((n) => (model.cube.get(n) & BOMB_CELL.BOMB) !== 0).length;
    assert.equal(model.cube.get(i) & BOMB_CELL.COUNT_MASK, expected);
  }
});

test('flagging a covered cell toggles the flag and counter', () => {
  const model = new BombSquad({ dimensions: 2, skillLevel: 0, seed: 9 });
  const index = 0;
  model.toggleFlag(index);
  assert.ok((model.cube.get(index) & BOMB_CELL.FLAG) !== 0);
  assert.equal(model.flagCount, 1);
  model.toggleFlag(index);
  assert.equal(model.cube.get(index) & BOMB_CELL.FLAG, 0);
  assert.equal(model.flagCount, 0);
});

test('uncovering a bomb loses immediately, including on the first click', () => {
  const model = new BombSquad({ dimensions: 2, skillLevel: 0, seed: 5 });
  const bomb = bombIndices(model)[0];
  model.uncover(bomb);
  assert.equal(model.hasLost, true);
  assert.equal(model.gameOver, true);
});

test('uncovering an unflagged zero expands through orthogonal neighbours', () => {
  let model;
  let zero;
  for (let seed = 1; seed < 1000 && zero === undefined; seed += 1) {
    model = new BombSquad({ dimensions: 2, skillLevel: 0, wrap: false, seed });
    const max = Cube.ARRAY_LENGTHS[2];
    for (let i = 0; i < max; i += 1) {
      const cell = model.cube.get(i);
      if ((cell & BOMB_CELL.BOMB) === 0 && (cell & BOMB_CELL.COUNT_MASK) === 0) {
        zero = i;
        break;
      }
    }
  }
  assert.notEqual(zero, undefined);
  const before = model.coveredCount;
  model.uncover(zero);
  assert.ok(model.coveredCount < before - 1, 'zero flood should reveal more than one cell');
});

test('flagging every bomb after uncovering all safe cells wins', () => {
  const model = new BombSquad({ dimensions: 2, skillLevel: 1, wrap: true, seed: 42 });
  const max = Cube.ARRAY_LENGTHS[2];
  for (let i = 0; i < max; i += 1) {
    if ((model.cube.get(i) & BOMB_CELL.BOMB) === 0) model.uncover(i);
  }
  for (const bomb of bombIndices(model)) model.toggleFlag(bomb);
  assert.equal(model.coveredCount, model.bombCount);
  assert.equal(model.flagCount, model.bombCount);
  assert.equal(model.hasWon, true);
});

test('dimensional aid exposes only Bomb Squad orthogonal-neighbour geometry', () => {
  const model = new BombSquad({ dimensions: 4, skillLevel: 2, wrap: true, seed: 42 });
  const index = Cube.vectorToIndex([0, 0, 0, 0]);
  const aid = model.neighborsOf(index);
  assert.deepEqual(new Set(aid.map((item) => item.index)), new Set(Cube.getNeighbors(index, 4, true)));
  assert.equal(aid.length, 8);
  assert.equal(aid.filter((item) => item.dimensional).length, 4);
  // The helper returns geometry metadata only; it never exposes bomb state.
  assert.equal(aid.some((item) => Object.hasOwn(item, 'bomb')), false);
});
