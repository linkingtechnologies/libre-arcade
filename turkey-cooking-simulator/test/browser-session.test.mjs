// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
// SPDX-License-Identifier: GPL-3.0-only

// A game played on the page, checked against the original. test/fixtures/browser-session.json is the save (the page's own localStorage entry)
// of a Casual game played in headless Chrome on 18 October 2026: a Free Range Turkey (12.2 lb), the oven at 350, 400, 325 and 338 F (170 C, set
// in Celsius), five "Skip 20 min" presses, the door opened fully for about seven real seconds with the probe read, and the real seconds between
// the presses, 6,019 thermal ticks in all. The page recorded each thing it did in `actionLog`.
//
// The log is replayed twice, tick by tick, with every "set-oven" a changeTemp and every thermal tick a secondTick (a skip is 1200 ticks, in
// the original too), and with the door as the original's ui.js has it: opening it fully takes 3 C off the oven's air at once, and each tick
// while it stays open takes 1 C off before the tick (never below 20 C). It is replayed on the port's PreservationOvenModel and on the original's
// js/model.js. Each must reach the browser's state: the three layers' temperatures, highest temperatures and conditions, the oven's raw
// temperature and the cook time.
//
// The comparison is to 1e-12 (relative), not bit for bit, because the browser is another JavaScript engine than the one running this test
// (Chrome and Node's V8 can round Math.pow, Math.exp or Math.sin one unit in the last place apart). Inside one engine the port and the original
// agree exactly (test/model-oracle.test.mjs).
//
// Not used: the port's own `replayActionLog`. It re-runs the log through the fixed-step clock from the logged wall-clock times, and does not
// put the ticks where the live page did, because the page moves the clock's last wall time itself when it starts cooking and after a skip.
// Saving and resuming do not use replay (they store the state).
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PreservationOvenModel, fToC } from '../public/js/thermal-model.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const session = JSON.parse(readFileSync(join(ROOT, 'test', 'fixtures', 'browser-session.json'), 'utf8'));
const LAYERS = ['skin', 'body', 'core'];
const close = (actual, expected, what) => assert.ok(Math.abs(actual - expected) <= 1e-12 * Math.max(1, Math.abs(expected)), `${what}: ${actual} != ${expected}`);
const sameCondition = (actual, expected, what) => { assert.equal(actual[0], expected[0], what); assert.equal(actual[2], expected[2], what); close(actual[1], expected[1], what); };

// Replays the log on any model with the original's interface (changeTemp, setRawTemp, getRawTemp, secondTick); returns the number of ticks.
function replay(model, toCelsius) {
  let doorOpen = false;
  let ticks = 0;
  const tick = (n) => {
    for (let i = 0; i < n; i++) {
      if (doorOpen) model.setRawTemp(Math.max(20, model.getRawTemp() - 1));
      model.secondTick();
      ticks++;
    }
  };
  for (const e of session.actionLog) {
    if (e.type === 'set-oven') model.changeTemp(toCelsius(e.tempF));
    else if (e.type === 'advance-wall-clock' || e.type === 'skip-20m') tick(e.thermalTicks);
    else if (e.type === 'door-full') {
      const opens = e.doorState === 'open';
      if (opens && !doorOpen) model.setRawTemp(Math.max(20, model.getRawTemp() - 3));
      doorOpen = opens;
    } else if (e.type === 'door-peek') doorOpen = e.doorState === 'open';
  }
  return ticks;
}

test('the fixture is a Casual game of 6,019 thermal ticks with the door opened once and five oven set points', () => {
  assert.equal(session.schemaVersion, 2);
  assert.equal(session.ovenState.schemaVersion, 3);
  assert.equal(session.game.turkeyCookCounter, 6019);
  assert.equal(session.actionLog.reduce((n, e) => n + (e.thermalTicks ?? 0), 0), 6019);
  assert.deepEqual(session.actionLog.filter((e) => e.type.startsWith('door')).map((e) => `${e.type}:${e.doorState}`), ['door-full:open', 'door-full:peek']);
  assert.deepEqual([...new Set(session.actionLog.filter((e) => e.type === 'set-oven').map((e) => Math.round(e.tempF)))].sort((a, b) => a - b), [325, 338, 350, 375, 400]);
});

test("replaying the log on the port's thermal model gives the state the browser had", () => {
  const oven = new PreservationOvenModel(session.game.turkeyWeight);
  assert.equal(replay(oven, fToC), 6019);
  const state = oven.exportState();
  for (const layer of LAYERS) {
    close(state.layers[layer].finalTemperature, session.ovenState.layers[layer].finalTemperature, `${layer} temperature`);
    close(state.layers[layer].highestTemp, session.ovenState.layers[layer].highestTemp, `${layer} highest temperature`);
    sameCondition(state.layers[layer].condition, session.ovenState.layers[layer].condition, `${layer} condition`);
    close(state.layers[layer].waterLost, session.ovenState.layers[layer].waterLost, `${layer} water lost`);
  }
  assert.equal(state.globalTime, session.ovenState.globalTime);
  close(state.tempInfini, session.ovenState.tempInfini, 'oven raw temperature');
  state.globTemp.forEach((t, i) => close(t, session.ovenState.globTemp[i], `point ${i}`));
});

test("replaying the log on the original's model.js gives the browser's temperatures and conditions", () => {
  const source = readFileSync(join(ROOT, 'reference', 'original', 'js', 'model.js'), 'utf8');
  const { OvenModel, UtilityFunctions } = new Function('DEBUG', 'console', `${source}\n;return { OvenModel, UtilityFunctions };`)(false, { log() {} });
  const original = new OvenModel(session.game.turkeyWeight, { pubsub: { publish() {} } });
  assert.equal(replay(original, (f) => UtilityFunctions.F2C(f)), 6019);
  const state = original.getTurkeyState();
  for (const layer of LAYERS) {
    close(state[layer].temp, session.ovenState.layers[layer].finalTemperature, `${layer} temperature`);
    close(state[layer].highest, session.ovenState.layers[layer].highestTemp, `${layer} highest temperature`);
    sameCondition([...state[layer].cond], session.ovenState.layers[layer].condition, `${layer} condition`);
  }
  close(original.getRawTemp(), session.ovenState.tempInfini, 'oven raw temperature');
  assert.equal(original.getCookTime(), session.ovenState.globalTime);
});
