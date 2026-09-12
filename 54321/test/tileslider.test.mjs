import test from 'node:test';
import assert from 'node:assert/strict';
import { Cube } from '../public/src/core/cube.js';
import { TileSlider } from '../public/src/games/tileslider.js';

function values(model) {
  const len = Cube.ARRAY_LENGTHS[model.dimensions];
  return Array.from({ length: len }, (_, i) => model.cube.get(i));
}

function inversionParity(array) {
  let parity = 0;
  for (let i = 0; i < array.length; i += 1) {
    for (let j = i + 1; j < array.length; j += 1) {
      if (array[i] > array[j]) parity ^= 1;
    }
  }
  return parity;
}

test('Tile Slider uses the original 2/4/8 shuffle swap table in every dimension', () => {
  for (const dimensions of [2, 3, 4]) {
    for (const [skillLevel, expected] of [2, 4, 8].entries()) {
      const model = new TileSlider({ dimensions, skillLevel, wrap: false, seed: 1 });
      assert.equal(model.state().swapCount, expected);
    }
  }
});

test('shuffle is deterministic for a preservation-test seed', () => {
  const a = new TileSlider({ dimensions: 3, skillLevel: 2, wrap: true, seed: 54321 });
  const b = new TileSlider({ dimensions: 3, skillLevel: 2, wrap: true, seed: 54321 });
  assert.deepEqual(values(a), values(b));
});

test('shuffle never moves the blank tile and leaves an even permutation', () => {
  for (const dimensions of [2, 3, 4]) {
    for (const skillLevel of [0, 1, 2]) {
      const model = new TileSlider({ dimensions, skillLevel, wrap: false, seed: 1200 + dimensions * 10 + skillLevel });
      const board = values(model);
      const len = board.length;
      assert.equal(model.blankSpot, len - 1);
      assert.equal(board[len - 1], len - 1);
      assert.equal(inversionParity(board.slice(0, -1)), 0);
      assert.deepEqual([...board].sort((a, b) => a - b), Array.from({ length: len }, (_, i) => i));
    }
  }
});

test('a non-collinear click does nothing', () => {
  const model = new TileSlider({ dimensions: 2, skillLevel: 0, wrap: false, seed: 1 });
  // Force a solved board so the geometry is obvious: blank is at (3,3).
  for (let i = 0; i < 16; i += 1) model.cube.set(i, i);
  model.blankSpot = 15;
  model.stepsTaken = 0;
  const before = values(model);
  const result = model.move(10); // (2,2): differs on both x and y.
  assert.equal(result.moved, false);
  assert.equal(result.shifted, 0);
  assert.deepEqual(values(model), before);
  assert.equal(model.stepsTaken, 0);
});

test('clicking farther away slides every tile between the click and blank', () => {
  const model = new TileSlider({ dimensions: 2, skillLevel: 0, wrap: false, seed: 1 });
  for (let i = 0; i < 16; i += 1) model.cube.set(i, i);
  model.blankSpot = 15; // (3,3)
  model.stepsTaken = 0;

  const result = model.move(12); // (0,3), same row
  assert.equal(result.moved, true);
  assert.equal(result.shifted, 3);
  assert.equal(model.blankSpot, 12);
  assert.equal(model.cube.get(12), 15);
  assert.equal(model.cube.get(13), 12);
  assert.equal(model.cube.get(14), 13);
  assert.equal(model.cube.get(15), 14);
  assert.equal(model.stepsTaken, 3);
});

test('wrap mode chooses the shorter one-step edge-crossing slide', () => {
  const model = new TileSlider({ dimensions: 2, skillLevel: 0, wrap: true, seed: 1 });
  for (let i = 0; i < 16; i += 1) model.cube.set(i, i);
  model.blankSpot = 15; // x=3,y=3
  model.stepsTaken = 0;

  const result = model.move(12); // x=0,y=3; wrap makes this one positive step
  assert.equal(result.shifted, 1);
  assert.equal(model.blankSpot, 12);
  assert.equal(model.cube.get(15), 12);
  assert.equal(model.cube.get(12), 15);
});

test('wrap distance-two tie follows the original negative-direction tie break', () => {
  const model = new TileSlider({ dimensions: 2, skillLevel: 0, wrap: true, seed: 1 });
  for (let i = 0; i < 16; i += 1) model.cube.set(i, i);
  // Keep a valid permutation while placing the blank at x=0,y=3.
  model.cube.set(12, 15);
  model.cube.set(15, 12);
  model.blankSpot = 12;
  model.stepsTaken = 0;
  const result = model.move(14); // x=2,y=3: equal distance either direction
  assert.equal(result.shifted, 2);
  // Original Cube::determineAxis chooses negative for the tie: 0 -> 3 -> 2.
  assert.equal(model.cube.get(12), 12);
  assert.equal(model.cube.get(15), 14);
  assert.equal(model.cube.get(14), 15); // blank tile value
  assert.equal(model.blankSpot, 14);
});

test('solving the board sets hasWon and counts shifted tiles as steps', () => {
  const model = new TileSlider({ dimensions: 2, skillLevel: 0, wrap: false, seed: 1 });
  for (let i = 0; i < 16; i += 1) model.cube.set(i, i);
  // One legal slide away from solved: [.., blank, tile14] on last row.
  model.cube.set(14, 15);
  model.cube.set(15, 14);
  model.blankSpot = 14;
  model.stepsTaken = 0;
  model.hasWon = false;

  const result = model.move(15);
  assert.equal(result.moved, true);
  assert.equal(result.shifted, 1);
  assert.equal(model.isSolved(), true);
  assert.equal(model.hasWon, true);
  assert.equal(model.stepsTaken, 1);
});

test('goal preview values are the solved index mapping and do not mutate the board', () => {
  const model = new TileSlider({ dimensions: 4, skillLevel: 2, wrap: true, seed: 42 });
  const before = values(model);
  assert.equal(model.goalValue(0), 0);
  assert.equal(model.goalValue(255), 255);
  assert.deepEqual(values(model), before);
});

test('Tile Slider dimensional aid lists every and only collinear clickable tile', () => {
  const model = new TileSlider({ dimensions: 4, skillLevel: 0, wrap: false, seed: 1 });
  // Force solved geometry: blank at [3,3,3,3].
  for (let i = 0; i < 256; i += 1) model.cube.set(i, i);
  model.blankSpot = 255;
  const moves = model.legalMoves();
  assert.equal(moves.length, 12); // 3 tiles on each of four axes
  assert.equal(moves.filter((move) => move.dimensional).length, 6);
  for (const move of moves) {
    const copy = new TileSlider({ dimensions: 4, skillLevel: 0, wrap: false, seed: 1 });
    for (let i = 0; i < 256; i += 1) copy.cube.set(i, i);
    copy.blankSpot = 255;
    assert.equal(copy.move(move.index).moved, true);
  }
});

test('Tile Slider dimensional aid marks shorter wrap routes on higher axes', () => {
  const model = new TileSlider({ dimensions: 3, skillLevel: 0, wrap: true, seed: 1 });
  for (let i = 0; i < 64; i += 1) model.cube.set(i, i);
  model.blankSpot = 63; // [3,3,3,0]
  const target = Cube.vectorToIndex([3, 3, 0, 0]);
  const move = model.legalMoves().find((item) => item.index === target);
  assert.ok(move);
  assert.equal(move.axis, 2);
  assert.equal(move.dimensional, true);
  assert.equal(move.distance, 1);
  assert.equal(move.wrapped, true);
});
