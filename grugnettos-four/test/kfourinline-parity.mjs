import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
import { oracleOutput, compile, binaryPath, CC } from './oracle-fixtures.mjs';
import {createGame,playMove,snapshot,legalMoves} from '../public/src/core/game.js';import {createRng} from '../public/src/core/rng.js';
import {kdeKfourinlinePlayer,positionEvaluation,_test} from '../public/src/players/kde-kfourinline-humanlike.js';
const sequences=['','4','443322','121213','445566','142536','171717','43425261'];
const values=oracleOutput('kfourinline',sequences,()=>{const bin=binaryPath('kfourinline-oracle');compile(CC,['-O2','-o',bin,'test/kfourinline-native-oracle.c']);return execFileSync(bin,sequences,{encoding:'utf8'});},[CC]).trim().split('\n').map(line=>line.split(' ').map(Number));
for(let i=0;i<sequences.length;i++){const g=createGame();for(const c of sequences[i])playMove(g,Number(c)-1);const s=_test.stateFrom(g.board);assert.equal(positionEvaluation(s,1,()=>0),values[i][0]);assert.equal(positionEvaluation(s,2,()=>0),values[i][1]);}
assert.equal(_test.windows.length,69);
const definition=kdeKfourinlinePlayer.create({level:2}),g=createGame();for(const c of [3,2,3,2,3,1])playMove(g,c);
const a=definition.chooseMove(snapshot(g),{rng:createRng(4000)}),b=definition.chooseMove(snapshot(g),{rng:createRng(4000)});assert.deepEqual(a,b);assert(legalMoves(g).includes(a.column));
const full=createGame();for(const c of [0,0,0,0,0,0])playMove(full,c);assert.notEqual(definition.chooseMove(snapshot(full),{rng:createRng(9)}).column,0);
assert.throws(()=>kdeKfourinlinePlayer.create({level:7}),/Level/);
console.log('KFourInLine 4.0.0 C/JavaScript evaluation and seeded MinMax tests passed.');
