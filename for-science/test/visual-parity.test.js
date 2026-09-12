import test from 'node:test';
import assert from 'node:assert/strict';
import { attackVisualSpec } from '../public/src/core/effects.js';
import { explosionVisualState } from '../public/src/render/canvas-renderer.js';

test('meteorite orientation follows the exact upstream effect selection', () => {
  const x = attackVisualSpec(2, 0, 0);
  const z = attackVisualSpec(2, 1, 0);
  assert.deepEqual(x.sourceBottom, [0, 480]);
  assert.equal(x.flipX, true, 'Dr X uses flip_x=True meteorite_right upstream');
  assert.deepEqual(z.sourceBottom, [640, 480]);
  assert.equal(z.flipX, false, 'Dr Z uses the unflipped meteorite_left upstream');
});

test('cow and rocket effect transforms match upstream sides', () => {
  assert.deepEqual(attackVisualSpec(1, 0, -7), {
    sourceBottom: [75, 40], targetBottom: [565, 68], duration: 2000, flipX: true, rotateTurns: 2,
  });
  assert.equal(attackVisualSpec(3, 0, 0).flipX, false);
  assert.equal(attackVisualSpec(3, 1, 0).flipX, true);
});

test('explosion reproduces the Cocos parallel-action early-kill quirk', () => {
  assert.deepEqual(explosionVisualState(0), { opacity: 1, scale: 1 });
  assert.deepEqual(explosionVisualState(1000), { opacity: 1, scale: 1.1 });
  assert.deepEqual(explosionVisualState(1500), { opacity: 0.75, scale: 1.15 });
  assert.deepEqual(explosionVisualState(2000), { opacity: 0.5, scale: 1.2 });
});
