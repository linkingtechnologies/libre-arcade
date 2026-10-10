import assert from 'node:assert/strict';
import { createGame,playMove,snapshot } from '../public/src/core/game.js';
import { UCI_NB } from '../public/src/players/uci-naive-bayes-knowledge.js';
import { uciNaiveBayesPlayer,encodeUci,posterior } from '../public/src/players/uci-naive-bayes.js';

assert.equal(UCI_NB.rows,67557);
assert.deepEqual(UCI_NB.classCounts,[44473,16635,6449]);
const game=createGame();for(const move of [3,2,3,2,3,1])playMove(game,move);
assert.deepEqual(encodeUci(game.board).slice(18,24),[0,0,0,2,2,2]);
const probabilities=posterior(game.board,1);assert.ok(Math.abs(probabilities.reduce((a,b)=>a+b,0)-1)<1e-12);
const player=uciNaiveBayesPlayer.create({alpha:1});
assert.equal(player.chooseMove(snapshot(game)).column,3,'takes immediate win');
const block=createGame();for(const move of [0,3,1,3,6,3])playMove(block,move);
assert.equal(player.chooseMove(snapshot(block)).column,3,'blocks one-ply loss');
assert.deepEqual(player.chooseMove(snapshot(block)),player.chooseMove(snapshot(block)),'deterministic replay');
const constrained=createGame();for(const move of [0,0,0,0,0,0])playMove(constrained,move);
assert.notEqual(player.chooseMove(snapshot(constrained)).column,0,'never returns a full column');
console.log('uci-naive-bayes: ok');
