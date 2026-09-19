import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadBoard } from '../public/src/node/board-loader.js';
import { runArena } from '../public/src/arena/arena.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const value = flag => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
};
const games = Number(value('--games') ?? 100);
const seed = Number(value('--seed') ?? 1000);
const agents = (value('--agents') ?? 'Zilla,Queen,Wallace,Hans').split(',');
const board = loadBoard(path.join(root, 'public', 'boards', 'grugnetto-32-v1.4', 'board.json'));
const report = runArena({ board, agents, games, seed });
const { results, ...summary } = report;
console.log(JSON.stringify(summary, null, 2));
