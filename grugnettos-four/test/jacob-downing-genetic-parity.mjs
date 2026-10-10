import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { oracleOutput, PYTHON } from './oracle-fixtures.mjs';
import { createGame, playMove, snapshot } from '../public/src/core/game.js';
import { jacobDowningGeneticPlayer, _test } from '../public/src/players/jacob-downing-genetic.js';

assert.deepEqual(_test.metadata.network, [42, 25, 7]);
assert.equal(_test.metadata.seed, 20190415);
assert.equal(_test.metadata.generations, 100);
assert.equal(_test.metadata.finalWins, 79);
assert.equal(_test.metadata.finalLosses, 19);

const sequences = [[], [3], [3, 2], [3, 3, 2, 2, 1, 1]];
const inputs = sequences.map((sequence) => {
  const game = createGame(); for (const move of sequence) playMove(game, move);
  return _test.encode(game.board, game.player);
});
const python = String.raw`
import json,sys,numpy as np
sys.path.insert(0,'reference/jacob-downing-genetic-connect-four/original')
from modules.simple_gen_neural_net import SimpleGenNeuralNet
d=json.load(sys.stdin); n=SimpleGenNeuralNet.from_export(d['weights'])
print(json.dumps([n.feed_forward(np.array(x)).flatten().tolist() for x in d['inputs']]))
`;
const oracleInput = JSON.stringify({ weights: _test.weights, inputs });
const originalOutputs = JSON.parse(oracleOutput('jacob-downing-genetic', { python, oracleInput }, () => {
  const oracle = spawnSync(PYTHON, ['-c', python], { input: oracleInput, encoding: 'utf8' });
  assert.equal(oracle.status, 0, oracle.stderr);
  return oracle.stdout;
}, [PYTHON]));
for (let index = 0; index < inputs.length; index += 1) {
  const browser = _test.feedForward(inputs[index]);
  browser.forEach((value, column) => assert(Math.abs(value - originalOutputs[index][column]) < 1e-12));
}

const player = jacobDowningGeneticPlayer.create({ generations: 100 });
const opening = player.chooseMove(snapshot(createGame()));
assert.equal(opening.column, 4);
assert.equal(opening.historicalColumn, 4);
assert.equal(opening.adapterFallback, false);
const fallbackGame = createGame();
for (const move of [1,3,6,4,3,5,0,1,3,5,1,6,6,0,1,1,4,0,2,0,6,4,4,6,6,1]) playMove(fallbackGame, move);
const fallback = player.chooseMove(snapshot(fallbackGame));
assert.equal(fallback.historicalColumn, 1);
assert.equal(fallback.column, 2);
assert.equal(fallback.adapterFallback, true);
assert.throws(() => jacobDowningGeneticPlayer.create({ generations: 99 }), /100-generation/);
console.log('Jacob Downing original Python/JS neural inference parity: all tests passed.');
