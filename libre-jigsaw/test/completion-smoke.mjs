import assert from'node:assert/strict';
import{planSolvedPlacement}from'../src/completion.js';
const geom={boardWidth:600,boardHeight:400};
let p=planSolvedPlacement({x:100,y:80,origX:20,origY:10,rotation:3},geom,1000,800);
assert.equal(p.normalizeSteps,-3);
assert.equal(p.dx,120); // target board x 200 - current board origin 80
assert.equal(p.dy,130); // target board y 200 - current board origin 70
p=planSolvedPlacement({x:220,y:210,origX:20,origY:10,rotation:0},geom,1000,800);
assert.deepEqual(p,{normalizeSteps:0,dx:0,dy:0});
console.log('completion smoke: OK');
