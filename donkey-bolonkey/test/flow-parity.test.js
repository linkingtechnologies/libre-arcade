import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { Game } from '../public/src/core/game.js';
import { AppFlow,SCREEN } from '../public/src/core/flow.js';
import { HighScores,HISCORE_LIMITS } from '../public/src/core/highscores.js';

function memoryStorage(){
  const m=new Map();
  return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v))};
}

const source=name=>fs.readFileSync(new URL(`../reference/dkbk/${name}`,import.meta.url),'utf8');

test('historical source anchors title, banner, hiscore and post-game flow',()=>{
  assert.match(source('banner.c'),/banner_type\s*=\s*BMP_BANNER5/);
  assert.match(source('banner.c'),/banner_time\s*>\s*FRAMES_PER_SECOND\*6/);
  assert.match(source('banner.c'),/draw_banner_time\s*>\s*FRAMES_PER_SECOND\*5\/2/);
  assert.match(source('hiscore.c'),/score\s*>\s*hiscore_table\[i\]\.score/);
  assert.match(source('title.c'),/title_time\s*>\s*FRAMES_PER_SECOND\/2/);
  assert.match(source('main.c'),/if \(show_final_state\)\s*\n\s*draw_credits\(screen\);\s*\n\s*\n\s*active_hiscore\(\);/);
});

test('banner timing preserves the strict C thresholds and 5-item cycle',()=>{
  const g=new Game(()=>0,memoryStorage());
  for(let i=0;i<360;i++)g.updateBanner();
  assert.deepEqual(g.banner,{time:360,drawTime:-1,type:4});
  g.updateBanner();
  assert.deepEqual(g.banner,{time:0,drawTime:0,type:0});
  for(let i=0;i<60;i++)g.updateBanner();
  assert.equal(g.bannerFrame().phase,'steady');
  for(let i=0;i<60;i++)g.updateBanner();
  assert.equal(g.bannerFrame().phase,'collapse');
  for(let i=0;i<31;i++)g.updateBanner();
  assert.equal(g.banner.drawTime,-1);
});

test('historical high-score defaults, strict insertion and 22-char name limit are preserved',()=>{
  const hs=new HighScores(memoryStorage());
  assert.equal(hs.entries.length,10);
  assert.ok(hs.entries.every(e=>e.name===HISCORE_LIMITS.DEFAULT_NAME&&e.score===100));
  assert.equal(hs.add(100),-1,'equal score does not qualify in hiscore.c');
  assert.equal(hs.add(101),0);
  for(const ch of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ')hs.inputChar(ch);
  assert.equal(hs.entries[0].name.length,22);
  hs.backspace();assert.equal(hs.entries[0].name.length,21);
  hs.setEditingName('Mobile Player ★ with a very long name');
  assert.equal(hs.entries[0].name,'Mobile Player  with a ');
  assert.equal(hs.entries[0].name.length,22);
  hs.finishEntry();assert.equal(hs.editingIndex,-1);
});

test('front-end flow follows warning → title → first controls → game → hi-score → title',()=>{
  const flow=new AppFlow(()=>0,memoryStorage());
  assert.equal(flow.screen,SCREEN.WARNING);
  flow.anyKey();assert.equal(flow.screen,SCREEN.TITLE);
  flow.enter();assert.equal(flow.screen,SCREEN.CONTROLS);
  flow.anyKey();assert.equal(flow.screen,SCREEN.GAME);
  flow.game.score=90;
  flow.escape();assert.equal(flow.screen,SCREEN.HISCORE);
  assert.equal(flow.highscores.editingIndex,-1);
  flow.anyKey();assert.equal(flow.screen,SCREEN.TITLE);
  flow.enter();assert.equal(flow.screen,SCREEN.GAME,'controls are shown only before the first run');
});

test('final run goes through credits before the hi-score table',()=>{
  const flow=new AppFlow(()=>0,memoryStorage(),{skipWarning:true});
  flow.firstGame=false;flow.startGame();flow.game.score=7200;flow.game.final=true;flow.game.gameOver=true;
  flow.finishRun();assert.equal(flow.screen,SCREEN.CREDITS);
  assert.equal(flow.highscores.editingIndex,0);
  flow.anyKey();assert.equal(flow.screen,SCREEN.HISCORE);
  flow.printable('A');flow.enter();assert.equal(flow.highscores.editingIndex,-1);
  flow.anyKey();assert.equal(flow.screen,SCREEN.TITLE);
});

test('title animation boundary trace matches title.c timing',()=>{
  const flow=new AppFlow(()=>0,memoryStorage(),{skipWarning:true});
  flow.screenTime=30;assert.equal(flow.titlePhase().zooming,true);
  flow.screenTime=31;assert.equal(flow.titlePhase().zooming,false);
  flow.screenTime=60;assert.equal(flow.titlePhase().backgroundIn,false);
  flow.screenTime=61;assert.equal(flow.titlePhase().backgroundIn,true);
  flow.screenTime=90;assert.equal(flow.titlePhase().backgroundIn,true);
  flow.screenTime=91;assert.equal(flow.titlePhase().backgroundA,true);
  flow.screenTime=120;assert.equal(flow.titlePhase().backgroundB,true);
  flow.screenTime=240;assert.equal(flow.titlePhase().backgroundOut,true);
  flow.screenTime=270;assert.equal(flow.titlePhase().backgroundOut,false);
});

test('source-derived deterministic level-1 trace remains stable across gameplay and banner timing',()=>{
  const expected=JSON.parse(fs.readFileSync(new URL('./fixtures/c-source-derived-level1-trace.json',import.meta.url),'utf8'));
  const wanted=new Map(expected.map(x=>[x.tick,x]));
  const g=new Game(()=>0,memoryStorage());
  const snapshot=tick=>({
    tick,moveTime:g.moveTime,addTime:g.addTime,banner:[g.banner.time,g.banner.drawTime,g.banner.type],
    donkeys:g.donkeys.map(d=>[d.x,d.y,d.color]).sort((a,b)=>a[1]-b[1]||a[0]-b[0]),
    counter:g.counter,score:g.score,gameOver:g.gameOver
  });
  assert.deepEqual(snapshot(0),wanted.get(0));
  for(let tick=1;tick<=512;tick++){
    g.update();
    if(wanted.has(tick))assert.deepEqual(snapshot(tick),wanted.get(tick),`trace mismatch at tick ${tick}`);
  }
});
