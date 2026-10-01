import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_SETTINGS, SETTINGS_KEY, clearAllLocalData, clearRecords,
  loadSettings, normalizeSettings, readBest, recordKey, saveSettings, writeBest
} from '../public/src/storage.js';

function fakeStorage(initial={}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem:k=>map.has(k)?map.get(k):null,
    setItem:(k,v)=>map.set(k,String(v)),
    removeItem:k=>map.delete(k),
    dump:()=>Object.fromEntries(map)
  };
}

test('settings defaults match historical standalone defaults', () => {
  assert.deepEqual(normalizeSettings({}), DEFAULT_SETTINGS);
});

test('invalid stored settings are normalized safely', () => {
  assert.deepEqual(normalizeSettings({lang:'xx',size:3,difficulty:9,countdownOn:'bad',countdown:0,sound:'bad'}), {
    lang:'en', size:4, difficulty:0, countdownOn:true, countdown:30, sound:true
  });
});

test('settings save/load round-trip', () => {
  const storage=fakeStorage();
  const expected={lang:'it',size:8,difficulty:4,countdownOn:false,countdown:17,sound:false};
  saveSettings(storage, expected);
  assert.deepEqual(loadSettings(storage), expected);
});

test('scores are isolated by difficulty and board size', () => {
  const storage=fakeStorage();
  writeBest(storage,2,6,41);
  assert.equal(readBest(storage,2,6),41);
  assert.equal(readBest(storage,2,8),null);
  assert.equal(readBest(storage,3,6),null);
});

test('clearRecords removes all 20 score slots but preserves settings', () => {
  const storage=fakeStorage();
  saveSettings(storage,{...DEFAULT_SETTINGS,lang:'it'});
  for(const d of [0,1,2,3,4])for(const s of [2,4,6,8])writeBest(storage,d,s,d*100+s);
  clearRecords(storage);
  assert.deepEqual(loadSettings(storage),{...DEFAULT_SETTINGS,lang:'it'});
  for(const d of [0,1,2,3,4])for(const s of [2,4,6,8])assert.equal(readBest(storage,d,s),null);
});

test('reset local data removes settings and every score then returns defaults', () => {
  const storage=fakeStorage();
  saveSettings(storage,{lang:'it',size:8,difficulty:4,countdownOn:false,countdown:99,sound:false});
  writeBest(storage,4,8,12);
  const result=clearAllLocalData(storage);
  assert.deepEqual(result,DEFAULT_SETTINGS);
  assert.equal(storage.getItem(SETTINGS_KEY),null);
  assert.equal(storage.getItem(recordKey(4,8)),null);
  assert.deepEqual(loadSettings(storage),DEFAULT_SETTINGS);
});
