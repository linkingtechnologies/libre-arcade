import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { Game } from '../public/src/core/game.js';
import { DEFAULT_HIGH_SCORES, insertHighScore, isHighScore } from '../public/src/core/high-scores.js';
import { LevelSet } from '../public/src/core/level.js';
import { MenuTitleAnimation } from '../public/src/core/menu-title.js';
import { PresentationSequence } from '../public/src/core/presentation.js';
import { PLAYER_STATE } from '../public/src/core/constants.js';

const levels = new LevelSet(fs.readFileSync(new URL('../public/assets/levels/base.map', import.meta.url)));
const none = Object.freeze({left:false,right:false,up:false,down:false,shot:false,sweep:false});
function toPlaying(game) { while (game.state === 'level-intro') game.update(none); }

test('default high-score table matches utils.cc exactly', () => {
  assert.deepEqual(DEFAULT_HIGH_SCORES, [
    {name:'matar bros',points:500},{name:'pepe',points:450},{name:'kenny',points:425},
    {name:'vaca',points:413},{name:'martian',points:411},{name:'raton',points:300},{name:'toto',points:299}
  ]);
});

test('high-score qualification preserves strict greater-than comparison', () => {
  assert.equal(isHighScore(299, DEFAULT_HIGH_SCORES), false);
  assert.equal(isHighScore(300, DEFAULT_HIGH_SCORES), true, '300 beats the 299-point seventh place');
});

test('high-score insertion uses the original descending placement semantics', () => {
  const result = insertHighScore(DEFAULT_HIGH_SCORES, 'ceferino', 425);
  assert.deepEqual(result.slice(0,4), [
    {name:'matar bros',points:500},{name:'pepe',points:450},{name:'kenny',points:425},{name:'ceferino',points:425}
  ]);
});

test('intro/final presentation auto-advances only after paso > 1000', () => {
  const p = new PresentationSequence(2);
  for (let i=0;i<1001;i++) assert.equal(p.update(), 'waiting');
  assert.equal(p.index, 0);
  assert.equal(p.update(), 'advanced');
  assert.equal(p.index, 1);
});

test('presentation input advance is ignored until paso > 100', () => {
  const p = new PresentationSequence(2);
  for (let i=0;i<101;i++) assert.equal(p.update({advance:true}), 'waiting');
  assert.equal(p.index,0);
  assert.equal(p.update({advance:true}), 'advanced');
  assert.equal(p.index,1);
});

test('presentation escape exits immediately', () => {
  const p = new PresentationSequence(6);
  assert.equal(p.update({escape:true}), 'done');
  assert.equal(p.done,true);
});

test('Game Over continue resets score/lives but preserves next extra-life threshold', () => {
  const game = new Game(levels);
  toPlaying(game);
  game.points = 650;
  game.nextExtraLife = 900;
  game.lives = -1;
  game.state = 'gameover';
  const level = game.levelNumber;
  assert.equal(game.continueGame(), true);
  assert.equal(game.points,0);
  assert.equal(game.lives,3);
  assert.equal(game.nextExtraLife,900);
  assert.equal(game.levelNumber,level);
  assert.equal(game.state,'level-intro');
});

test('JU cheat immediately advances one level and converts remaining time to points', () => {
  const game = new Game(levels);
  toPlaying(game);
  game.time = 27;
  assert.equal(game.cheatNextLevel(), true);
  assert.equal(game.levelNumber,2);
  assert.equal(game.points,27);
  assert.equal(game.state,'level-intro');
});

test('SJ cheat reproduces ir_nivel(25) followed by pasa_nivel(): playable level 26', () => {
  const game = new Game(levels);
  toPlaying(game);
  game.time = 30;
  assert.equal(game.cheatSuperJump(), true);
  assert.equal(game.levelNumber,26);
  assert.equal(game.points,30);
});

test('BO cheat only starts the bomb animation while the player is idle', () => {
  const game = new Game(levels);
  toPlaying(game);
  game.player.state = PLAYER_STATE.WALK;
  assert.equal(game.cheatBomb(), false);
  game.player.state = PLAYER_STATE.IDLE;
  assert.equal(game.cheatBomb(), true);
  assert.equal(game.player.state, PLAYER_STATE.BOMB);
});


test('menu title simple_sprite animation reaches the original destinations in 55 ticks', () => {
  const a = new MenuTitleAnimation();
  let ticks = 0;
  while (!a.done && ticks < 1000) { a.update(); ticks++; }
  assert.equal(ticks, 55);
  assert.deepEqual(a.sprites.map(({x,y}) => [x,y]), [[90,8],[230,0],[204,87]]);
});
