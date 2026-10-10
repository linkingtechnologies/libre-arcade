import assert from 'node:assert/strict';
import {createGame,playMove,snapshot,legalMoves} from '../public/src/core/game.js';
import {createRng} from '../public/src/core/rng.js';
import {connectLabEnsemblePlayer,ensembleChoose,_test} from '../public/src/players/connectlab-ensemble.js';

const win=createGame();for(const c of[0,1,0,1,0,2])playMove(win,c);
assert.equal(connectLabEnsemblePlayer.create({effort:1}).chooseMove(snapshot(win),{rng:createRng(1)}).column,0);

const block=createGame();for(const c of[6,0,6,0,5,0])playMove(block,c);
assert.equal(connectLabEnsemblePlayer.create({effort:1}).chooseMove(snapshot(block),{rng:createRng(1)}).column,0);

// Advisor 1 has the largest raw preference for an unsafe column. Safety is a
// hard gate, so the accepted advisors select column 3 instead.
const danger=createGame();for(const c of[5,4,2,6,2,1,0,2,1,2,4])playMove(danger,c);
const stubs=[
  {name:'thill-td',base:10,actor:{chooseMove:()=>({column:3,nodes:1})}},
  {name:'stratzilla',base:2,actor:{chooseMove:()=>({column:2,nodes:1})}},
];
const guarded=ensembleChoose(snapshot(danger),stubs,1,{rng:createRng(2)});
assert.equal(guarded.column,2);assert.equal(guarded.votes[0].accepted,false);

const mid=createGame();for(const c of[3,2,4,3,2,4,1,5])playMove(mid,c);
const actor=connectLabEnsemblePlayer.create({effort:1});
const a=actor.chooseMove(snapshot(mid),{rng:createRng(2026)});actor.reset();
const b=actor.chooseMove(snapshot(mid),{rng:createRng(2026)});
assert.deepEqual(a,b);assert(legalMoves(mid).includes(a.column));assert.equal(a.votes.length,5);assert(a.nodes>0);
assert.deepEqual(Object.keys(a.totals).map(Number).sort(),a.safeMoves.slice().sort());
assert.deepEqual(_test.PROFILES[3],{td:1,alpha:100000,velena:3,allis:7,stratzilla:5});
assert.throws(()=>connectLabEnsemblePlayer.create({effort:4}),/Effort/);
console.log('ConnectLab Ensemble: tactics, safety gate, votes and seeded replay passed.');
