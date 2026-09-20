// SPDX-License-Identifier: GPL-3.0-or-later
import assert from 'node:assert/strict';
import { GlibcRand } from '../public/src/rng.js';
import { createHistoricalRuntime, settleHistoricalRuntime } from '../public/src/historical-runtime.js';

const rng = new GlibcRand(1);
const runtime = createHistoricalRuntime({ rng, startupSeed: 12345, galaxySeed: 54321, objects: 6 });
assert.equal(rng.index, 408, 'galaxy creation must consume 408 post-reseed rand() calls');

const counts = { wrap: 0, wormReset: 0, starReset: 0 };
const before = rng.index;
const frames = settleHistoricalRuntime(runtime, 1000, (e) => {
  if (e.event !== 'rng') return;
  if (e.site.endsWith('.wrap')) counts.wrap += 1;
  if (e.site.endsWith('.reset.angle')) counts.wormReset += 1;
  if (e.site.startsWith('Star') && e.site.endsWith('.blink.reset')) counts.starReset += 1;
});

assert.equal(frames, 48);
assert.equal(rng.index - before, 858);
assert.equal(rng.index, 1266);
assert.deepEqual(counts, { wrap: 165, wormReset: 57, starReset: 3 });
console.log('ok historical-render-rng: settle=48; visual rand=858; Storm wraps=165; Wormhole resets=57; Star resets=3');
