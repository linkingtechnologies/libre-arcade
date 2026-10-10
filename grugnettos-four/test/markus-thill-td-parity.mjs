import assert from 'node:assert/strict';
import { createGame, playMove, snapshot } from '../public/src/core/game.js';
import { _test, markusThillTdPlayer } from '../public/src/players/markus-thill-td.js';

const vectors = new Map([
  ['', 0.6701751759683248],
  ['4', 0.6781816378934309],
  ['4453', 0.1830414426221978],
  ['443322', 2.15264717345417],
  ['12344321', 0.7324284696514951],
  ['7162532', 0.34885034353646915],
  ['44433322', 0.18357451079646125],
]);

function position(sequence) {
  const game = createGame();
  for (const digit of sequence) playMove(game, Number(digit) - 1);
  return snapshot(game);
}

assert.equal(_test.metadata.tuples, 70);
assert.equal(_test.metadata.tupleLength, 8);
assert.equal(_test.metadata.positionValues, 4);
assert.equal(_test.metadata.nonzero, 740863);
for (const [sequence, expected] of vectors) {
  const state = position(sequence);
  assert.equal(_test.linearValue(state.board, state.player), expected, sequence || 'empty');
}

const opening = markusThillTdPlayer.create({ lookahead: 0 }).chooseMove(position(''));
assert.equal(opening.column, 3);
const tactical = markusThillTdPlayer.create({ lookahead: 0 }).chooseMove(position('121213'));
assert.equal(tactical.column, 0);
assert.throws(() => markusThillTdPlayer.create({ lookahead: 4 }), /0–3/);
console.log('Markus Thill trained n-tuple weights and decision vectors: all tests passed.');
