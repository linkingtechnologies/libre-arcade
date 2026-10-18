// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
// SPDX-License-Identifier: GPL-3.0-only

// Level 1 for the original's score screen and market: the original's own code, unmodified, is run with the browser pieces it needs replaced by stubs,
// and what it computes is compared with the port.
//
// - ScoreScreen (reference/original/js/screens.js) is run as it is. It needs `createjs` (Bitmap, Text, Shape...), a `Button`, a `document`, the
//   dialogue arrays of stories.js (not kept: stand-in strings), a stage, a gameState (pub/sub, the turkey's state, the modifiers) and
//   UtilityFunctions (model.js, as it is). The stubs record every createjs.Text; the total is the 32 px one, the two temperature scores are
//   the 20 px ones at x = 680, y = 320 and y = 340. The pub/sub calls the end function of the "end" dialogue at once, which is what builds them.
// - The market (reference/original/js/main.js, `GameState`) cannot be run whole (it builds the whole interface). The statements that build the
//   random weights and the table of market items, from `var randomWeight` to the closing of `this.marketItems`, are cut out of the file as they
//   are and run with a `MarketItem` that records its arguments.
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { calculateLegacyScore, makeTurkeyOffers, MARKET_STATIC, TURKEY_TYPE_MODIFIERS } from '../public/js/gameplay-state.js';
import { PreservationOvenModel, fToC } from '../public/js/thermal-model.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const original = (f) => readFileSync(join(ROOT, 'reference', 'original', 'js', f), 'utf8');

// UtilityFunctions of the original's model.js (the file, as it is).
const { UtilityFunctions } = new Function('DEBUG', 'console', `${original('model.js')}\n;return { UtilityFunctions };`)(false, { log() {} });

const standIn = (n) => Array.from({ length: n }, (_, i) => `line ${i}`);

function runScoreScreen(state, modifiers) {
  const texts = [];
  const createjs = new Proxy({}, {
    get: (_, name) => {
      if (name === 'Text') return function Text(text, font) { this.text = text; this.font = font; texts.push(this); };
      return function Stub() { this.graphics = new Proxy({}, { get: () => () => ({ drawRect() {} }) }); this.addEventListener = () => {}; };
    },
  });
  const gameState = {
    turkeyCookCounter: 0, startTime: Date.now(), turkeyType: modifiers.turkeyType, stuffingTypeModifier: modifiers.stuffing,
    frillsModifier: modifiers.frills, hardcoreModifier: modifiers.hardcore, turkeyStates: [],
    ovenModel: { getTurkeyState: () => state },
    pubsub: { publish(name, arg) { if (name === 'ShowDialog' && arg.endFunc) arg.endFunc(); } },
  };
  const stage = { addChild() {}, removeChild() {} };
  const messages = {};
  const run = new Function('createjs', 'Button', 'document', 'messages', 'perfect', 'great', 'average', 'subPar', 'terrible', 'UtilityFunctions', 'console',
    `${original('screens.js')}\n;return ScoreScreen;`);
  const ScoreScreen = run(createjs, function Button() {}, {}, messages, standIn(8), standIn(8), standIn(8), standIn(8), standIn(8), UtilityFunctions, { log() {} });
  new ScoreScreen(stage, gameState);
  const total = texts.find((t) => t.font === '32px Arial');
  const at = (x, y) => texts.find((t) => t.x === x && t.y === y);
  return { total: Number(total.text), outer: Number(at(680, 320).text), core: Number(at(680, 340).text) };
}

// The turkey state the original's getTurkeyState returns, for a state of the port.
const KEYS = ['raw', 'undercooked', 'slightly cooked', 'cooked', 'overcooked', 'dry', 'burnt'];
const NAMES = { raw: 'Raw', undercooked: 'Undercooked', 'slightly cooked': 'Undercooked', cooked: 'Cooked', overcooked: 'Cooked', dry: 'Dry', burnt: 'Burnt' };
const asOriginal = (skinHighestC, skinKey, coreC, coreKey) => ({
  skin: { temp: skinHighestC, highest: skinHighestC, cond: [NAMES[skinKey], 0, skinKey] },
  core: { temp: coreC, cond: [NAMES[coreKey], 0, coreKey] },
});
const asPort = (s) => ({
  skin: { tempC: s.skin.temp, highestC: s.skin.highest, condition: s.skin.cond },
  core: { tempC: s.core.temp, condition: s.core.cond },
});

// An object that accepts any property, call and construction (the loading queue, the interface and the ticker, which the cut-out statements touch).
const deep = () => new Proxy(function () {}, { get: () => deep(), apply: () => deep(), construct: () => deep() });

function lcg(seed) {
  let s = seed >>> 0;
  return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 2 ** 32; };
}

test("the port's score is the original ScoreScreen's, over 3,000 random servings with every condition and modifier", () => {
  const next = lcg(20131201);
  const types = Object.keys(TURKEY_TYPE_MODIFIERS);
  const stuffings = [1, 1.05, 1.08, 1.17];
  for (let i = 0; i < 3000; i++) {
    const state = asOriginal(20 + next() * 220, KEYS[Math.floor(next() * 7)], 20 + next() * 160, KEYS[Math.floor(next() * 7)]);
    const type = types[Math.floor(next() * types.length)];
    const mods = { turkeyType: type, stuffing: stuffings[Math.floor(next() * 4)], frills: next() < 0.5 ? 1 : 5, hardcore: next() < 0.5 ? 1 : 20 };
    const got = runScoreScreen(state, mods);
    const score = calculateLegacyScore(asPort(state), { turkeyTypeModifier: TURKEY_TYPE_MODIFIERS[type], stuffingTypeModifier: mods.stuffing, frillsModifier: mods.frills, hardcoreModifier: mods.hardcore });
    assert.equal(score.roundedTotal, got.total, `case ${i}: total ${score.roundedTotal} != ${got.total} (${JSON.stringify([state, mods])})`);
    assert.equal(score.components.outerTempScore, got.outer, `case ${i}: skin temperature score`);
    assert.equal(score.components.coreTempScore, got.core, `case ${i}: core temperature score`);
  }
});

test("the port's score is the original's for states that the model itself reaches (a turkey cooked for an hour and a half to three hours)", () => {
  for (const [weight, f, seconds] of [[10.1, 325, 5400], [12.2, 350, 9000], [18.5, 400, 10800]]) {
    const oven = new PreservationOvenModel(weight);
    oven.changeTemp(fToC(f));
    oven.tickMany(seconds);
    const s = oven.getTurkeyState();
    const state = { skin: { temp: s.skin.tempC, highest: s.skin.highestC, cond: s.skin.condition }, core: { temp: s.core.tempC, cond: s.core.condition } };
    const got = runScoreScreen(state, { turkeyType: 'General Turkey', stuffing: 1, frills: 1, hardcore: 1 });
    assert.equal(calculateLegacyScore(s).roundedTotal, got.total, `${weight} lb at ${f} F for ${seconds} s`);
  }
});

test("the market: the original's prices, kinds and the rule price = weight x multiplier are the port's, for random weights", () => {
  const source = original('main.js');
  const from = source.indexOf('var randomWeight');
  const marker = source.indexOf('General Turkey', source.indexOf('this.marketItems'));
  const to = source.indexOf('};', marker) + 2;
  assert.ok(from > 0 && to > from);
  const body = source.slice(from, to);
  const next = lcg(77);
  for (let round = 0; round < 50; round++) {
    const seen = {};
    const MarketItem = function (_state, name, _x, _y, cost, _a, _b, _c, _d, _text, weight) { seen[name] = { cost, weight }; };
    const utility = { randRange: (min, max) => Math.floor(next() * (max - min + 1)) + min };
    new Function('UtilityFunctions', 'MarketItem', 'createjs', 'GameUI', 'gameLoop', `var that = {};\n${body.replace(/this\.marketItems/, 'that.marketItems').replace(/\bthis\b/g, 'that')}\n;return that.marketItems;`)(utility, MarketItem, deep(), deep(), deep());
    const turkeys = ['Organic Turkey', 'Free Range Turkey', 'Sunny Farms Turkey', 'Pastured Turkey', 'General Turkey'];
    const weights = turkeys.map((n) => seen[n].weight);
    weights.forEach((w) => assert.ok(w >= 10.1 && w <= 22.99));
    const offers = makeTurkeyOffers(weights);
    turkeys.forEach((n) => {
      assert.equal(offers[n].cost, seen[n].cost, `${n} price`);
      assert.equal(offers[n].weightLb, seen[n].weight, `${n} weight`);
    });
    for (const [name, item] of Object.entries(MARKET_STATIC)) assert.equal(item.cost, seen[name].cost, `${name} price`);
  }
});
