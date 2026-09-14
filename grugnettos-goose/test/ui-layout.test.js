import test from 'node:test';
import assert from 'node:assert/strict';
import { spiralCoordinates } from '../public/src/ui/boardLayout.js';

test('8x8 spiral contains 64 unique board positions', () => {
  const coords = spiralCoordinates(8);
  assert.equal(coords.length, 64);
  assert.equal(new Set(coords.map(([r, c]) => `${r},${c}`)).size, 64);
  assert.deepEqual(coords[0], [7, 0]);
});

test('square 63 finishes beside the decorative center medallion', () => {
  const coords = spiralCoordinates(8);
  const finish = coords[62];
  const medallion = coords[63];
  const manhattan = Math.abs(finish[0] - medallion[0]) + Math.abs(finish[1] - medallion[1]);
  assert.equal(manhattan, 1);
});
