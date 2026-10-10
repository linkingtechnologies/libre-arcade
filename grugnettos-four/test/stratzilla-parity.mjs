import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { oracleOutput, compile, CXX } from './oracle-fixtures.mjs';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { stratzillaMiniMax, stratzillaTabScore, stratzillaWinningMove } from '../public/src/players/stratzilla.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const binary = path.join(here, '.stratzilla-oracle');
const stdout = oracleOutput('stratzilla', 'stratzilla-native-oracle.cpp', () => {
  compile(CXX, ['-std=c++11', path.join(here, 'stratzilla-native-oracle.cpp'), '-o', binary]);
  const run = spawnSync(binary, [], { encoding: 'utf8' });
  assert.equal(run.status, 0, run.stderr);
  fs.unlinkSync(binary);
  return run.stdout;
}, [CXX]);

const fixtures = [
  Array.from({length:6},()=>Array(7).fill(0)),
  [[1,1,1,0,2,2,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0]],
  [[1,2,1,2,0,0,0],[0,1,1,2,0,0,0],[0,0,2,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0]],
  [[0,1,2,2,0,0,0],[0,0,1,2,0,0,0],[0,0,0,1,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0]],
];
const counts=[0,6,7,6];
const lines=stdout.trim().split('\n');
let line=0;
for(let f=0;f<fixtures.length;f+=1){
  const summary=lines[line++].split(' ');
  assert.equal(Number(summary[2]),stratzillaTabScore(fixtures[f],2));
  assert.equal(Number(summary[4]),Number(stratzillaWinningMove(fixtures[f],1)));
  assert.equal(Number(summary[6]),Number(stratzillaWinningMove(fixtures[f],2)));
  for(let depth=1;depth<=5;depth+=1){
    const fields=lines[line++].split(' ');
    const actual=stratzillaMiniMax(fixtures[f],depth,-2147483647,2147483647,2,counts[f]);
    assert.deepEqual(actual,[Number(fields[4]),Number(fields[6])]);
  }
}
console.log('Stratzilla original C++/port parity: all tests passed.');
