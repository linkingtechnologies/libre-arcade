// The game screen, as the port draws it and as the original ROM does, at every iteration of the quick scenarios of the ROM oracle
// (the same scenarios, test/fixtures/rom-oracle.json): the port and the ROM play them together, the picture the ROM would show is composed
// (tools/nes-frame.mjs) and the port's renderer (public/src/renderer.js, run in Node over tools/canvas-shim.mjs) draws the port's state, and the two
// must be identical pixel by pixel. `node tools/render-oracle.mjs --all` does the same for all 64 scenarios (119,426 frames, no difference).
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { FIXTURE } from '../tools/rom-oracle.mjs';
import { describe, renderAll } from '../tools/render-oracle.mjs';

const fixture = JSON.parse(readFileSync(FIXTURE, 'utf8'));
const results = await renderAll(fixture.quick, { maxFrames: 900 });
const frames = results.reduce((n, r) => n + r.frames, 0);
const different = results.filter((r) => r.different > 0);
assert.deepEqual(different.map(describe), [], 'the port draws something the ROM does not');
assert.ok(frames >= 3000, `only ${frames} frames were compared`);
const states = new Set(results.flatMap((r) => Object.keys(r.byState)));
for (const state of ['still', 'flipping', 'collecting', 'unflipping', 'cleared']) assert.ok(states.has(state), `no frame in state ${state}`);

console.log(`All Concentration Room game-screen render checks passed (${frames} frames of ${results.length} scenarios, identical to the ROM's).`);
