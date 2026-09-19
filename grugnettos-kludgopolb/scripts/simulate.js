import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadBoard } from '../public/src/node/board-loader.js';
import { Game } from '../public/src/core/game.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const value = flag => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
};
const seed = Number(value('--seed') ?? 12345);
const agents = (value('--agents') ?? 'Zilla,Queen,Wallace,Hans').split(',');
const board = loadBoard(path.join(root, 'public', 'boards', 'grugnetto-32-v1.4', 'board.json'));
const game = new Game({ board, agents, seed, trace: args.includes('--trace') });
const result = game.run();
console.log(JSON.stringify(result, null, 2));
if (args.includes('--trace')) console.log(JSON.stringify(game.log, null, 2));
