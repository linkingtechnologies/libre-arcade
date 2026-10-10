import assert from 'node:assert/strict';
import {createGame,playMove,snapshot,legalMoves} from '../public/src/core/game.js';
import {createRng} from '../public/src/core/rng.js';
import {baselineChoose,controlBaselinePlayer,_test} from '../public/src/players/control-baseline.js';

const empty=createGame();
const randomA=baselineChoose(snapshot(empty),0,{rng:createRng(123)});
const randomB=baselineChoose(snapshot(empty),0,{rng:createRng(123)});
assert.deepEqual(randomA,randomB);assert(legalMoves(empty).includes(randomA.column));

const win=createGame();for(const c of[0,1,0,1,0,2])playMove(win,c);
assert.equal(baselineChoose(snapshot(win),1,{rng:createRng(1)}).column,0);
assert.equal(baselineChoose(snapshot(win),2,{rng:createRng(1)}).column,0);

const block=createGame();for(const c of[6,0,6,0,5,0])playMove(block,c);
const tactical=baselineChoose(snapshot(block),1,{rng:createRng(1)});
assert.equal(tactical.column,0);assert.equal(tactical.kind,'forced-block');

const mid=createGame();for(const c of[3,2,4,3,2,4,1,5])playMove(mid,c);
const negamax=baselineChoose(snapshot(mid),2,{rng:createRng(9)});
assert(legalMoves(mid).includes(negamax.column));assert(negamax.nodes>0);assert.equal(negamax.depth,4);
assert.equal(_test.GROUPS.length,69);assert.deepEqual(_test.PROFILE_NAMES,['Random','Tactical 1-ply','Negamax depth 4']);
assert.throws(()=>controlBaselinePlayer.create({profile:3}),/Profile/);
console.log('Control Baseline: random, tactical and bounded negamax profiles passed.');
