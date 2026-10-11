import assert from 'node:assert/strict';
import { CroomPRNG } from '../public/src/prng.js';
import { faceDownValue } from '../public/src/layouts.js';
import { MODE } from '../public/src/rules.js';
import { FrameGame, PLAY_STATE, NTSC } from '../public/src/state-machine.js';
import { HistoricalPads, KEY, DAS } from '../public/src/input.js';
import { randomRemainingCard } from '../public/src/ai.js';
import { gameOverWipeRows, passControllerSprites } from '../public/src/nes-visual.js';

function finishFlip(g) {
  g.tick(NTSC.flipFrames);
  assert.equal(g.state, PLAY_STATE.FLIPPING);
  assert.equal(g.stateTimer, 0);
  g.tick(1);
}

// pads.s: initial edge, 15-frame DAS delay, then one repeat every 3 frames.
{
  const pads = new HistoricalPads();
  pads.setButton(0, KEY.RIGHT, true);
  let f = pads.beginFrame(0);
  assert.equal(f.newKeys[0] & KEY.RIGHT, KEY.RIGHT);
  assert.equal(f.dasTimer[0], DAS.delay);
  for (let i=0;i<14;i+=1) {
    f = pads.beginFrame(0);
    assert.equal(f.newKeys[0] & KEY.RIGHT, 0);
  }
  f = pads.beginFrame(0);
  assert.equal(f.newKeys[0] & KEY.RIGHT, KEY.RIGHT);
  assert.equal(f.dasTimer[0], DAS.speed);
  for (let i=0;i<2;i+=1) {
    f = pads.beginFrame(0);
    assert.equal(f.newKeys[0] & KEY.RIGHT, 0);
  }
  f = pads.beginFrame(0);
  assert.equal(f.newKeys[0] & KEY.RIGHT, KEY.RIGHT);
}

// PASS_CONTROLLER scans pad 2 before pad 1 and requires A+B held with a new edge.
{
  const pads = new HistoricalPads();
  pads.setButton(0, KEY.A | KEY.B, true);
  pads.setButton(1, KEY.A | KEY.B, true);
  pads.beginFrame(0);
  assert.equal(pads.passControllerPad(), 1);
}

// B/random uses the same shared PRNG and high-to-low present-card mapping as randomCard.
{
  const board = new Uint8Array(72);
  for (const i of [0,8,24,40,71]) board[i] = faceDownValue(0x1c + (i/8|0));
  const prng = new CroomPRNG();
  const oracle = prng.clone();
  const expected = randomRemainingCard(board, oracle);
  const g = new FrameGame({ board, mode: MODE.TWO_PLAYER, prng });
  assert.equal(g.randomizeCursor(), expected);
  assert.equal(g.cursorIndex, expected);
  assert.deepEqual(prng.snapshot(), oracle.snapshot());
}

// Solitaire game over does NOT reload 90: at old timer 89 the DEC has already
// made stateTimer 88 when GAME_OVER is entered in the 0.02 assembly.
{
  const board = new Uint8Array(72);
  board[0] = faceDownValue(0x1c);
  board[8] = faceDownValue(0x1d);
  const g = new FrameGame({ board, mode: MODE.SOLITAIRE, difficulty: 0 });
  g.score[0] = 1;
  g.select(0); finishFlip(g);
  g.select(8); finishFlip(g);
  assert.equal(g.state, PLAY_STATE.UNFLIPPING);
  g.tick(1); // 90 -> 89, compare old A=90
  assert.equal(g.state, PLAY_STATE.UNFLIPPING);
  g.tick(1); // 89 -> 88, score reaches 0
  assert.equal(g.state, PLAY_STATE.GAME_OVER);
  assert.equal(g.stateTimer, 88);
  assert.equal(g.endReason, 'game-over');

  g.tick(62); // 88 -> 26
  assert.deepEqual(gameOverWipeRows(g.stateTimer), []);
  g.tick(1);  // old 26 -> 25: still no row
  assert.deepEqual(gameOverWipeRows(g.stateTimer), []);
  g.tick(1);  // old 25 -> 24: first persistent row is row 3
  assert.deepEqual(gameOverWipeRows(g.stateTimer), [3]);
  g.tick(24); // -> 0, old timers 24..1 clear the rest
  assert.equal(g.state, PLAY_STATE.GAME_OVER);
  assert.equal(g.stateTimer, 0);
  const rows = gameOverWipeRows(0);
  assert.equal(rows.length, 25);
  assert.deepEqual([...rows].sort((a,b)=>a-b), Array.from({length:25},(_,i)=>i+3));
  g.tick(1);  // zero is tested before DEC on the following state dispatch
  assert.equal(g.state, PLAY_STATE.DONE);
  assert.equal(g.endReason, 'game-over');
}

// The 7-sprite PASS CONTROLLER message geometry is exact, including the third
// lower glyph ($02) required by the original sprite message.
{
  assert.deepEqual(passControllerSprites(0), [
    {tile:0x10,x:56,y:192}, {tile:0x11,x:64,y:192},
    {tile:0x12,x:72,y:192}, {tile:0x13,x:80,y:192},
    {tile:0x01,x:60,y:202}, {tile:0x0b,x:68,y:202},
    {tile:0x02,x:76,y:202},
  ]);
  assert.deepEqual(passControllerSprites(1)[0], {tile:0x10,x:168,y:192});
}

// CLEARED remains on screen for exactly 180 state-dispatch frames and retains
// the end reason so the final DONE render can still show the historical WIN box.
{
  const board = new Uint8Array(72);
  const g = new FrameGame({ board, mode: MODE.TWO_PLAYER });
  g.state = PLAY_STATE.CLEARED;
  g.stateTimer = 180;
  g.winner = 0;
  g.endReason = 'cleared';
  g.tick(179);
  assert.equal(g.state, PLAY_STATE.CLEARED);
  assert.equal(g.stateTimer, 1);
  g.tick(1);
  assert.equal(g.state, PLAY_STATE.DONE);
  assert.equal(g.endReason, 'cleared');
}

console.log('All Concentration Room final-parity tests passed.');
