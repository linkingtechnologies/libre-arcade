import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { oracleOutput, PYTHON } from './oracle-fixtures.mjs';
import { createGame, playMove } from '../public/src/core/game.js';
import { _test, gcompris4stattackPlayer as definition } from '../public/src/players/gcompris-4stattack.js';

const vectors=[
  {moves:[],depth:1,seed:0},{moves:[],depth:2,seed:123},
  {moves:[3,2,3,2],depth:3,seed:8675309},
  {moves:[0,1,0,1,0,2],depth:4,seed:42},
  {moves:[3,3,2,4,2,4,1],depth:4,seed:4294967295},
  {moves:[6,0,6,1,5,2],depth:2,seed:20200521},
];
const expected=JSON.parse(oracleOutput('gcompris-4stattack',vectors,()=>{const oracle=spawnSync(PYTHON,['tools/gcompris-4stattack-oracle.py'],{input:JSON.stringify(vectors),encoding:'utf8'});assert.equal(oracle.status,0,oracle.stderr);return oracle.stdout;},[PYTHON]));
function position(moves){const game=createGame();for(const column of moves)playMove(game,column);return game;}
for(let i=0;i<vectors.length;i++){const v=vectors[i],game=position(v.moves),actual=_test.choose(game.board,game.player,v.depth,v.seed);assert.deepEqual(actual,expected[i],`vector ${i}`);}

const py=new _test.PythonRandom(123);assert.deepEqual([py.random(),py.random(),py.random()],[0.052363598850944326,0.08718667752263232,0.4072417636703983]);
const instance=definition.create({depth:4}),game=position([0,1,0,1,0,2]);
const decision=instance.chooseMove(game,{seed:42});assert.equal(decision.column,0);assert(decision.nodes>0);
assert.throws(()=>definition.create({depth:5}),/1\.\.4/);
console.log('GCompris 4st Attack Python/JavaScript random-minimax parity passed.');
