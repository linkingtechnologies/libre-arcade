import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { createGame, playMove, snapshot } from '../public/src/core/game.js';
import { zeta36AlphaZeroPlayer, _test } from '../public/src/players/zeta36-alpha-zero.js';

const hash=(path)=>crypto.createHash('sha256').update(fs.readFileSync(new URL(path,import.meta.url))).digest('hex');
assert.equal(hash('../reference/zeta36-connect4-alpha-zero/original/data/model/model_best_weight.h5'),'1e11d471bbb65d5e6189317dadb0a8c8750c7803b7709391d3f35496c40a9f27');
assert.equal(_test.metadata.sourceCommit,'511150874845335c8687a1a4a8e6bcbc43207fe3');
assert.equal(_test.metadata.bytes,2430348);

const vectors=JSON.parse(fs.readFileSync(new URL('./zeta36-oracle.json',import.meta.url),'utf8'));
for(const vector of vectors){const game=createGame();for(const move of vector.moves)playMove(game,move);const actual=_test.predict(game.board,game.player);actual.policy.forEach((value,index)=>assert(Math.abs(value-vector.policy[index])<4e-7));assert(Math.abs(actual.value-vector.value)<4e-7)}

const player=zeta36AlphaZeroPlayer.create({simulations:2});
const first=player.chooseMove(snapshot(createGame()));
assert.equal(first.column,3);assert.equal(first.nodes,2);assert.equal(first.visits,1);
player.reset();const replay=player.chooseMove(snapshot(createGame()));assert.deepEqual(first,replay);
assert.throws(()=>zeta36AlphaZeroPlayer.create({simulations:3}),/2, 4 or 8/);
console.log('Zeta36 HDF5/NumPy/JavaScript policy-value and PUCT tests passed.');
