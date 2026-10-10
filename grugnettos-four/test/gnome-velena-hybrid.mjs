import assert from 'node:assert/strict';
import {createGame,playMove,snapshot,legalMoves} from '../public/src/core/game.js';
import {createRng} from '../public/src/core/rng.js';
import {gnomeVelenaHybridPlayer,hybridChoose,_test} from '../public/src/players/gnome-velena-hybrid.js';

const empty=createGame();assert.equal(hybridChoose(snapshot(empty),2,{rng:createRng(1)}).column,3);
for(const [first,reply] of [[1,2],[5,4],[0,3],[3,3]]){const game=createGame();playMove(game,first);const got=hybridChoose(snapshot(game),2,{rng:createRng(1)});assert.equal(got.column,reply);assert.equal(got.kind,'opening');}
const win=createGame();for(const column of [0,1,0,1,0,2])playMove(win,column);const winning=hybridChoose(snapshot(win),1,{rng:createRng(7)});assert.equal(winning.column,0);assert.equal(winning.kind,'immediate-win');
const block=createGame();for(const column of [6,0,6,0,5,0])playMove(block,column);const blocked=hybridChoose(snapshot(block),1,{rng:createRng(7)});assert.equal(blocked.column,0);assert.equal(blocked.kind,'forced-block');
const mid=createGame();for(const column of [3,2,4,3,2,4,1,5])playMove(mid,column);const a=hybridChoose(snapshot(mid),1,{rng:createRng(99)}),b=hybridChoose(snapshot(mid),1,{rng:createRng(99)});assert.deepEqual(a,b);assert(legalMoves(mid).includes(a.column));assert(a.screened>0);assert(a.nodes>0);
assert.deepEqual(_test.PROFILES[3],{nodes:2800,depth:4,defence:500});assert.throws(()=>gnomeVelenaHybridPlayer.create({effort:4}),/Effort/);
console.log('GNOME Velena hybrid controller, seeded cascade and legality tests passed.');
