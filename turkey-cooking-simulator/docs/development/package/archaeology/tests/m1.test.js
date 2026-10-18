import assert from 'node:assert/strict';
import fs from 'node:fs';
import { PreservationOvenModel, fToC, simulateBaseline } from '../src/js/thermal-model.js';
import { scenarios } from './scenarios.js';

const oracle = JSON.parse(fs.readFileSync(new URL('./oracle.json', import.meta.url), 'utf8'));
const ABS_TOL = 1e-10;
const REL_TOL = 1e-11;

function close(actual, expected, label) {
  const delta = Math.abs(actual - expected);
  const limit = Math.max(ABS_TOL, Math.abs(expected) * REL_TOL);
  assert.ok(delta <= limit, `${label}: ${actual} != ${expected} (delta=${delta}, limit=${limit})`);
}
function compareState(actual, expected, id) {
  for (const layer of ['skin','body','core']) {
    close(actual[layer].tempC, expected[layer].tempC, `${id}.${layer}.tempC`);
    close(actual[layer].waterLost, expected[layer].waterLost, `${id}.${layer}.waterLost`);
    assert.deepEqual(actual[layer].condition, expected[layer].condition, `${id}.${layer}.condition`);
  }
  close(actual.oven.rawTempC, expected.oven.rawTempC, `${id}.oven.rawTempC`);
  close(actual.oven.steadyTempC, expected.oven.steadyTempC, `${id}.oven.steadyTempC`);
  assert.equal(actual.oven.globalTime, expected.oven.globalTime, `${id}.oven.globalTime`);
  assert.equal(actual.oven.steadyTimer, expected.oven.steadyTimer, `${id}.oven.steadyTimer`);
}

for (const s of scenarios) {
  const actual = simulateBaseline(s);
  compareState(actual, oracle.tests[s.id].expected, s.id);
  console.log(`PASS ${s.id} ${s.note}`);
}

const t11 = new PreservationOvenModel(15);
t11.changeTemp(fToC(350)); t11.tickMany(1800);
compareState(t11.getTurkeyState(), oracle.tests.T11.beforeChange, 'T11.before');
t11.changeTemp(fToC(425)); t11.tickMany(900);
compareState(t11.getTurkeyState(), oracle.tests.T11.expected, 'T11.after');
console.log('PASS T11 temperature-change re-anchor');

const t12 = new PreservationOvenModel(15); t12.changeTemp(fToC(350));
let gameClockAdvanceMs = 0;
for (const diff of [1001, 5000, 1001]) { t12.secondTick(); gameClockAdvanceMs += diff; }
compareState(t12.getTurkeyState(), oracle.tests.T12.expected.thermalState, 'T12');
assert.equal(gameClockAdvanceMs, oracle.tests.T12.expected.gameClockAdvanceMs);
assert.equal(t12.getTurkeyState().oven.globalTime, oracle.tests.T12.expected.thermalTicks);
console.log('PASS T12 historical browser-stall semantics');

console.log(`\nM1 Preservation Core: 12/12 oracle tests passed. tolerance abs=${ABS_TOL}, rel=${REL_TOL}`);
