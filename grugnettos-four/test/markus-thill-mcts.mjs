import assert from 'node:assert/strict';
import { createGame, playMove, snapshot } from '../public/src/core/game.js';
import { _test, markusThillMctsPlayer } from '../public/src/players/markus-thill-mcts.js';

const empty = snapshot(createGame());
const a = markusThillMctsPlayer.create({ iterations: 500 });
const b = markusThillMctsPlayer.create({ iterations: 500 });
assert.deepEqual(a.chooseMove(empty, { seed: 20261002 }), b.chooseMove(empty, { seed: 20261002 }));

const tacticalGame = createGame();
for (const column of [0, 1, 0, 1, 0, 2]) playMove(tacticalGame, column);
const tactical = markusThillMctsPlayer.create({ iterations: 100 }).chooseMove(snapshot(tacticalGame), { seed: 9 });
assert.equal(tactical.column, 0);
assert.equal(tactical.immediate, true);

const state = new _test.GameState(empty.board, empty.player);
const root = new _test.TreeNode(null, state);
const child = root.expand();
assert.equal(root.find(child.state.key(), 6), child);
assert.equal(_test.EXPLORATION, 2 * Math.SQRT2);
assert.throws(() => markusThillMctsPlayer.create({ iterations: 0 }), /positive/);
console.log('Markus Thill persistent-tree MCTS tests passed.');
