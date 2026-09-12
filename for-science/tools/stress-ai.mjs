import { BoardModel } from '../public/src/core/board.js';
import { RandomSource } from '../public/src/core/random.js';
import { findOriginalMove } from '../public/src/ai/original-ai.js';

const total = Number(process.argv[2] || 1000);
let moves = 0;
let valid = 0;
let noMove = 0;

for (let seed = 0; seed < total; seed += 1) {
  const rng = RandomSource.fromSeed(seed);
  const board = new BoardModel(rng);
  const move = findOriginalMove(board, rng);
  if (!move.length) {
    noMove += 1;
    continue;
  }
  moves += 1;
  const [a, b] = move;
  const adjacent = Math.abs(a.x - b.x) + Math.abs(a.y - b.y) === 1;
  board.swap(a, b);
  const result = board.validMove(move);
  board.swap(a, b);
  if (adjacent && result.positions.length > 0) valid += 1;
  else {
    console.error(`Invalid AI move at seed ${seed}: ${JSON.stringify(move)}`);
    process.exitCode = 1;
    break;
  }
}

console.log(JSON.stringify({ seeds: total, moves, valid, noMove }));
if (moves !== valid) process.exitCode = 1;
