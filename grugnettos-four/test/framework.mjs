import assert from 'node:assert/strict';
import { createGame, legalMoves, playMove, findWinningLine, P1 } from '../public/src/core/game.js';
import { createRng } from '../public/src/core/rng.js';
import { childsplayFourrowPlayer } from '../public/src/players/childsplay-fourrow.js';
import { runMatch } from '../public/arena/runner.js';

const vertical = createGame();
for (const column of [0, 1, 0, 1, 0, 1, 0]) playMove(vertical, column);
assert.equal(vertical.winner, P1);
assert.equal(vertical.over, true);
assert.deepEqual(findWinningLine(vertical.board,P1),[{column:0,row:2},{column:0,row:3},{column:0,row:4},{column:0,row:5}]);
assert.throws(() => playMove(vertical, 2), /already over/);

const horizontal = createGame();
for (const column of [0, 0, 1, 1, 2, 2, 3]) playMove(horizontal, column);
assert.equal(horizontal.winner, P1);

const diagonal = createGame();
for (const column of [0, 1, 1, 2, 4, 2, 2, 3, 4, 3, 5, 3, 3]) playMove(diagonal, column);
assert.equal(diagonal.winner, P1);

const fullColumn = createGame();
for (let i = 0; i < 6; i += 1) playMove(fullColumn, 0);
assert(!legalMoves(fullColumn).includes(0));
assert.throws(() => playMove(fullColumn, 0), /full/);
assert.throws(() => playMove(createGame(), 7), /Illegal/);

const rngA = createRng(12345);
const rngB = createRng(12345);
assert.deepEqual(Array.from({ length: 20 }, rngA), Array.from({ length: 20 }, rngB));

const factory = (level) => () => childsplayFourrowPlayer.create({ level });
const one = runMatch({ red: factory(1)(), yellow: factory(6)(), seed: 8675309 });
const two = runMatch({ red: factory(1)(), yellow: factory(6)(), seed: 8675309 });
assert.deepEqual(one.moves, two.moves);
assert(one.moves.length > 6 && one.moves.length <= 42);

console.log('ConnectLab framework: all tests passed.');
