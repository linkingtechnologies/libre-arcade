import test from 'node:test';
import assert from 'node:assert/strict';
import { fittedBoardSize } from '../public/src/ui/layout.js';

test('desktop board fits a short 629px viewport instead of following the wide column', () => {
  assert.equal(fittedBoardSize({ availableWidth: 900, wrapTop: 222, viewportHeight: 629, bottomGap: 18 }), 389);
});

test('board still uses the full available column on a tall viewport', () => {
  assert.equal(fittedBoardSize({ availableWidth: 760, wrapTop: 190, viewportHeight: 1100, bottomGap: 20 }), 760);
});

test('very short viewports keep a minimum usable board and fall back to page scrolling', () => {
  assert.equal(fittedBoardSize({ availableWidth: 700, wrapTop: 220, viewportHeight: 400, bottomGap: 20 }), 260);
});
