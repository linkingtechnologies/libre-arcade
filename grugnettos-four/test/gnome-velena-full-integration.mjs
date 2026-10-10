import assert from 'node:assert/strict';
import {createGame,playMove,snapshot,legalMoves} from '../public/src/core/game.js';
import {createRng} from '../public/src/core/rng.js';
import {fullVelenaChoose,gnomeVelenaFullIntegrationPlayer,_test} from '../public/src/players/gnome-velena-full-integration.js';

const empty=createGame();
assert.deepEqual(fullVelenaChoose(snapshot(empty),2,{rng:createRng(1)}).components,['opening']);
assert.equal(fullVelenaChoose(snapshot(empty),2,{rng:createRng(1)}).column,3);

const win=createGame();for(const c of[0,1,0,1,0,2])playMove(win,c);
const winning=fullVelenaChoose(snapshot(win),1,{rng:createRng(7)});
assert.equal(winning.column,0);assert.equal(winning.kind,'immediate-win');

const block=createGame();for(const c of[6,0,6,0,5,0])playMove(block,c);
const blocked=fullVelenaChoose(snapshot(block),1,{rng:createRng(7)});
assert.equal(blocked.column,0);assert.equal(blocked.kind,'forced-block');

const integrated=createGame();for(const c of[3,4,1,2,6,2,3,4,0,3,0,1,6])playMove(integrated,c);
const a=fullVelenaChoose(snapshot(integrated),2,{rng:createRng(99)});
const b=fullVelenaChoose(snapshot(integrated),2,{rng:createRng(99)});
assert.deepEqual(a,b);assert.equal(a.column,2);assert.equal(a.kind,'validated-rule-proof');
assert.equal(a.validationStatus,'disproved');assert.deepEqual(a.components,['nine-rules','proof-number','defensive-screen','tactical-lookahead']);
assert(a.nodes>0&&legalMoves(integrated).includes(a.column));

assert.deepEqual(_test.PROFILES[3],{rules:5000,pn:2800,depth:4,defence:500});
assert.throws(()=>gnomeVelenaFullIntegrationPlayer.create({effort:4}),/Effort/);
console.log('GNOME Velena Full Integration: four-layer cascade and validation passed.');
