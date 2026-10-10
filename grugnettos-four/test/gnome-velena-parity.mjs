import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import { oracleOutput, compile, binaryPath, CC } from './oracle-fixtures.mjs';
import {createGame,playMove,snapshot,legalMoves} from '../public/src/core/game.js';
import {createRng} from '../public/src/core/rng.js';
import {gnomeVelenaTacticalPlayer,groupEval,_test} from '../public/src/players/gnome-velena-tactical.js';
const sequences=['','4','443322','121213','445566','142536','171717','43425261'];
const native=oracleOutput('gnome-velena-group-eval',sequences,()=>{const bin=binaryPath('velena-oracle');compile(CC,['-O2','-o',bin,'test/gnome-velena-native-oracle.c']);return execFileSync(bin,sequences,{encoding:'utf8'});},[CC]).trim().split('\n').map(Number);
for(let i=0;i<sequences.length;i++){const g=createGame();for(const c of sequences[i])playMove(g,Number(c)-1);assert.equal(groupEval(_test.makeState(g.board,g.player)),native[i],`group evaluation ${sequences[i]}`);}
assert.equal(_test.groups.length,69);
const opening=gnomeVelenaTacticalPlayer.create({depth:4});
assert.equal(opening.chooseMove(snapshot(createGame()),{rng:createRng(7)}).column,3);
const tactical=createGame();for(const c of [3,2,3,2,3,1])playMove(tactical,c);
assert.equal(opening.chooseMove(snapshot(tactical),{rng:createRng(7)}).column,3);
const constrained=createGame();for(const c of [0,0,0,0,0,0])playMove(constrained,c);
const one=opening.chooseMove(snapshot(constrained),{rng:createRng(20261003)}),two=opening.chooseMove(snapshot(constrained),{rng:createRng(20261003)});
assert(legalMoves(constrained).includes(one.column));assert.deepEqual(one,two);
console.log('GNOME Velena C/JavaScript group evaluation and seeded tactical tests passed.');
