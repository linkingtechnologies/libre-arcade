import test from 'node:test';
import assert from 'node:assert/strict';
import { Cube } from '../public/src/core/cube.js';

test('index/vector conversion matches the original little-coordinate ordering', () => {
  for (let i = 0; i < Cube.ARRAY_LEN; i += 1) {
    assert.equal(Cube.vectorToIndex(Cube.indexToVector(i)), i);
  }
});

test('2D interior cell has four neighbors without wrap', () => {
  const index = Cube.vectorToIndex([1, 1, 0, 0]);
  assert.equal(Cube.getNeighbors(index, 2, false).length, 4);
});

test('2D corner cell has two neighbors without wrap and four with wrap', () => {
  const index = Cube.vectorToIndex([0, 0, 0, 0]);
  assert.equal(Cube.getNeighbors(index, 2, false).length, 2);
  assert.equal(Cube.getNeighbors(index, 2, true).length, 4);
});

test('neighbor count scales to 3D and 4D with wrapping', () => {
  const index = Cube.vectorToIndex([0, 0, 0, 0]);
  assert.equal(Cube.getNeighbors(index, 3, true).length, 6);
  assert.equal(Cube.getNeighbors(index, 4, true).length, 8);
});

test('describeNeighbor identifies higher-dimensional and wrapped adjacency', () => {
  const origin = Cube.vectorToIndex([0, 0, 0, 0]);
  const thirdAxis = Cube.vectorToIndex([0, 0, 1, 0]);
  const wrappedThird = Cube.vectorToIndex([0, 0, 3, 0]);
  assert.deepEqual(Cube.describeNeighbor(origin, thirdAxis, 3, true), {
    axis: 2, positive: true, dimensional: true, wrapped: false,
  });
  assert.deepEqual(Cube.describeNeighbor(origin, wrappedThird, 3, true), {
    axis: 2, positive: false, dimensional: true, wrapped: true,
  });
  assert.equal(Cube.describeNeighbor(origin, wrappedThird, 3, false), null);
});
