import test from 'node:test';
import assert from 'node:assert/strict';
import { FACE_IDS } from '../public/src/assets.js';
import { createRng, generatePair, clickCard, resolvePending, isSolved, activeCells } from '../public/src/model.js';

test('recovered face list contains 71 faces and preserves historical 015 gap',()=>{
 assert.equal(FACE_IDS.length,71);assert.equal(FACE_IDS.includes('toys-015'),false);assert.equal(FACE_IDS[0],'toys-001');assert.equal(FACE_IDS.at(-1),'toys-072');
});

test('D0 4x4 is exactly four symbols with four copies each',()=>{
 for(let seed=1;seed<=40;seed++){
  const g=generatePair({size:4,difficulty:0,random:createRng(seed)});const c={};
  for(const [x,y] of activeCells(g.board))c[g.board[x][y]]=(c[g.board[x][y]]||0)+1;
  assert.equal(Object.keys(c).length,4);assert.deepEqual(new Set(Object.values(c)),new Set([4]));
 }
});

test('D0 2x2 falls back to ordinary pairs',()=>{
 const g=generatePair({size:2,difficulty:0,random:createRng(7)});const c={};for(const [x,y] of activeCells(g.board))c[g.board[x][y]]=(c[g.board[x][y]]||0)+1;
 assert.equal(Object.keys(c).length,2);assert.deepEqual(new Set(Object.values(c)),new Set([2]));
});

test('D1 and D2 use pairs for all board sizes',()=>{
 for(const difficulty of [1,2])for(const size of [2,4,6,8]){const g=generatePair({size,difficulty,random:createRng(100+difficulty*10+size)});const c={};for(const [x,y] of activeCells(g.board))c[g.board[x][y]]=(c[g.board[x][y]]||0)+1;assert.deepEqual(new Set(Object.values(c)),new Set([2]));assert.equal(Object.keys(c).length,size*size/2);}
});

test('generated faces are unique symbols before replication',()=>{
 for(let seed=1;seed<40;seed++){const g=generatePair({size:8,difficulty:1,random:createRng(seed)});assert.equal(new Set(g.faces).size,g.faces.length);}
});

test('match stays face-up until 500 ms then removes only selected pair',()=>{
 const g=generatePair({size:4,difficulty:0,random:createRng(13)});const state={...g,difficulty:0,first:null,pending:null};
 const groups=new Map();for(const [x,y] of activeCells(g.board)){const f=g.board[x][y];if(!groups.has(f))groups.set(f,[]);groups.get(f).push([x,y]);}
 const cells=[...groups.values()][0];clickCard(state,...cells[0],1000);const r=clickCard(state,...cells[1],1000);assert.equal(r.kind,'match');assert.equal(state.status[cells[0][0]][cells[0][1]],'up');assert.equal(resolvePending(state,1499),null);assert.equal(resolvePending(state,1500),'match');assert.equal(state.status[cells[0][0]][cells[0][1]],'removed');assert.equal(state.status[cells[1][0]][cells[1][1]],'removed');assert.equal(state.status[cells[2][0]][cells[2][1]],'hidden');assert.equal(state.status[cells[3][0]][cells[3][1]],'hidden');
});

test('D1 mismatch hides the two cards but keeps previous matches removed',()=>{
 const g=generatePair({size:4,difficulty:1,random:createRng(22)});const s={...g,difficulty:1,first:null,pending:null};const groups=new Map();for(const c of activeCells(g.board)){const f=g.board[c[0]][c[1]];(groups.get(f)||groups.set(f,[]).get(f)).push(c);}const vals=[...groups.values()];
 clickCard(s,...vals[0][0],0);clickCard(s,...vals[0][1],0);resolvePending(s,500);assert.equal(s.status[vals[0][0][0]][vals[0][0][1]],'removed');
 clickCard(s,...vals[1][0],600);clickCard(s,...vals[2][0],600);resolvePending(s,1100);assert.equal(s.status[vals[0][0][0]][vals[0][0][1]],'removed');assert.equal(s.status[vals[1][0][0]][vals[1][0][1]],'hidden');
});

test('D2 mismatch restores the complete original board including solved pairs',()=>{
 const g=generatePair({size:4,difficulty:2,random:createRng(31)});const s={...g,difficulty:2,first:null,pending:null};const groups=new Map();for(const c of activeCells(g.board)){const f=g.board[c[0]][c[1]];(groups.get(f)||groups.set(f,[]).get(f)).push(c);}const vals=[...groups.values()];
 clickCard(s,...vals[0][0],0);clickCard(s,...vals[0][1],0);resolvePending(s,500);assert.equal(s.status[vals[0][0][0]][vals[0][0][1]],'removed');
 clickCard(s,...vals[1][0],600);clickCard(s,...vals[2][0],600);assert.equal(resolvePending(s,1100),'mismatch');
 for(const [x,y] of activeCells(g.board))assert.equal(s.status[x][y],'hidden');
});

test('win is true only when every active card is removed',()=>{
 const g=generatePair({size:2,difficulty:1,random:createRng(9)});const s={...g,difficulty:1,first:null,pending:null};assert.equal(isSolved(s),false);for(const [x,y] of activeCells(g.board))s.status[x][y]='removed';assert.equal(isSolved(s),true);
});
