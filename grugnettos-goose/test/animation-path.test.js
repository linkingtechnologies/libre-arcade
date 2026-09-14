import test from 'node:test';
import assert from 'node:assert/strict';
import { movementPath } from '../public/src/ui/movementPath.js';

test('movement animation walks one square at a time', () => {
  assert.deepEqual(
    movementPath({ from: 1, to: 5, distance: 4, direction: 1, finish: 63 }),
    [2, 3, 4, 5]
  );
});

test('movement animation reproduces an overshoot bounce through square 63', () => {
  assert.deepEqual(
    movementPath({ from: 60, to: 59, distance: 7, direction: -1, finish: 63 }),
    [61, 62, 63, 62, 61, 60, 59]
  );
});

test('movement animation supports backward movement without inventing a bounce', () => {
  assert.deepEqual(
    movementPath({ from: 59, to: 55, distance: 4, direction: -1, finish: 63 }),
    [58, 57, 56, 55]
  );
});
