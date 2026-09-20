// SPDX-License-Identifier: GPL-3.0-or-later
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { GlibcRand } from '../public/src/rng.js';
import { createHistoricalRuntime, settleHistoricalRuntime } from '../public/src/historical-runtime.js';
import { createHistoricalUfos, searchUntilFound } from '../public/src/ai.js';

const fixture = JSON.parse(fs.readFileSync(new URL('../oracle/m3-native-ai-fixture.json', import.meta.url), 'utf8'));
const rng = new GlibcRand(1);
const runtime = createHistoricalRuntime({ rng, startupSeed: fixture.startup_seed, galaxySeed: fixture.galaxy_seed, objects: fixture.objects });
settleHistoricalRuntime(runtime);
const { state } = searchUntilFound({ runtime, ufos: createHistoricalUfos(), factor: fixture.factor, maxFrames: 20 });

assert.equal(state.attempts.length, 7);
for (let i = 0; i < fixture.candidates.length; i += 1) {
  const a = state.attempts[i];
  const e = fixture.candidates[i];
  assert.equal(a.searchesRemaining, e.searches_remaining, `candidate ${i} search counter`);
  assert.equal(a.y, e.y, `candidate ${i} y`);
  assert.equal(a.power, e.power, `candidate ${i} power`);
  assert.equal(a.angle, e.angle, `candidate ${i} angle must be bit-identical JS/C++`);
  assert.equal(a.found, e.found, `candidate ${i} result`);
}
assert.equal(rng.index, fixture.rng_index_after_seventh_candidate);
console.log('ok ai-oracle: 7/7 candidates exact; candidate #7 accepted; rng index=1397');
