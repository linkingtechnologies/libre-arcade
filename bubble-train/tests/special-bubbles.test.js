// SPDX-License-Identifier: GPL-3.0-or-later
import test from 'node:test';
import assert from 'node:assert/strict';
import { Bubble, SPECIAL, SeededRng, BulletFactory, CarriageFactory } from '../public/src/index.js';

class FixedRng {
  constructor(uints = [], ints = []) { this.uints = [...uints]; this.ints = [...ints]; }
  nextUint32() { return this.uints.shift() ?? 0; }
  nextInt(max) { return (this.ints.shift() ?? 0) % max; }
  nextFloat() { return this.nextUint32() / 0x100000000; }
}

test('rainbow changes immediately, then every 16 animate calls as source actually does', () => {
  const rng = new FixedRng([], [2, 4]);
  const b = Bubble.special(SPECIAL.RAINBOW, rng, { maxColours: 5 });
  b.animate({ nowMs: 0, rng });
  assert.equal(b.colour, 2);
  for (let i = 0; i < 15; i++) b.animate({ nowMs: i + 1, rng });
  assert.equal(b.colour, 2);
  b.animate({ nowMs: 16, rng });
  assert.equal(b.colour, 4);
});

test('speed bubble uses source integer-scaled random buckets and inverse duration', () => {
  const slow = Bubble.special(SPECIAL.SPEED, new FixedRng([0]), { nowMs: 100 });
  assert.equal(slow.speedAdjustment, -1.5);
  assert.equal(slow.effectLife, 3);
  const half = Bubble.special(SPECIAL.SPEED, new FixedRng([0x60000000]), { nowMs: 100 });
  assert.equal(half.speedAdjustment, -0.5);
  assert.equal(half.effectLife, 10);
  const fast = Bubble.special(SPECIAL.SPEED, new FixedRng([0xc0000000]), { nowMs: 100 });
  assert.equal(fast.speedAdjustment, 0.5);
  assert.equal(fast.effectLife, 10);
});

test('speed timer starts only when requested and expires to a random normal colour', () => {
  const rng = new FixedRng([0x60000000], [3]);
  const b = Bubble.special(SPECIAL.SPEED, rng, { nowMs: 0, maxColours: 5 });
  b.animate({ nowMs: 20000, rng });
  assert.equal(b.special, SPECIAL.SPEED, 'factory-created speed bubble timer is disabled');
  b.startTimer(1000);
  b.animate({ nowMs: 10999, rng });
  assert.equal(b.special, SPECIAL.NORMAL);
  assert.equal(b.colour, 3);
  assert.equal(b.speedAdjustment, 1);
});

test('bullet factory keeps normal colours effectively infinite while special quotas exhaust', () => {
  // Force rainbow slot 6 first, then colour slot 0 twice.
  const rng = new FixedRng([], [6, 0, 0]);
  const f = new BulletFactory({ colourCount: 2, explicit: [{ type: 'SFX_RAINBOW', special: 'true', number: 1 }] }, rng);
  assert.equal(f.nextBubble().special, SPECIAL.RAINBOW);
  assert.equal(f.slots[6], 0);
  assert.equal(f.nextBubble().special, SPECIAL.NORMAL);
  assert.equal(f.nextBubble().special, SPECIAL.NORMAL);
  assert.ok(f.slots[0] < -1);
});

test('random carriage factory can include finite source-style speed specials and still prevents generated triples', () => {
  const f = new CarriageFactory({
    colourCount: 3,
    count: 40,
    random: true,
    explicit: [{ type: 'SFX_SPEED', special: 'true', number: 2 }]
  }, new SeededRng(0x12345678));
  const bubbles = [];
  while (!f.empty) bubbles.push(f.nextBubble());
  assert.ok(bubbles.filter(b => b.special === SPECIAL.SPEED).length <= 2);
  for (let i = 2; i < bubbles.length; i++) {
    assert.ok(!(bubbles[i].colour === bubbles[i - 1].colour && bubbles[i - 1].colour === bubbles[i - 2].colour));
  }
});
