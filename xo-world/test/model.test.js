'use strict';
const assert=require('assert');
const {XOWorldGame}=require('../src/game-model');
const g=new XOWorldGame({randomFn:()=>0.5});
assert.equal(g.snapshot().turn,0);
let r=g.playHuman(24); assert.equal(r.ok,true); assert.equal(r.cpuMove,35); assert.equal(r.board[24],1); assert.equal(r.board[35],2);
r=g.playHuman(24); assert.equal(r.ok,false); assert.equal(r.reason,'illegal');
const h=new XOWorldGame(); h.engine.t[0][10]=1;h.engine.t[0][11]=1;h.engine.t[0][12]=1;h.engine.t[0][13]=1;h.engine.potez=4;
r=h.playHuman(14);assert.equal(r.winner,1);assert.equal(r.status,2);
console.log('MODEL FLOW PASS');
// Explicit CPU-win terminal-state coverage.
const c=new XOWorldGame();
c.engine.t[0][20]=2;c.engine.t[0][21]=2;c.engine.t[0][22]=2;c.engine.t[0][23]=2;
c.engine.t[0][70]=1;c.engine.potez=5;
r=c.playHuman(71);
assert.equal(r.winner,2);assert.equal(r.status,3);
console.log('TERMINAL STATES PASS');
