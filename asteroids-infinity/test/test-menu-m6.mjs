import {test} from 'node:test';
import assert from 'node:assert/strict';
import {MenuMachine,MENU_ITEMS,CONTROL_ORDER} from '../public/src/menu.js';
import {DEFAULT_BINDINGS,ORIGINAL_HIGHSCORES,loadBindings,saveBindings,loadScores,saveScores,validScores,qualifies,insertScore,BINDINGS_KEY,SCORES_KEY} from '../public/src/storage.js';
function fakeStore(){const content=new Map();return {getItem:k=>content.get(k)??null,setItem:(k,v)=>content.set(k,v),raw:content};}
test('historic main menu four items in original order',()=>assert.deepEqual(MENU_ITEMS.menu,['play','highscores','options','quit']));
test('historic options five items in original order incl sound, fps and controls',()=>assert.deepEqual(MENU_ITEMS.options,['fullscreen','volume','fps','controls','back']));
test('six configurable actions and back in original order',()=>assert.deepEqual(MENU_ITEMS.controls,[...CONTROL_ORDER,'back']));
test('up wraps to final option, down wraps to first',()=>{const m=new MenuMachine();assert.equal(m.navigate(-1),'quit');assert.equal(m.navigate(1),'play');});
test('play selection changes mode and Escape ends game, not pause',()=>{const m=new MenuMachine();assert.equal(m.choose(),'play');assert.equal(m.screen,'play');assert.equal(m.escape(),'gameover');assert.equal(m.screen,'gameover');});
test('menu OPTIONS -> CONTROLS -> key assignment -> ESC cancel -> back -> menu',()=>{
 const m=new MenuMachine();m.navigate(1);m.navigate(1);assert.equal(m.choose(),'options');
 assert.equal(m.screen,'options');m.selected=3;assert.equal(m.choose(),'controls');
 assert.equal(m.screen,'controls');assert.equal(m.choose(),'up');assert.equal(m.binding,'up');assert.equal(m.escape(),'cancel-binding');assert.equal(m.binding,null);
 m.selected=6;assert.equal(m.choose(),'back');assert.equal(m.screen,'options');assert.equal(m.escape(),'menu');assert.equal(m.screen,'menu');
});
test('highscores and quit return to main menu',()=>{const m=new MenuMachine();m.selected=1;m.choose();assert.equal(m.screen,'highscores');m.choose();assert.equal(m.screen,'menu');m.selected=3;m.choose();assert.equal(m.screen,'quit');m.escape();assert.equal(m.screen,'menu');});
test('pause resumes independently of main menu selection',()=>{const m=new MenuMachine();m.open('pause');assert.equal(m.escape(),'play');assert.equal(m.screen,'play');});
test('original default keycodes represented by browser KeyboardEvent codes',()=>assert.deepEqual(DEFAULT_BINDINGS,{up:'ArrowUp',down:'ArrowDown',left:'ArrowLeft',right:'ArrowRight',shoot:'Space',shield:'ControlLeft'}));
test('bindings save, reload and are not stored in original controls.txt format',()=>{const store=fakeStore(),mapping={...DEFAULT_BINDINGS,shoot:'KeyQ'};assert.equal(saveBindings(store,mapping),true);assert.equal(JSON.parse(store.raw.get(BINDINGS_KEY)).version,1);assert.equal(loadBindings(store).shoot,'KeyQ');});
test('damaged, incomplete and inaccessible bindings fall back safely',()=>{const store=fakeStore();store.raw.set(BINDINGS_KEY,'{bad');assert.deepEqual(loadBindings(store),DEFAULT_BINDINGS);store.raw.set(BINDINGS_KEY,JSON.stringify({version:1,bindings:{up:'Space'}}));assert.deepEqual(loadBindings(store),DEFAULT_BINDINGS);assert.deepEqual(loadBindings({getItem(){throw Error('blocked')}}),DEFAULT_BINDINGS);assert.equal(saveBindings({setItem(){throw Error('blocked')}},DEFAULT_BINDINGS),false);});
test('historical default scores preserved in original order',()=>{assert.equal(ORIGINAL_HIGHSCORES.length,10);assert.deepEqual(ORIGINAL_HIGHSCORES[0],{score:8128,name:'PERFECT'});assert.deepEqual(ORIGINAL_HIGHSCORES[9],{score:325,name:'FOO'});});
test('highscore must exceed bottom score, not equal it',()=>{const s=loadScores(fakeStore());assert.equal(qualifies(s,325),false);assert.equal(qualifies(s,326),true);assert.equal(insertScore(s,325,'Z')[9].name,'FOO');});
test('historical uppercasing, top ten and reverse tuple sorting for ties',()=>{const s=loadScores(fakeStore());const t=insertScore(s,10000,'astro');assert.deepEqual(t[0],{score:10000,name:'ASTRO'});assert.equal(t.length,10);const u=insertScore(t,8128,'zulu');assert.equal(u[1].name,'ZULU');assert.equal(u[2].name,'PERFECT');});
test('ASCII-only name, ten-character cap and score validation',()=>{const s=loadScores(fakeStore());assert.throws(()=>insertScore(s,9999,'ABCDEFGHIJK'));assert.throws(()=>insertScore(s,9999,'è'));assert.throws(()=>insertScore(s,-1,'A'));});
test('score persistence in versioned browser JSON and corruption fallback',()=>{const store=fakeStore(),s=insertScore(loadScores(store),9000,'U');assert.equal(saveScores(store,s),true);assert.equal(JSON.parse(store.raw.get(SCORES_KEY)).version,1);assert.deepEqual(loadScores(store),s);store.raw.set(SCORES_KEY,'not json');assert.deepEqual(loadScores(store),ORIGINAL_HIGHSCORES);});
test('invalid records rejected and save failure does not crash menu',()=>{assert.equal(validScores([{score:0,name:'x'}]),false);assert.equal(saveScores({setItem(){throw Error('blocked')}},loadScores(null)),false);});
