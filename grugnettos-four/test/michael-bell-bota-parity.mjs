import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { createGame, playMove, snapshot } from '../public/src/core/game.js';
import { createRng } from '../public/src/core/rng.js';
import { michaelBellBotaPlayer, _test } from '../public/src/players/michael-bell-bota.js';

const checksum = (path) => crypto.createHash('sha256').update(fs.readFileSync(new URL(path, import.meta.url))).digest('hex');
assert.equal(checksum('../reference/michael-bell-connectfour/original/COPYING'), '8ceb4b9ee5adedde47b31e975c1d90c73ad27b6b165a1dcd80c7c545eb65b903');
assert.equal(checksum('../reference/michael-bell-connectfour/original/board.py'), '9ab3e692123986af4ee928b482a9162b937873a88d1cb7fc771fec0d9961ad6c');
assert.equal(checksum('../reference/michael-bell-connectfour/original/c4bot.py'), '5bdc922959600b4025fd180a01895ddfd48bdaf80881f50883b1a7d16bbfdf6b');
assert.equal(checksum('../reference/michael-bell-connectfour/original/trainer.py'), '7faacd1e7e11b9df1004d623e9ebde7693290356dbd0823b5dbb7c954bfcacf4');

assert.equal(_test.metadata.sourceCommit, 'cb92ebe7350eb590ad4de783b860cc5e612c1943');
assert.equal(_test.metadata.trainingGames, 10000);
assert.equal(_test.metadata.seed, 20121012);
assert.equal(_test.metadata.states, 36005);
assert.equal(_test.knowledge.size, 36005);

const board = Array.from({ length: 7 }, () => Array(6).fill(0));
board[0][5] = 1; board[1][5] = 2; board[6][5] = 1;
assert.equal(_test.boardId(board), 1216n);
const mirrored = board.slice().reverse().map((column) => column.slice());
assert.equal(_test.canonicalId(board), _test.canonicalId(mirrored));

const player = michaelBellBotaPlayer.create({ trainingGames: 10000 });
const first = player.chooseMove(snapshot(createGame()), { rng: createRng(7) });
const replay = player.chooseMove(snapshot(createGame()), { rng: createRng(7) });
assert.deepEqual(first, replay);
assert.equal(first.column, 0);
assert.equal(first.tiedCandidates, 2);

const game = createGame(); playMove(game, 3);
const response = player.chooseMove(snapshot(game), { rng: createRng(7) });
assert.equal(response.column, 1);
assert.equal(response.value, 0.8);
assert.equal(response.tiedCandidates, 2);
assert.throws(() => michaelBellBotaPlayer.create({ trainingGames: 9999 }), /10,000-game/);
console.log('Michael Bell BotA historical-policy tests: all tests passed.');
