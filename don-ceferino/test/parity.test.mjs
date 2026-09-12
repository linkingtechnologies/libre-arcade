import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { Ball } from '../public/src/core/ball.js';
import { Game } from '../public/src/core/game.js';
import { Item } from '../public/src/core/item.js';
import { LevelSet } from '../public/src/core/level.js';
import { Shot } from '../public/src/core/shot.js';
import {
  NORMAL_MESSAGE_PROCESS_TICKS,
  QUICK_MESSAGE_PROCESS_TICKS,
  SHOT_STATE,
  SHOT_TYPE,
  STEP_MS
} from '../public/src/core/constants.js';

const map = fs.readFileSync(new URL('../public/assets/levels/base.map', import.meta.url));
const levels = new LevelSet(map);
const none = Object.freeze({left:false,right:false,up:false,down:false,shot:false,sweep:false});

function advanceLevelIntro(game) {
  let ticks = 0;
  while (game.state === 'level-intro' && ticks < 300) {
    game.update(none);
    ticks++;
  }
  assert.equal(game.state, 'playing');
  return ticks;
}

function freezeMotion(game) {
  for (const ball of game.balls) ball.update = () => {};
  game.player.update = () => {};
}

test('base.map contains exactly 30 historical levels', () => {
  assert.equal(map.length, 8400);
  assert.equal(levels.count, 30);
});

test('all historical levels define one player and at least one ball', () => {
  for (let n=1; n<=levels.count; n++) {
    const level=levels.load(n);
    assert.ok(level.playerSpawn, `level ${n} player`);
    assert.ok(level.ballSpawns.length > 0, `level ${n} balls`);
  }
});

test('historical ball sizes and comma-operator rebound quirk are preserved', () => {
  assert.equal(new Ball({x:0,y:0,size:1,flip:1}).bounceVelocity, -4);
  assert.equal(new Ball({x:0,y:0,size:2,flip:1}).bounceVelocity, -4);
  assert.equal(new Ball({x:0,y:0,size:3,flip:1}).bounceVelocity, -4);
  assert.equal(new Ball({x:0,y:0,size:4,flip:1}).bounceVelocity, -5);
});

test('ball splitting uses x +/- 10 and size - 1', () => {
  const ball = new Ball({x:100,y:50,size:4,flip:1});
  const hit = ball.hit();
  assert.equal(hit.score, 4);
  assert.deepEqual(hit.children, [
    {x:110,y:50,size:3,flip:1},
    {x:90,y:50,size:3,flip:-1}
  ]);
});

test('minimum ball does not split', () => {
  const hit = new Ball({x:10,y:10,size:1,flip:1}).hit();
  assert.equal(hit.score, 1);
  assert.deepEqual(hit.children, []);
});

test('100 Hz fixed step is 10 ms', () => assert.equal(STEP_MS, 10));

test('normal and quick message linked-list lifetimes match fuente.cc', () => {
  assert.equal(NORMAL_MESSAGE_PROCESS_TICKS, 216);
  assert.equal(QUICK_MESSAGE_PROCESS_TICKS, 114);
  const game = new Game(levels);
  assert.equal(advanceLevelIntro(game), 217, '216 process ticks plus transition tick');
});

test('timer preserves the original >1500 ms first decrement quirk', () => {
  const game = new Game(levels, {rng:()=>0.5});
  advanceLevelIntro(game);
  freezeMotion(game);
  const start = game.nowMs;
  for (let i=0; i<150; i++) game.update(none);
  assert.equal(game.nowMs-start, 1500);
  assert.equal(game.time, 30);
  game.update(none);
  assert.equal(game.time, 29);
  for (let i=0; i<99; i++) game.update(none);
  assert.equal(game.time, 29);
  game.update(none);
  assert.equal(game.time, 28);
});

test('timeout has its own message phase before a life is removed', () => {
  const game = new Game(levels, {rng:()=>0.5});
  advanceLevelIntro(game);
  freezeMotion(game);
  game.time = 0;
  game.timerBaseMs = game.nowMs - 1510;
  game.update(none);
  assert.equal(game.state, 'time-out');
  assert.equal(game.time, -1);
  assert.equal(game.lives, 3);
  for (let i=0; i<215; i++) game.update(none);
  assert.equal(game.lives, 3);
  game.update(none);
  assert.equal(game.state, 'life-lost');
  assert.equal(game.lives, 2);
});

test('life-lost message is fully processed before the level is rebuilt', () => {
  const game = new Game(levels, {rng:()=>0.5});
  advanceLevelIntro(game);
  const oldPlayer = game.player;
  game.loseLife();
  assert.equal(game.state, 'life-lost');
  for (let i=0; i<NORMAL_MESSAGE_PROCESS_TICKS; i++) game.update(none);
  assert.equal(game.state, 'life-lost');
  game.update(none);
  assert.equal(game.state, 'level-intro');
  assert.notEqual(game.player, oldPlayer);
  assert.equal(game.time, 30);
});

test('extra life is awarded only after exceeding 300 points', () => {
  const game = new Game(levels);
  game.addScore(300);
  assert.equal(game.lives, 3);
  game.addScore(1);
  assert.equal(game.lives, 4);
  assert.equal(game.nextExtraLife, 600);
});

test('item RNG mapping preserves original probabilities', () => {
  const values = [0.05,0.15,0.25,0.35,0.45,0.55,0.65,0.75,0.85,0.95];
  let i=0;
  const game = new Game(levels, {rng:()=>values[i++]});
  const got = values.map(() => game.randomItemType());
  assert.deepEqual(got, [0,1,1,1,2,-1,2,3,3,3]);
});

test('freeze pickup uses two quick messages first time and leaves timeBonus at 1', () => {
  const game = new Game(levels, {rng:()=>0.5});
  advanceLevelIntro(game);
  freezeMotion(game);
  game.items = [new Item({x:game.player.x,y:game.player.y,type:3})];
  game.update(none);
  assert.equal(game.state, 'bonus-freeze');
  assert.equal(game.timeBonus, 2);
  game.items = [];

  for (let i=0; i<QUICK_MESSAGE_PROCESS_TICKS; i++) game.update(none);
  assert.equal(game.state, 'bonus-freeze');
  game.update(none); // starts the second quick message and decrements 2 -> 1
  assert.equal(game.timeBonus, 1);
  assert.equal(game.messages.length, 1);
  for (let i=0; i<QUICK_MESSAGE_PROCESS_TICKS; i++) game.update(none);
  game.update(none); // resumes
  assert.equal(game.state, 'playing');
  assert.equal(game.timeBonus, 1, 'historical code never resets tiempo_bonus to zero');
});

test('frozen enemies cannot collide with the player but can still be hit by shots', () => {
  const game = new Game(levels, {rng:()=>0.55});
  advanceLevelIntro(game);
  freezeMotion(game);

  // Collect a bomb pickup to pause enemies, then move the selected item away.
  game.items = [new Item({x:game.player.x,y:game.player.y,type:0})];
  game.balls[0].x = 500; game.balls[0].y = 100;
  game.update(none);
  assert.equal(game.enemiesEnabled, false);
  game.items[0].x = 500; game.items[0].y = 400;

  const ball = game.balls[0];
  ball.x = game.player.x + 10;
  ball.y = game.player.y - 15;
  const lives = game.lives;
  game.update(none);
  assert.equal(game.lives, lives, 'paused enemy does not hurt player');

  const shot = new Shot({x:ball.x,y:ball.y + 10,type:SHOT_TYPE.TRIDENT});
  shot.state = SHOT_STATE.STUCK;
  shot.y = ball.y - 20;
  shot.h = 40;
  game.shots = [shot];
  game.update(none);
  assert.notEqual(ball.state, 0, 'shot collision remains active while enemies are paused');
});

test('selected double-shot item repeats the gaucho-side effect while overlapping', () => {
  const game = new Game(levels, {rng:()=>0.5});
  advanceLevelIntro(game);
  freezeMotion(game);
  game.items = [new Item({x:game.player.x,y:game.player.y,type:1})];
  assert.equal(game.player.maxShots, 1);
  game.update(none);
  assert.equal(game.player.maxShots, 2);
  assert.equal(game.items[0].state, 1);
  game.items[0].x = game.player.x;
  game.items[0].y = game.player.y;
  game.update(none);
  assert.equal(game.player.maxShots, 3, 'historical collision ordering reapplies the player effect');
});

test('a shot becoming DEAD earlier in a process tick still occupies a shot slot until next prune', () => {
  const game = new Game(levels, {rng:()=>0.5});
  advanceLevelIntro(game);
  for (const ball of game.balls) ball.update = () => {};
  const shot = new Shot({x:500,y:300,type:SHOT_TYPE.SIMPLE});
  shot.state = SHOT_STATE.ENDING;
  shot.life = 8;
  game.shots = [shot];
  game.player.state = 0;
  game.player.shotHeld = false;
  game.update({...none, shot:true});
  assert.equal(game.shots.length, 1);
  assert.equal(game.shots[0].state, SHOT_STATE.DEAD);
  game.update({...none, shot:true});
  assert.equal(game.shots.length, 1, 'dead node was pruned and replaced by the newly-fired shot');
  assert.equal(game.shots[0].state, SHOT_STATE.NORMAL);
});

test('trident remains attached for the historical counter duration', () => {
  const ceiling = { distanceToCeiling: () => 0 };
  const shot = new Shot({x:10,y:100,type:SHOT_TYPE.TRIDENT});
  shot.update(ceiling);
  assert.equal(shot.state, SHOT_STATE.STUCK);
  for (let i=0;i<150;i++) shot.update(ceiling);
  assert.equal(shot.state, SHOT_STATE.STUCK);
  shot.update(ceiling);
  assert.equal(shot.state, SHOT_STATE.ENDING_STUCK);
});

test('level-complete waits for its historical message before adding time and advancing', () => {
  const game = new Game(levels, {rng:()=>0.5});
  advanceLevelIntro(game);
  game.balls = [];
  const before = game.points;
  const bonus = game.time;
  game.update(none);
  assert.equal(game.state, 'level-complete');
  assert.equal(game.points, before);
  for (let i=0; i<NORMAL_MESSAGE_PROCESS_TICKS; i++) game.update(none);
  assert.equal(game.levelNumber, 1);
  game.update(none);
  assert.equal(game.levelNumber, 2);
  assert.equal(game.state, 'level-intro');
  assert.equal(game.points, before + bonus);
});
