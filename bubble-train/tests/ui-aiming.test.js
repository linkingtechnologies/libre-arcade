// SPDX-License-Identifier: GPL-3.0-or-later
import test from 'node:test';
import assert from 'node:assert/strict';
import { Cannon, ROTATION_STEP, cannonCanvasRotation } from '../public/src/index.js';

test('left input angle aims projectile and barrel tip to the left', () => {
  const cannon = new Cannon({ position: { x: 400, y: 575 } });
  cannon.rotate(ROTATION_STEP);
  assert.ok(cannon.angle > 0);
  assert.ok(cannon.barrelPosition().x < cannon.position.x);
  assert.ok(cannonCanvasRotation(cannon.angle) < 0, 'Canvas must visually rotate left for positive source angle');
});

test('right input angle aims projectile and barrel tip to the right', () => {
  const cannon = new Cannon({ position: { x: 400, y: 575 } });
  cannon.rotate(-ROTATION_STEP);
  assert.ok(cannon.angle < 0);
  assert.ok(cannon.barrelPosition().x > cannon.position.x);
  assert.ok(cannonCanvasRotation(cannon.angle) > 0, 'Canvas must visually rotate right for negative source angle');
});
