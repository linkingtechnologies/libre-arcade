// What the oracle cannot say by itself: the numbers of the game against the original's source, read from the file; time that moves in
// pieces of any size; the saved game that comes back as it was; the options.
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { CONFIG } from '../public/src/core/config.js';
import { Game } from '../public/src/core/game.js';
import { JavaRandom, splitMix64 } from '../public/src/core/rng.js';
import { snapshot } from '../tools/oracle-state.mjs';
import { newGame, applyAct } from '../tools/oracle-port.mjs';
import { SCENARIOS } from '../tools/oracle-scenarios.mjs';

const ORIGINAL = new URL('../reference/milcity-blue-1.0.5/src/fr/uha/ensisa/ir/walther/milcityblue/core/', import.meta.url);
const javaNumbers = (file) => Object.fromEntries([...readFileSync(new URL(file, ORIGINAL), 'latin1').matchAll(/public static (?:final )?int (\w+) = (-?\d+);/g)].map((m) => [m[1], Number(m[2])]));

test('the costs, times, energy and production times of the nine buildings are Config.java\'s', () => {
  const config = javaNumbers('Config.java');
  const names = { missileSilo: 'MISSILESILO', shieldGenerator: 'SHIELDGENERATOR', powerPlant: 'POWERPLANT', airField: 'AIRFIELD', laboratory: 'LABORATORY', factory: 'FACTORY', house: 'HOUSE', commercial: 'COMMERCIAL', nukeSilo: 'NUKESILO' };
  const production = { missileSilo: 'MISSILE', shieldGenerator: 'SHIELD', powerPlant: 'NULL', airField: 'AIRCRAFT', laboratory: 'SPY', factory: 'MORTAR', house: 'NULL', commercial: 'NULL', nukeSilo: 'NUKE' };
  for (const [key, def] of Object.entries(CONFIG.buildings)) {
    assert.equal(def.cost, config[`CONSTRUCTION_COST_${names[key]}`], `${key} cost`);
    assert.equal(def.build, config[`CONSTRUCTION_TIME_${names[key]}`], `${key} construction time`);
    assert.equal(def.energy, config[`ENERGY_${names[key]}`], `${key} energy`);
    assert.equal(def.production, config[`PRODUCTION_TIME_${production[key]}`], `${key} production time`);
  }
});

test('the sizes, the numbers of the buildings and weapons, and the rules of the economy are the original\'s', () => {
  const building = javaNumbers('Building.java'), weapon = javaNumbers('Weapon.java'), config = javaNumbers('Config.java');
  const names = { missileSilo: 'MISSILESILO', shieldGenerator: 'SHIELDGENERATOR', powerPlant: 'POWERPLANT', airField: 'AIRFIELD', laboratory: 'LABORATORY', factory: 'FACTORY', house: 'HOUSE', commercial: 'COMMERCIAL', nukeSilo: 'NUKESILO' };
  for (const [key, def] of Object.entries(CONFIG.buildings)) {
    assert.equal(def.w, building[`SIZE_${names[key]}_X`], `${key} width`);
    assert.equal(def.h, building[`SIZE_${names[key]}_Y`], `${key} height`);
    assert.equal(def.id, building[`BUILDING_${names[key]}`], `${key} number`);
  }
  for (const [key, def] of Object.entries(CONFIG.weapons)) {
    assert.equal(def.w, weapon[`SIZE_${key.toUpperCase()}_X`], `${key} width`);
    assert.equal(def.h, weapon[`SIZE_${key.toUpperCase()}_Y`], `${key} height`);
    assert.equal(def.id, weapon[`WEAPON_${key.toUpperCase()}`], `${key} number`);
  }
  assert.equal(CONFIG.gridWidth, config.DEFAULT_GRID_SIZE_X);
  assert.equal(CONFIG.gridHeight, config.DEFAULT_GRID_SIZE_Y);
  assert.equal(CONFIG.scoreToWin, config.DEFAULT_SCORE_TO_WIN);
  assert.equal(CONFIG.moneyAtStart, config.DEFAULT_MONEY_AT_START);
  assert.equal(CONFIG.waterPercent, config.DEFAULT_PERCENT_OF_WATER);
  assert.equal(CONFIG.moneyPerCommercialPerSecond, config.MONEY_EARNED_PER_SECOND);
  assert.equal(CONFIG.accelerationPerHouse, config.ACCELERATION_FACTOR_PER_HOUSE);
  assert.equal(CONFIG.maxBelowZeroSeconds, config.MAX_TIME_BELLOW_ZERO);
});

test('java.util.Random: the numbers the platform gives for known seeds', () => {
  // the values of new java.util.Random(seed).nextInt(bound) on Java 8 (1.8.0_503), 12 October 2026
  const draw = (seed, bound, n) => { const r = new JavaRandom(seed); return Array.from({ length: n }, () => r.nextInt(bound)); };
  assert.deepEqual(draw(42, 100, 5), [30, 63, 48, 84, 70]);
  assert.deepEqual(draw(0, 10, 3), [0, 8, 9]);
  assert.deepEqual(draw(7, 4, 4), [2, 2, 2, 0]); // a power of two takes the other path
  assert.deepEqual(draw(-123456789012345, 30, 4), [4, 19, 26, 10]); // a seed below zero
});

test('SplitMix64: the same sequence the Java oracle takes its seeds from', () => {
  const s = splitMix64(0);
  assert.equal(s.next(), 16294208416658607535n); // the first output of SplitMix64 for seed 0
  assert.equal(s.next(), 7960286522194355700n);
});

test('time can be moved in pieces of any size and the game is the same', () => {
  const spec = SCENARIOS.find((s) => s.name === 'idle-madness');
  const states = [];
  for (const piece of [1, 7, 100, 999, 1000, 4321]) {
    const game = newGame(spec);
    const end = 90000;
    for (let t = 0; t < end; t += piece) game.advance(Math.min(piece, end - t));
    game.vibrations.length = 0;
    states.push(snapshot(game));
  }
  for (const state of states) assert.equal(state, states[0]);
});

test('a saved game comes back as it was and plays on the same', () => {
  const spec = { ...SCENARIOS.find((s) => s.name === 'warrior-hard'), slots: 1800 };
  const make = () => newGame(spec);
  const sequence = (from) => { let n = from; return () => new JavaRandom(n++); };
  const a = make();
  // the human's actions of the scenario at the times they happen, as far as the save
  const acts = [[10, 'build', 103, 12, 12], [100, 'build', 108, 12, 14], [400, 'build', 101, 15, 12], [700, 'build', 106, 18, 18]];
  const play = (game, from, to) => {
    for (let slot = from; slot <= to; slot++) {
      game.advance(100 * slot - game.time);
      for (const act of acts) if (act[0] === slot) applyAct(game, act.slice(1));
    }
  };
  play(a, 0, 600);
  a.fresh = sequence(1000);
  const saved = JSON.parse(JSON.stringify(a.saveState()));
  const b = Game.fromState(saved);
  b.fresh = sequence(1000);
  for (const ai of b.ais) ai.fresh = b.fresh;
  for (const ai of a.ais) ai.fresh = a.fresh;
  assert.equal(snapshot(b), snapshot(a), 'as it was when saved');
  play(a, 601, 1500);
  play(b, 601, 1500);
  assert.equal(snapshot(b), snapshot(a), 'and as it goes on');
});

test('the options move by the steps of the original\'s menu', () => {
  // MilCityBlue.commandAction(): water +5 up to 95 then 5, score +500 up to 10000 then 500, money +50 up to 1000 then 50
  const app = readFileSync(new URL('../public/src/ui/app.js', import.meta.url), 'utf8');
  assert.match(app, /settings\.water\+=5;if\(settings\.water>95\)settings\.water=5;/);
  assert.match(app, /settings\.maxScore\+=500;if\(settings\.maxScore>10000\)settings\.maxScore=500;/);
  assert.match(app, /settings\.money\+=50;if\(settings\.money>1000\)settings\.money=50;/);
});
