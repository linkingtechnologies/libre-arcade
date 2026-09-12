import test from 'node:test';
import assert from 'node:assert/strict';
import { FlipFlop } from '../public/src/games/flipflop.js';
import { Cube } from '../public/src/core/cube.js';

test('same seed produces same board', () => {
  const a = new FlipFlop({ dimensions: 4, skillLevel: 2, wrap: true, seed: 12345 });
  const b = new FlipFlop({ dimensions: 4, skillLevel: 2, wrap: true, seed: 12345 });
  assert.deepEqual([...a.cube.cells], [...b.cube.cells]);
});

test('one flip toggles center plus orthogonal neighbors', () => {
  const game = new FlipFlop({ dimensions: 2, skillLevel: 0, wrap: false, seed: 1 });
  game.cube.fill(0);
  game.onCount = 0;
  game.hasWon = false;
  const center = Cube.vectorToIndex([1, 1, 0, 0]);
  game.flip(center);
  assert.equal(game.onCount, 5);
});

test('generated board is solved by replaying its scramble moves', () => {
  const game = new FlipFlop({ dimensions: 3, skillLevel: 1, wrap: true, seed: 54321 });
  assert.equal(game.expectedMoves, 8);
  assert.equal(game.scrambleMoves.length, 8);
  for (const index of [...game.scrambleMoves].reverse()) game.flip(index);
  assert.equal(game.onCount, 0);
  assert.equal(game.hasWon, true);
});

test('dimensional aid reports exactly the cells a 4D Flip-Flop move affects', () => {
  const game = new FlipFlop({ dimensions: 4, skillLevel: 0, wrap: true, seed: 1 });
  const index = Cube.vectorToIndex([0, 0, 0, 0]);
  const aid = game.affectedCells(index);
  assert.equal(aid.length, 9); // center + 2 neighbours per logical axis
  assert.equal(aid.filter((item) => item.center).length, 1);
  assert.equal(aid.filter((item) => item.dimensional).length, 4);
  assert.equal(aid.filter((item) => item.wrapped).length, 4);
  const expected = new Set([index, ...Cube.getNeighbors(index, 4, true)]);
  assert.deepEqual(new Set(aid.map((item) => item.index)), expected);
});
