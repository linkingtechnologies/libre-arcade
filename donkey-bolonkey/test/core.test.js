import test from 'node:test';
import assert from 'node:assert/strict';
import { FLAG, LEVEL_HEIGHT, LEVEL_WIDTH } from '../public/src/core/constants.js';
import { LEVELS } from '../public/src/core/levels.js';
import { Game } from '../public/src/core/game.js';

const storage={getItem(){return null;},setItem(){}};

test('all six historical levels have exact 16x9 shape and one home',()=>{
  assert.equal(LEVELS.length,6);
  for(const level of LEVELS){
    assert.equal(level.grid.length,LEVEL_HEIGHT);
    assert.ok(level.grid.every(row=>row.length===LEVEL_WIDTH));
    const cells=level.grid.flat();
    assert.equal(cells.filter(v=>v&FLAG.HOME).length,1);
    assert.ok(cells.some(v=>v&FLAG.EXIT));
    assert.ok(cells.some(v=>v&FLAG.BUBBLE));
    assert.ok(cells.some(v=>v&FLAG.TRAP));
  }
});

test('historical counters and speed parameters were transcribed',()=>{
  assert.deepEqual(LEVELS.map(l=>l.counter),[16,20,28,36,44,50]);
  assert.deepEqual(LEVELS.map(l=>l.moveFreqMin),[400,350,300,250,200,150]);
  assert.deepEqual(LEVELS.map(l=>l.moveFreqMax),[600,550,500,450,400,350]);
  assert.deepEqual(LEVELS.map(l=>l.addFreq),[5,5,4,4,4,4]);
});

test('first update reproduces historical immediate spawn timing',()=>{
  const g=new Game(()=>0,storage);
  assert.equal(g.donkeys.length,0);
  g.update();
  assert.equal(g.donkeys.length,1);
  const home=g.findHome();
  assert.equal(g.getDonkey(home.x,home.y),g.donkeys[0]);
});

test('bubble swaps with its adjacent trap cell',()=>{
  const g=new Game(()=>0,storage);
  const b=g.bubbles.find(x=>x.state);
  const p={x:b.x,y:b.y};
  const f=g.getFlags(b.x,b.y);
  if(f&FLAG.LEFT)p.x--; if(f&FLAG.UP)p.y--; if(f&FLAG.RIGHT)p.x++; if(f&FLAG.DOWN)p.y++;
  const d={x:p.x,y:p.y,xold:p.x,yold:p.y,color:1,moved:false,flip:false};
  g.setDonkey(p.x,p.y,d);g.addDonkeyToList(d);
  g.swapBubble();
  assert.equal(b.donkey,d);
  assert.equal(g.getDonkey(p.x,p.y),null);
  g.swapBubble();
  assert.equal(b.donkey,null);
  assert.equal(g.getDonkey(p.x,p.y),d);
});

test('long deterministic simulation stays within game state invariants',()=>{
  let seed=1; const rnd=()=>((seed=seed*1664525+1013904223>>>0)/4294967296);
  const g=new Game(rnd,storage);
  for(let i=0;i<5000&&!g.gameOver;i++){
    if(i%137===0)g.swapBubble();
    if(i%211===0)g.nextBubble();
    g.update();
    assert.ok(g.levelNumber>=1&&g.levelNumber<=6);
    assert.ok(g.donkeys.every(d=>d.x>=0&&d.x<LEVEL_WIDTH&&d.y>=0&&d.y<LEVEL_HEIGHT));
  }
});

test('historical retry keeps current level and resets score',()=>{
  const g=new Game(()=>0,storage);
  g.resetLevel(3); g.score=1234; g.killPlayer();
  g.retryCurrentLevel();
  assert.equal(g.levelNumber,3);
  assert.equal(g.score,0);
  assert.equal(g.gameOver,false);
  assert.equal(g.counter,28);
});

test('door animation follows the historical 0→1→2→0 timing',()=>{
  const g=new Game(()=>0.5,storage);
  g.openDoors(3);
  assert.equal(g.doorFrame(0),0);
  g.doorAnimation=15; assert.equal(g.doorFrame(0),1);
  g.doorAnimation=30; assert.equal(g.doorFrame(0),2);
  g.doorAnimation=38; assert.equal(g.doorFrame(0),1);
  g.doorAnimation=45; assert.equal(g.doorFrame(0),0);
  assert.equal(g.doorFrame(3),0,'only the first N exit doors animate');
});

test('crusher keeps its level-1 position while later funnels are recomputed',()=>{
  const g=new Game(()=>0.5,storage);
  const x=g.crusher.x;
  assert.deepEqual(g.funnel,{x1:54,y1:162,x2:126,y2:162});
  g.resetLevel(6);
  assert.equal(g.crusher.x,x);
  assert.deepEqual(g.funnel,{x1:36,y1:162,x2:144,y2:162});
});

test('completed death donkeys decrement the counter and create the historical crusher chain',()=>{
  const g=new Game(()=>0.5,storage);
  const before=g.counter;
  g.deaths.push({time:59,color:1,x:3,y:8,clockwise:true,flip:false});
  g.updateDeaths();
  assert.equal(g.counter,before-1);
  assert.equal(g.deaths.length,0);
  assert.equal(g.particleSystem.chains.length,1);
  assert.equal(g.particleSystem.chains[0].num,1);
  assert.equal(g.particleSystem.chains[0].cant,64);
  assert.equal(g.alarm.blueTime,0);
});

test('particle chain emits its first burst on the same update pass, matching particle.c',()=>{
  const g=new Game(()=>0.5,storage);
  g.particleSystem.createChain(90,218,1,32);
  assert.equal(g.particleSystem.particles.length,0);
  g.particleSystem.update();
  assert.equal(g.particleSystem.chains[0].num,0);
  assert.equal(g.particleSystem.particles.length,66); // 64 blood + 2 body pieces
});

test('crusher alarm durations and crazy alternation use historical tick thresholds',()=>{
  const g=new Game(()=>0.5,storage);
  g.activeRedAlarm(100);
  for(let i=0;i<6;i++)g.updateCrusher();
  assert.ok(g.alarm.redTime>=0);
  g.updateCrusher();
  assert.equal(g.alarm.redTime,-1);

  g.activeCrazyAlarm();
  assert.ok(g.alarm.blueTime>=0);
  for(let i=0;i<8;i++)g.updateCrusher();
  assert.equal(g.alarm.blueTime,-1);
  assert.ok(g.alarm.redTime>=0);
  for(let i=8;i<91;i++)g.updateCrusher();
  assert.equal(g.alarm.crazyTime,-1);
  assert.equal(g.alarm.blueTime,-1);
  assert.equal(g.alarm.redTime,-1);
});

test('game-over flag does not freeze the historical simulation loop',()=>{
  const g=new Game(()=>0,storage);
  g.killPlayer();
  const tick=g.tickCount;
  const crusherAngle=g.crusher.angle;
  g.update();
  assert.equal(g.tickCount,tick+1);
  assert.notEqual(g.crusher.angle,crusherAngle);
  assert.equal(g.gameOverTime,1);
});

test('level reset clears pending death donkeys like init_donkeys() in the C source',()=>{
  const g=new Game(()=>0.5,storage);
  g.deaths.push({time:12,color:1,x:3,y:8,clockwise:true,flip:false});
  g.resetLevel(2);
  assert.equal(g.deaths.length,0);
});

test('end-to-end counter transitions traverse all six historical levels and finish at internal level 7',()=>{
  const g=new Game(()=>0.5,storage);
  for(let expected=2;expected<=6;expected++){
    g.counter=1;
    g.deaths=[{time:59,color:1,x:3,y:8,clockwise:true,flip:false}];
    g.updateDeaths();
    assert.equal(g.levelNumber,expected);
    assert.equal(g.gameOver,false);
    assert.equal(g.counter,g.level.counter);
    assert.equal(g.deaths.length,0);
  }
  g.counter=1;
  g.deaths=[{time:59,color:1,x:3,y:8,clockwise:true,flip:false}];
  g.updateDeaths();
  assert.equal(g.levelNumber,7,'player.c pre-increments the level before reset_level(7) fails');
  assert.equal(g.final,true);
  assert.equal(g.gameOver,true);
});

test('gameplay events have monotonically increasing ids across resets for audio consumption',()=>{
  const g=new Game(()=>0.5,storage);
  g.emit('bubble');
  const a=g.events.at(-1).id;
  g.resetGame();
  g.emit('bubble');
  const b=g.events.at(-1).id;
  assert.ok(b>a);
});
