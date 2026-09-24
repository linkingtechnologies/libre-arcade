import test from 'node:test';
import assert from 'node:assert/strict';
import {clearLocalData,loadBindings,loadScores,saveBindings,saveScores,DEFAULT_BINDINGS,ORIGINAL_HIGHSCORES,BINDINGS_KEY,SCORES_KEY} from '../public/src/storage.js';

test('M11 reset deletes only Asteroids Infinity storage and restores defaults',()=>{
  const map=new Map([['other-app-key','preserve me']]);
  const store={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)};
  assert.equal(saveBindings(store,{...DEFAULT_BINDINGS,up:'KeyW'}),true);
  assert.equal(saveScores(store,ORIGINAL_HIGHSCORES.map((r,i)=>i===0?{score:9999,name:'PLAYER'}:{...r})),true);
  assert.ok(map.has(BINDINGS_KEY)&&map.has(SCORES_KEY));
  assert.equal(clearLocalData(store),true);
  assert.equal(map.get('other-app-key'),'preserve me');
  assert.ok(!map.has(BINDINGS_KEY)&&!map.has(SCORES_KEY));
  assert.deepEqual(loadBindings(store),DEFAULT_BINDINGS);
  assert.deepEqual(loadScores(store),ORIGINAL_HIGHSCORES);
});
test('M11 reset fails safely when browser storage is unavailable',()=>{
  assert.equal(clearLocalData(null),false);
  assert.equal(clearLocalData({getItem(){},setItem(){}}),false);
  const map=new Map(); const store={getItem:k=>map.get(k),setItem:(k,v)=>map.set(k,v),removeItem(){throw new Error('denied')}};
  store.setItem(BINDINGS_KEY,'keep');
  assert.equal(clearLocalData(store),false);
  assert.equal(map.get(BINDINGS_KEY),'keep');
});
