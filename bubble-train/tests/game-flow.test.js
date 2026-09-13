// SPDX-License-Identifier: GPL-3.0-or-later
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LevelTimer, GameSession, FastestTimesStore, compareFastest, SettingsStore,
  loadGameManifestXml, loadLevelXml
} from '../public/src/index.js';

class MemoryStorage {
  constructor() { this.map = new Map(); }
  getItem(k) { return this.map.has(k) ? this.map.get(k) : null; }
  setItem(k,v) { this.map.set(k,String(v)); }
  removeItem(k) { this.map.delete(k); }
}

const manifest = loadGameManifestXml(`<game>
  <level theme="clean" src="one.lvl"/>
  <level theme="clean" src="two.lvl"/>
</game>`);
const instantWin = loadLevelXml(`<level><cannons></cannons><trainstations>
  <train speed="1"><track><line startpos="0,0" endpos="100,0"/></track><carriages random="1" colour-num="2" carriage-num="0"/></train>
</trainstations></level>`);
const instantLose = loadLevelXml(`<level><cannons></cannons><trainstations>
  <train speed="60"><track><line startpos="0,0" endpos="50,0"/></track><carriages random="1" colour-num="2" carriage-num="1"/></train>
</trainstations></level>`);

test('level timer stores tenths and excludes paused wall time', () => {
  const t = new LevelTimer().start(1000);
  assert.equal(t.getTenths(1549), 5);
  t.pause(1600);
  assert.equal(t.getTenths(5000), 6, 'paused time does not advance');
  t.resume(5100);
  assert.equal(t.getTenths(5600), 11);
  assert.equal(t.stop(5655), 11);
});

test('campaign advances in .gms order and accumulates completed-level time only', () => {
  const game = new GameSession({ manifest, levelDefinitions: new Map([['one.lvl', instantWin], ['two.lvl', instantWin]]), credits: 5 });
  assert.equal(game.start(1000), 'playing');
  assert.equal(game.levelNumber, 1);
  game.tick(1450); // level model wins immediately; 4 tenths
  assert.equal(game.state, 'playing');
  assert.equal(game.levelNumber, 2);
  assert.equal(game.totalTenths, 4);
  game.tick(2000); // second level: 5 tenths
  assert.equal(game.state, 'campaign-won');
  assert.equal(game.completedLevels, 2);
  assert.equal(game.totalTenths, 9);
});

test('finite credits mean attempts: retry decrements and last credit ends the run', () => {
  const game = new GameSession({ manifest: manifest.slice(0,1), levelDefinitions: new Map([['one.lvl', instantLose]]), credits: 2 });
  game.start(0);
  game.tick(40); game.tick(80); // spawned then crashes
  assert.equal(game.state, 'level-lost');
  assert.equal(game.credits, 2);
  assert.equal(game.canRetry, true);
  assert.equal(game.retry(100), true);
  assert.equal(game.credits, 1);
  game.tick(140); game.tick(180);
  assert.equal(game.state, 'campaign-over');
  assert.equal(game.canRetry, false);
});

test('infinite credits never decrement and retry remains available', () => {
  const game = new GameSession({ manifest: manifest.slice(0,1), levelDefinitions: new Map([['one.lvl', instantLose]]), credits: -1 });
  game.start(0); game.tick(40); game.tick(80);
  assert.equal(game.state, 'level-lost');
  assert.equal(game.retry(100), true);
  assert.equal(game.credits, -1);
});

test('pause blocks game simulation and excludes pause from level timer', () => {
  const game = new GameSession({ manifest: manifest.slice(0,1), levelDefinitions: new Map([['one.lvl', instantLose]]) });
  game.start(1000);
  const frame = game.level.frame;
  game.pause(1200);
  game.tick(9000);
  assert.equal(game.level.frame, frame);
  assert.equal(game.getLevelTenths(9000), 2);
  game.resume(9200);
  assert.equal(game.getLevelTenths(9300), 3);
});

test('fastest-time ordering is higher progress first, then lower cumulative time', () => {
  const records = [
    {completedLevels:2,totalTenths:900},
    {completedLevels:3,totalTenths:5000},
    {completedLevels:2,totalTenths:700}
  ].sort(compareFastest);
  assert.deepEqual(records.map(r=>[r.completedLevels,r.totalTenths]), [[3,5000],[2,700],[2,900]]);
});

test('fastest-time store persists its new browser format and limits the table', () => {
  const storage = new MemoryStorage();
  const store = new FastestTimesStore({storage,limit:2});
  store.add({completedLevels:1,totalTenths:50,totalLevels:3,seed:1,finishedAt:30});
  store.add({completedLevels:2,totalTenths:90,totalLevels:3,seed:2,finishedAt:40});
  store.add({completedLevels:2,totalTenths:70,totalLevels:3,seed:3,finishedAt:50});
  assert.deepEqual(store.list().map(r=>r.totalTenths),[70,90]);
  const reload = new FastestTimesStore({storage,limit:2});
  assert.deepEqual(reload.list().map(r=>r.seed),[3,2]);
});

test('settings persist IT/EN, campaign, credits including infinite, and sound', () => {
  const storage = new MemoryStorage();
  const s = new SettingsStore({storage});
  assert.equal(s.value.language,'en');
  s.update({language:'it',campaign:'hard',credits:-1,sound:false});
  const r = new SettingsStore({storage});
  assert.deepEqual(r.value,{language:'it',campaign:'hard',credits:-1,sound:false});
});

test('terminal campaign result is inserted into fastest-times store once', () => {
  const storage = new MemoryStorage();
  const scoreStore = new FastestTimesStore({storage});
  const game = new GameSession({ manifest: manifest.slice(0,1), levelDefinitions: new Map([['one.lvl', instantWin]]), fastestTimes: scoreStore, game:'Easy.gms' });
  game.start(0); game.tick(350);
  assert.equal(game.state,'campaign-won');
  assert.equal(scoreStore.list().length,1);
  assert.equal(scoreStore.list()[0].game,'Easy.gms');
  game.finalizeRun(999,true);
  assert.equal(scoreStore.list().length,1);
});

test('retry uses a new deterministic attempt stream while preserving run seed', () => {
  const game = new GameSession({ manifest: manifest.slice(0,1), levelDefinitions: new Map([['one.lvl', instantLose]]), credits:-1, seed:123 });
  game.start(0); const first = game.level.rng.state;
  game.tick(40); game.tick(80); game.retry(100); const second = game.level.rng.state;
  assert.notEqual(first,second);
  assert.equal(game.seed,123);
});
