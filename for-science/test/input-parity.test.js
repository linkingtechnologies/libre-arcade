import test from 'node:test';
import assert from 'node:assert/strict';
import { virtualToBoardPoint, virtualToHumanAssetIndex } from '../public/src/render/canvas-renderer.js';

test('board hit test reproduces Cocos int() + floor-division edge behavior', () => {
  assert.deepEqual(virtualToBoardPoint(150, 0), { x: 0, y: 0 });
  assert.deepEqual(virtualToBoardPoint(183.9, 33), { x: 0, y: 0 });
  // Because upstream truncates bottom-left y before //34, any fractional y
  // just below the visual 34px boundary is already the next row.
  assert.deepEqual(virtualToBoardPoint(183.9, 33.01), { x: 0, y: 1 });
  assert.deepEqual(virtualToBoardPoint(184, 34), { x: 1, y: 1 });
  assert.equal(virtualToBoardPoint(149.9, 10), null);
  assert.equal(virtualToBoardPoint(490, 10), null);
});

test('human asset hit boxes follow screen_to_asset int() boundaries exactly', () => {
  assert.equal(virtualToHumanAssetIndex(90, 136), 0);
  assert.equal(virtualToHumanAssetIndex(121.9, 169), 0);
  assert.equal(virtualToHumanAssetIndex(90, 169.01), 1);
  assert.equal(virtualToHumanAssetIndex(90, 203), 1);
  assert.equal(virtualToHumanAssetIndex(90, 305), 4);
  assert.equal(virtualToHumanAssetIndex(89.9, 150), null);
  assert.equal(virtualToHumanAssetIndex(122, 150), null);
});
