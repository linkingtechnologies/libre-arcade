import assert from 'node:assert/strict';
import { createGame, playMove, snapshot } from '../public/src/core/game.js';
import { allisThreatSpacePlayer as definition, _test } from '../public/src/players/allis-threat-space.js';

function game(moves){const state=createGame();for(const column of moves)playMove(state,column);return state;}

const win=game([0,1,0,1,0,2]);
assert.deepEqual(_test.winningMoves(win.board,1),[0]);
assert.equal(_test.analyze(win.board,1,5).kind,'immediate-win');
assert.equal(_test.analyze(win.board,1,5).column,0);

const block=game([0,1,0,1,0]);
assert.equal(block.player,2);
assert.equal(_test.analyze(block.board,2,5).column,0);

const sequence=game([3,6,4,2,0,4,6,3,4,3,5,0,3,0,3,3,6,4,5]);
const threat=_test.analyze(sequence.board,sequence.player,7);
assert.equal(threat.column,2);
assert.equal(threat.kind,'double-threat');
assert.deepEqual(threat.line,[2,1,2]);

const agent=definition.create({horizon:7});
assert.deepEqual(agent.chooseMove(snapshot(sequence)),agent.chooseMove(snapshot(sequence)));
assert.throws(()=>definition.create({horizon:4}),/3, 5 or 7/);
console.log('Allis clean-room threat-space rule vectors passed.');
