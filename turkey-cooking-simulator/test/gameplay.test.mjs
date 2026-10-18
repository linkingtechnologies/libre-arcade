// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
// SPDX-License-Identifier: GPL-3.0-only

// What the original's ui.js (the door) and screens.js (the score) do, which cannot be run without CreateJS and a browser, checked against
// numbers worked out by hand from the original's source in reference/original/js (Level 3, specs/port-map.md).
import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateLegacyScore, scoreDistribution, SKIN_SCORE_CHART, CORE_SCORE_CHART } from '../public/js/gameplay-state.js';
import { GameSession } from '../public/js/game-session.js';
import { HeadlessGameState } from '../public/js/gameplay-state.js';
import { DoorState } from '../public/js/runtime.js';
import { fToC } from '../public/js/thermal-model.js';

const turkey = (skinHighestF, skinKey, coreF, coreKey) => ({
  skin: { highestC: fToC(skinHighestF), tempC: fToC(skinHighestF), condition: ['x', 0, skinKey] },
  core: { tempC: fToC(coreF), condition: ['x', 0, coreKey] },
});

test('the score tables are the ones of the original at 13afa12 (screens.js ScoreScreen)', () => {
  assert.deepEqual({ ...SKIN_SCORE_CHART, fire: undefined }, { raw: -1000, undercooked: -100, 'slightly cooked': 75, cooked: 500, overcooked: 200, dry: -300, burnt: -500, fire: undefined });
  assert.deepEqual({ ...CORE_SCORE_CHART, fire: undefined }, { raw: 0, undercooked: 125, 'slightly cooked': 600, cooked: 1000, overcooked: 750, dry: 400, burnt: 0, fire: undefined });
});

test('the temperature score peaks at 260 F for the skin and 165 F for the core, with a variance of 1000', () => {
  assert.equal(scoreDistribution(260, 'skin'), 1);
  assert.equal(scoreDistribution(165), 1);
  assert.ok(Math.abs(scoreDistribution(165 + Math.sqrt(2000)) - Math.exp(-1)) < 1e-12);
  assert.ok(scoreDistribution(260) < 0.02, 'without the layer the optimum is the core one, 165 F');
});

test('a perfect serving: skin cooked at its highest 260 F, core cooked at 165 F, with every modifier', () => {
  const score = calculateLegacyScore(turkey(260, 'cooked', 165, 'cooked'), { turkeyTypeModifier: 1.03, stuffingTypeModifier: 1.17, frillsModifier: 5, hardcoreModifier: 20 });
  assert.equal(score.base, 500 + 1000 + 200 + 200);
  assert.equal(score.roundedTotal, 228969);
  assert.equal(score.components.coreCondition, 1000);
});

test('the core is scored with the core table (an overcooked core is 750, not the skin table\'s 200) and a raw skin costs 1000', () => {
  const score = calculateLegacyScore(turkey(68, 'raw', 68, 'overcooked'));
  assert.equal(score.components.skinCondition, -1000);
  assert.equal(score.components.coreCondition, 750);
  assert.equal(score.components.outerTempScore, 0);
  assert.equal(score.components.coreTempScore, 2);
  assert.equal(score.base, -1000 + 750 + 0 + 2);
});

test("the skin is scored by the highest temperature it reached, not the one it has when served", () => {
  const state = turkey(260, 'cooked', 165, 'cooked');
  state.skin.tempC = fToC(120);
  assert.equal(calculateLegacyScore(state).components.outerTempScore, 200);
});

function cooking() {
  const game = new HeadlessGameState({});
  const session = new GameSession({ gameState: game, startTimeMs: 0 });
  assert.ok(session.purchase('Free Range Turkey').ok);
  assert.ok(session.startCooking().ok);
  session.setOvenF(350);
  return session;
}

test('opening the door fully takes 3 C off the oven air at once and 1 C more for each second it stays open, never below 20 C', () => {
  const session = cooking();
  session.casualSkip20Minutes();
  const before = session.oven.getRawTemp();
  assert.ok(before > 170);
  assert.equal(session.fullOpenOrCloseDoor().doorState, DoorState.OPEN);
  assert.equal(session.oven.getRawTemp(), before - 3);
  // ten seconds with the door open: 1 C off before each tick, and the oven's own heating (0.4 % of the gap to 177 C) back on it
  const afterOpen = session.oven.getRawTemp();
  session.advanceWallClock(10000);
  const gap = (t) => 176.66666666666666 - t;
  let expected = afterOpen;
  for (let i = 0; i < 10; i++) { expected -= 1; expected += gap(expected) * 0.004; }
  assert.ok(Math.abs(session.oven.getRawTemp() - expected) < 1e-9);
  // closing it (it lands on peek) stops the cooling
  assert.equal(session.fullOpenOrCloseDoor().doorState, DoorState.PEEK);
  const peekTemp = session.oven.getRawTemp();
  session.advanceWallClock(11000);
  assert.ok(session.oven.getRawTemp() > peekTemp);
});

test('a cold oven cannot be cooled below 20 C by the door', () => {
  const session = cooking();
  session.fullOpenOrCloseDoor();
  session.advanceWallClock(5000);
  assert.ok(session.oven.getRawTemp() >= 20);
});
