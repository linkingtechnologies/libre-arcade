import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { melilliAlphaBeta, getMelilliScore } from '../public/src/players/melilli-minimax.js';

const root = new URL('../reference/marco-melilli-minimax/original/', import.meta.url);
const context = vm.createContext({ console });
for (const name of ['config.js', 'board.js', 'minimax.js']) {
  vm.runInContext(fs.readFileSync(new URL(name, root), 'utf8'), context, { filename: name });
}

function original(matrix, depth, maximizing = false) {
  context.__matrix = matrix;
  context.__depth = depth;
  context.__maximizing = maximizing;
  return vm.runInContext('Minimax.alphabeta(new CanvasBoard(__matrix), __depth, {score:-9999999}, {score:9999999}, __maximizing)', context);
}

const fixtures = [
  Array.from({ length: 6 }, () => Array(7).fill(0)),
  [[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[1,1,1,0,2,2,0]],
  [[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,2,0,0,0,0],[0,1,1,2,0,0,0],[1,2,1,2,0,0,0]],
  [[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,1,0,0,0],[0,0,1,2,0,0,0],[0,1,2,2,0,0,0]],
];

for (const matrix of fixtures) {
  context.__matrix = matrix;
  assert.equal(getMelilliScore(matrix), vm.runInContext('new CanvasBoard(__matrix).getScore()', context));
  for (const depth of [1, 2, 3, 4]) {
    const expected = original(matrix, depth);
    const actual = melilliAlphaBeta(matrix, depth, { score: -9999999 }, { score: 9999999 }, false);
    assert.deepEqual({ columnMove: actual.columnMove, score: actual.score }, JSON.parse(JSON.stringify(expected)));
  }
}

console.log('Marco Melilli original/port parity: all tests passed.');
