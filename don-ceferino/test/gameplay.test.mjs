import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { Ball } from '../public/src/core/ball.js';
import { Bomb } from '../public/src/core/bomb.js';
import { Game } from '../public/src/core/game.js';
import { LevelSet } from '../public/src/core/level.js';
import { Player } from '../public/src/core/player.js';
import { Shot } from '../public/src/core/shot.js';
import { PLAYER_STATE, SHOT_STATE, SHOT_TYPE } from '../public/src/core/constants.js';

const levels = new LevelSet(fs.readFileSync(new URL('../public/assets/levels/base.map', import.meta.url)));
const none = Object.freeze({left:false,right:false,up:false,down:false,shot:false,sweep:false});

function toPlaying(game) {
  while (game.state === 'level-intro') game.update(none);
}

function inertGame() {
  return {
    shots: [],
    createShot(x,y,type) { this.shots.push(new Shot({x,y,type})); },
    createBombCalls: [],
    createBomb(x,y,flip) { this.createBombCalls.push({x,y,flip}); },
    loseLife() {}
  };
}

function openLevel() {
  return {
    distanceToFloor: (_x,_y,max) => max,
    distanceToWall: (_x,_y,max) => max,
    isLadder: () => false
  };
}

test('walking preserves the historical one-tick state transition and 2 px/tick movement', () => {
  const game = inertGame();
  const level = openLevel();
  level.distanceToFloor = () => 0;
  const p = new Player(game, level, {x:100,y:100});
  p.update({...none,left:true});
  assert.equal(p.state, PLAYER_STATE.WALK);
  assert.equal(p.x, 100, 'idle switches state before movement begins');
  p.update({...none,left:true});
  assert.equal(p.x, 98);
  assert.equal(p.flip, -1);
});

test('ladder use snaps Ceferino to tile center +9 and moves 1 px per tick', () => {
  const game = inertGame();
  const level = openLevel();
  level.distanceToFloor = () => 0;
  level.isLadder = () => true;
  const p = new Player(game, level, {x:77,y:100});
  p.update({...none,up:true});
  assert.equal(p.state, PLAYER_STATE.CLIMB);
  p.update({...none,up:true});
  assert.equal(p.x, 73, 'floor(77/32)*32+9');
  assert.equal(p.y, 99);
});

test('sweep moves up to 7 px per logic tick', () => {
  const game = inertGame();
  const level = openLevel();
  level.distanceToFloor = () => 0;
  const p = new Player(game, level, {x:100,y:100});
  p.update({...none,sweep:true});
  assert.equal(p.state, PLAYER_STATE.SWEEP);
  const x = p.x;
  p.update({...none,sweep:true});
  assert.equal(p.x, x + 7);
});

test('fall preserves the historical x-15 probe for rightward air movement', () => {
  const probes=[];
  const game=inertGame();
  const level={
    distanceToFloor: (_x,_y,max) => max,
    distanceToWall: (x,y,max) => { probes.push({x,y,max}); return max; },
    isLadder:()=>false
  };
  const p=new Player(game,level,{x:100,y:100});
  p.state=PLAYER_STATE.FALL;
  p.velocity=1;
  p.update({...none,right:true});
  assert.ok(probes.some(v => v.x === 85 && v.max === 1));
});

test('bomb throw animation creates the bomb after the historical 28 animation updates', () => {
  const game=inertGame();
  const level=openLevel();
  level.distanceToFloor=()=>0;
  const p=new Player(game,level,{x:100,y:100});
  p.state=PLAYER_STATE.BOMB;
  for (let i=0;i<27;i++) p.update(none);
  assert.equal(game.createBombCalls.length,0);
  p.update(none);
  assert.deepEqual(game.createBombCalls,[{x:100,y:100,flip:1}]);
  assert.equal(p.state,PLAYER_STATE.IDLE);
});

test('ball-shot collision uses the historical vertical rope span and splits exactly once', () => {
  const game=new Game(levels,{rng:()=>0.55});
  toPlaying(game);
  game.player.update=()=>{};
  const ball=new Ball({x:200,y:150,size:2,flip:1});
  ball.update=()=>{};
  const shot=new Shot({x:200,y:170,type:SHOT_TYPE.TRIDENT});
  shot.state=SHOT_STATE.STUCK;
  shot.y=120;
  shot.startY=170;
  shot.h=84;
  game.balls=[ball];
  game.shots=[shot];
  game.update(none);
  assert.equal(ball.state,2);
  assert.equal(game.balls.filter(b=>b.size===1).length,2);
  assert.equal(game.points,2);
  assert.equal(shot.state,SHOT_STATE.ENDING_STUCK);
});

test('breaking a j block clears its collision tile and puts the shot into ending state', () => {
  const game=new Game(levels,{rng:()=>0.55});
  toPlaying(game);
  game.player.update=()=>{};
  for (const ball of game.balls) ball.update=()=>{};
  const block=game.blocks[0];
  assert.ok(block,'level 1 contains the historical breakable block');
  const shot=new Shot({x:block.x,y:block.y+20,type:SHOT_TYPE.SIMPLE});
  shot.y=block.y-10;
  shot.h=30;
  game.shots=[shot];
  game.update(none);
  assert.equal(block.state,1);
  assert.equal(game.level.tile(block.row,block.col),45);
  assert.equal(shot.state,SHOT_STATE.ENDING);
});

test('a breaking block can still roll another item on a later normal-shot collision', () => {
  const rolls=[0.55,0.05];
  const game=new Game(levels,{rng:()=>rolls.shift() ?? 0.55});
  toPlaying(game);
  game.player.update=()=>{};
  for (const ball of game.balls) ball.update=()=>{};
  const block=game.blocks[0];
  const first=new Shot({x:block.x,y:block.y+20,type:SHOT_TYPE.SIMPLE});
  first.y=block.y-10; first.h=30;
  game.shots=[first];
  game.update(none);
  assert.equal(game.items.length,0);
  const second=new Shot({x:block.x,y:block.y+20,type:SHOT_TYPE.SIMPLE});
  second.y=block.y-10; second.h=30;
  game.shots=[second];
  game.update(none);
  assert.equal(block.state,1);
  assert.equal(game.items.length,1,'bloque.cc rolls outside the estado==NORMAL guard');
});

test('bomb effect reduces only pre-existing non-minimum balls and scores each hit', () => {
  const game=new Game(levels,{rng:()=>0.55});
  toPlaying(game);
  game.balls=[
    new Ball({x:200,y:100,size:3,flip:1}),
    new Ball({x:300,y:100,size:1,flip:-1})
  ];
  game.enemiesEnabled=false;
  game.player.update=()=>{};
  game.bombs=[new Bomb({x:618,y:120,flip:1})];
  game.state='bomb';
  game.update(none);
  assert.equal(game.points,3);
  assert.equal(game.balls.filter(b=>b.size===2 && b.state===0).length,2);
  assert.equal(game.balls.filter(b=>b.size===1 && b.state===0).length,1);
  assert.equal(game.balls.filter(b=>b.size===3 && b.state===2).length,1);
});

test('pause stops simulation and resumes with an action-compatible explicit resume', () => {
  const game=new Game(levels,{rng:()=>0.55});
  toPlaying(game);
  const t=game.time;
  const x=game.player.x;
  game.pause();
  for(let i=0;i<300;i++) game.update({...none,right:true});
  assert.equal(game.state,'paused');
  assert.equal(game.time,t);
  assert.equal(game.player.x,x);
  game.resume();
  assert.equal(game.state,'playing');
  assert.equal(game.timerBaseMs,game.nowMs);
});
