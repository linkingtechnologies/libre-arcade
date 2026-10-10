import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { oracleOutput, compile, CXX } from './oracle-fixtures.mjs';
import { fileURLToPath } from 'node:url';
import { _test, pettersComputeMove } from '../public/src/players/petters-mcts.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const binary = path.join(here, '.petters-state-oracle');
const original = path.resolve(here, '../reference/petters-mcts/original');
const nativeStdout = oracleOutput('petters-mcts-state', 'petters-native-state-oracle.cpp', () => {
  compile(CXX, ['-std=c++11', '-I', original, path.join(here, 'petters-native-state-oracle.cpp'), '-o', binary]);
  const native = spawnSync(binary, [], { encoding: 'utf8' });
  assert.equal(native.status, 0, native.stderr);
  fs.unlinkSync(binary);
  return native.stdout;
}, [CXX]);

const sequences = [[0,1,0,1,0,2],[0,1,0,1,0,2,0],[0,1,1,2,4,2,2,3,4,3,5,3,3]];
const lines = nativeStdout.trim().split('\n');
for (let index=0; index<sequences.length; index+=1) {
  const state = new _test.ConnectFourState();
  sequences[index].forEach((move)=>state.doMove(move));
  const parts = lines[index].split(' ');
  assert.equal(state.playerToMove, Number(parts[1]));
  const nativeWinner = parts[3] === '.' ? 0 : parts[3] === 'X' ? 1 : 2;
  assert.equal(state.getWinner(), nativeWinner);
  const marker = parts.indexOf('moves');
  const resultMarker = parts.indexOf('result1');
  const nativeMoves = parts.slice(marker+1, resultMarker<0?undefined:resultMarker).map(Number);
  assert.deepEqual(state.getMoves(), nativeMoves);
  if(resultMarker>=0){assert.equal(state.getResult(1),Number(parts[resultMarker+1]));assert.equal(state.getResult(2),Number(parts[resultMarker+3]));}
}

const tactical = new _test.ConnectFourState();
[0,1,0,1,0,2].forEach((move)=>tactical.doMove(move));
const one = pettersComputeMove(tactical,{iterations:500,trees:8,seed:1234});
const two = pettersComputeMove(tactical,{iterations:500,trees:8,seed:1234});
assert.equal(one.column,0);
assert.deepEqual(one,two);
assert.equal(one.simulations,4000);

console.log('PetterS C++ state/JS state and seeded MCTS tests passed.');
