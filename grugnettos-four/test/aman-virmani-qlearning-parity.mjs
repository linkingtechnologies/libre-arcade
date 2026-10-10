import assert from 'node:assert/strict';
import { createGame, playMove, snapshot } from '../public/src/core/game.js';
import { createRng } from '../public/src/core/rng.js';
import { amanVirmaniQlearningPlayer as definition, _test } from '../public/src/players/aman-virmani-qlearning.js';

assert.equal(_test.metadata.episodesPerSeat,10000);
assert.equal(_test.metadata.seed,20200521);
assert.equal(_test.metadata.records,115589);
assert.equal(_test.knowledge.tables[0].size,36002);
assert.equal(_test.knowledge.tables[1].size,79587);
assert.equal(_test.historicalUpdate(0.25,0,0.75),0.27);
assert.equal(_test.historicalUpdate(-0.2,0,0.5),-0.15000000000000002);

const empty=createGame();
assert.equal(_test.stateId(empty.board),0n);
const first=definition.create({trainingGames:10000});
const a=first.chooseMove(snapshot(empty),{rng:createRng(77)});
const b=definition.create({trainingGames:10000}).chooseMove(snapshot(empty),{rng:createRng(77)});
assert.deepEqual(a,b);
assert(a.column>=0&&a.column<7);

const second=createGame(); playMove(second,3);
const reply=definition.create({trainingGames:10000}).chooseMove(snapshot(second),{rng:createRng(91)});
assert(reply.column>=0&&reply.column<7);
assert.throws(()=>definition.create({trainingGames:9999}),/10,000/);
console.log('Aman Virmani Q-learning: update, payload and seeded-policy tests passed.');
