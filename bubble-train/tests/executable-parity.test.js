// SPDX-License-Identifier: GPL-3.0-or-later
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BUBBLE_RADIUS, BUBBLE_DIAMETER, TOUCH_THRESHOLD, BOMB_RADIUS,
  CANNON_LENGTH, ROTATION_STEP, SpiralSection
} from '../public/src/index.js';

// These invariants are backed by direct analysis of the symbolized GP2X native
// executable and normalized to the upstream/OS4 800x600 coordinate system.
test('native executable geometry constants normalize to the web 800x600 baseline', () => {
  const gp2xScale = 0.4;
  assert.equal(6 / gp2xScale, BUBBLE_RADIUS);      // GP2X radius 6 -> 15
  assert.equal(12 / gp2xScale, BUBBLE_DIAMETER); // GP2X diameter/ripple 12 -> 30
  assert.equal(24 / gp2xScale, BOMB_RADIUS);      // GP2X bomb radius 24 -> 60
  assert.equal(18 / gp2xScale, CANNON_LENGTH);   // GP2X cannon length 18 -> 45
  // Touching uses diameter + 1 on each native resolution, not a simple scale.
  assert.equal(13, 12 + 1);
  assert.equal(TOUCH_THRESHOLD, BUBBLE_DIAMETER + 1);
});

test('native executable cannon angular constants match the web port', () => {
  assert.ok(Math.abs(ROTATION_STEP - Math.PI / 60) < 1e-15);
  // Native rotateLeft/rotateRight also clamp at +/- pi/2; Cannon tests cover the clamp itself.
});

test('native executable spiral coefficient matches exp(-abs(theta)/10)', () => {
  const s = new SpiralSection({x:10,y:0}, {x:10*Math.exp(-1),y:0}, {x:0,y:0}, 'clockwise');
  assert.ok(Math.abs(s.radiusAt(10) - 10 * Math.exp(-1)) < 1e-12);
});
