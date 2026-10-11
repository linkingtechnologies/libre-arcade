import assert from 'node:assert/strict';
import { CroomPRNG } from '../public/src/prng.js';
import { activePositions, cardIdentity } from '../public/src/layouts.js';
import { dealBoard } from '../public/src/shuffle.js';
import { MODE } from '../public/src/rules.js';
import { FrameGame, NTSC, PLAY_STATE } from '../public/src/state-machine.js';

function deal(difficulty = 0, modeIndex = 2) {
  const p = new CroomPRNG();
  p.mixTitleSelection(modeIndex, 0x11);
  return dealBoard({ difficulty, prng: p, dealNmis: 0x5d }).board;
}

function findPair(board, difficulty = 0) {
  const pos = activePositions(difficulty);
  for (let i = 0; i < pos.length; i += 1) for (let j = i + 1; j < pos.length; j += 1) {
    if (cardIdentity(board[pos[i]]) === cardIdentity(board[pos[j]])) return [pos[i], pos[j]];
  }
  throw new Error('pair not found');
}

function findMismatch(board, difficulty = 0) {
  const pos = activePositions(difficulty);
  for (let i = 0; i < pos.length; i += 1) for (let j = i + 1; j < pos.length; j += 1) {
    if (cardIdentity(board[pos[i]]) !== cardIdentity(board[pos[j]])) return [pos[i], pos[j]];
  }
  throw new Error('mismatch not found');
}

function finishFlip(g) {
  g.tick(NTSC.flipFrames);
  assert.equal(g.state, PLAY_STATE.FLIPPING);
  assert.equal(g.stateTimer, 0);
  g.tick(1);
}

// First card: five countdown frames plus one state-dispatch frame completes it.
{
  const board = deal();
  const g = new FrameGame({ board, mode: MODE.TWO_PLAYER });
  const [a] = findPair(board);
  assert.ok(g.select(a));
  finishFlip(g);
  assert.equal(g.state, PLAY_STATE.STILL);
  assert.equal(g.selected[0], -1);
  assert.equal(g.selected[1], a);
  assert.equal((g.board[a] & 0xc0), 0xc0);
}

// Mismatch: 90-frame hold, first card unflip, six-frame second-card tail,
// then PASS_CONTROLLER. Score in 2P does not change.
{
  const board = deal();
  const g = new FrameGame({ board, mode: MODE.TWO_PLAYER });
  const [a, b] = findMismatch(board);
  g.select(a); finishFlip(g);
  g.select(b); finishFlip(g);
  assert.equal(g.state, PLAY_STATE.UNFLIPPING);
  assert.equal(g.stateTimer, 90);
  assert.equal(g.curTurn, 0);

  g.tick(84); // leaves timer at 6
  assert.equal(g.stateTimer, 6);
  g.tick(1); // 6 -> 5, starts first unflip animation
  assert.equal(g.stateTimer, 5);
  assert.equal((g.board[b] & 0xc0), 0x40);
  g.tick(5); // 5 -> 0
  assert.equal(g.stateTimer, 0);
  g.tick(1); // finalize b, schedule a tail=6
  assert.equal(g.stateTimer, 6);
  assert.equal(g.selected[0], a);
  g.tick(6);
  assert.equal(g.stateTimer, 0);
  g.tick(1); // finalize a and pass
  assert.equal(g.state, PLAY_STATE.PASS_CONTROLLER);
  assert.equal(g.curTurn, 1);
  assert.equal((g.board[a] & 0xc0), 0x80);
  assert.equal((g.board[b] & 0xc0), 0x80);
  assert.deepEqual(g.score, [0, 0]);
  assert.ok(g.acknowledgePass(1));
  assert.equal(g.state, PLAY_STATE.STILL);
  assert.equal(g.activePad, 1);
}

// Solitaire decrements one miss on the original oldTimer==89 frame.
{
  const board = deal(0, 1);
  const g = new FrameGame({ board, mode: MODE.SOLITAIRE, difficulty: 0 });
  const [a, b] = findMismatch(board);
  g.select(a); finishFlip(g);
  g.select(b); finishFlip(g);
  assert.equal(g.score[0], 20);
  g.tick(1); // 90 -> 89; A was 90, no decrement in 6502
  assert.equal(g.score[0], 20);
  g.tick(1); // 89 -> 88; comparison uses old A=89
  assert.equal(g.score[0], 19);
}

// Match: current player retains turn; score is awarded only after collection.
{
  const board = deal();
  const g = new FrameGame({ board, mode: MODE.TWO_PLAYER });
  const [a, b] = findPair(board);
  g.select(a); finishFlip(g);
  g.select(b); finishFlip(g);
  assert.equal(g.state, PLAY_STATE.COLLECTING);
  assert.equal(g.stateTimer, 90);
  g.tick(62); // 90 -> 28
  assert.equal(g.stateTimer, 28);
  g.tick(1);  // oldTimer=28: first collection animation starts
  assert.equal(g.stateTimer, 27);
  assert.equal((g.board[a] & 0xc0), 0x00); // selected[1] is first-opened card
  g.tick(11); // 27 -> 16
  g.tick(1);  // oldTimer=16: second collection starts
  assert.equal(g.stateTimer, 15);
  g.tick(15); // -> 0
  assert.equal(g.score[0], 0);
  g.tick(1);  // remove selected[0], shift other
  assert.equal(g.score[0], 0);
  g.tick(1);  // remove other and score
  assert.equal(g.score[0], 1);
  assert.equal(g.curTurn, 0);
  assert.equal(g.state, PLAY_STATE.STILL);
  assert.equal(g.board[a], 0);
  assert.equal(g.board[b], 0);
}

// Early 2P victory: on the 10-card board first to 3 pairs ends the game.
{
  const board = deal();
  const g = new FrameGame({ board, mode: MODE.TWO_PLAYER });
  const pairs = new Map();
  for (const p of activePositions(0)) {
    const id = cardIdentity(board[p]);
    const a = pairs.get(id) ?? [];
    a.push(p); pairs.set(id, a);
  }
  const three = [...pairs.values()].slice(0, 3);
  for (const [a, b] of three) {
    g.select(a); finishFlip(g);
    g.select(b); finishFlip(g);
    g.tick(90); g.tick(2);
  }
  assert.equal(g.score[0], 3);
  assert.equal(g.state, PLAY_STATE.CLEARED);
  assert.equal(g.winner, 0);
  assert.equal(g.stateTimer, 180);
  g.tick(180);
  assert.equal(g.state, PLAY_STATE.DONE);
}

console.log('All Concentration Room state-machine tests passed.');
