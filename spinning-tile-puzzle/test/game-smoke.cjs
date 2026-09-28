const assert=require('assert'),G=require('../src/game.js');
let s=G.createSolvedState();assert(G.isSolved(s));for(let v=0;v<6;v++){let x=G.createSolvedState();G.spin(x,v,G.SPIN_CW);assert(!G.isSolved(x));G.spin(x,v,G.SPIN_CCW);assert(G.isSolved(x));x=G.createSolvedState();G.spin(x,v,G.SPIN_CW);G.spin(x,v,G.SPIN_CW);G.spin(x,v,G.SPIN_CW);assert(G.isSolved(x));}
const l=G.layout(800,600);assert.deepEqual([l.tileWidth,l.tileHeight,l.spacingX,l.spacingY,l.leftOffset,l.topOffset],[206,240,103,180,91,0]);assert.deepEqual(G.tilePosition(l,0),{x:194,y:0});assert.deepEqual(G.vertexPosition(l,4),{x:400,y:420});
for(let v=0;v<6;v++){const p=G.vertexPosition(l,v);assert.equal(G.getNearestVertex(l,p.x,p.y),v);}
console.log('game-smoke: ok');
