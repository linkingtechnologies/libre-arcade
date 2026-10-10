/* Port of Michael Bell's 2012 BotA learned state-value policy. Original: GPL-3.0-or-later. */
import { bellBotaBase64, bellBotaMetadata } from './michael-bell-bota-knowledge.js';

const WIDTH = 7;
const HEIGHT = 6;
const POW32 = 0x100000000n;

function decodeKnowledge(encoded) {
  const binary = atob(encoded);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  const view = new DataView(bytes.buffer);
  if (String.fromCharCode(...bytes.subarray(0, 4)) !== 'C4BA') throw new Error('Invalid BotA knowledge payload');
  const version = view.getUint8(4);
  if (version !== 1) throw new Error('Unsupported BotA knowledge payload');
  const count = view.getUint32(5, true);
  const records = new Map();
  let offset = 9;
  for (let index = 0; index < count; index += 1) {
    const low = BigInt(view.getUint32(offset, true)); offset += 4;
    const middle = BigInt(view.getUint32(offset, true)); offset += 4;
    const high = BigInt(view.getUint8(offset)); offset += 1;
    const games = view.getUint32(offset, true); offset += 4;
    const p1Wins = view.getUint32(offset, true); offset += 4;
    records.set(low + middle * POW32 + high * POW32 * POW32, [games, p1Wins]);
  }
  if (offset !== bytes.length) throw new Error('Trailing BotA knowledge data');
  return records;
}

const knowledge = decodeKnowledge(bellBotaBase64);

function boardId(board, mirror = false) {
  let value = 0n;
  for (let row = 0; row < HEIGHT; row += 1) {
    for (let index = 0; index < WIDTH; index += 1) {
      const column = mirror ? WIDTH - 1 - index : index;
      value = value * 3n + BigInt(board[column][row]);
    }
  }
  return value;
}

function canonicalId(board) {
  const direct = boardId(board, false);
  const mirrored = boardId(board, true);
  return direct < mirrored ? direct : mirrored;
}

function legalMoves(board) {
  return Array.from({ length: WIDTH }, (_, column) => column).filter((column) => board[column][0] === 0);
}

function afterMove(board, column, player) {
  const next = board.map((cells) => cells.slice());
  for (let row = HEIGHT - 1; row >= 0; row -= 1) {
    if (next[column][row] === 0) { next[column][row] = player; return next; }
  }
  throw new RangeError('Column is full');
}

function probability(board, player) {
  const record = knowledge.get(canonicalId(board));
  if (!record) return 0.5;
  const [games, p1Wins] = record;
  const p1 = (p1Wins + 1) / (games + 2);
  return player === 1 ? p1 : 1 - p1;
}

function choose(board, player, rng) {
  let best = -Infinity;
  let candidates = [];
  for (const column of legalMoves(board)) {
    const score = probability(afterMove(board, column, player), player);
    if (score > best) { best = score; candidates = [column]; }
    else if (score === best) candidates.push(column);
  }
  if (!candidates.length) return { column: -1, value: 0, candidates: 0 };
  const random = rng?.next ? rng.next() : 0;
  const selected = candidates[Math.min(candidates.length - 1, Math.floor(random * candidates.length))];
  return { column: selected, value: best, candidates: candidates.length };
}

export const michaelBellBotaPlayer = {
  id: 'michael-bell-bota',
  name: 'Michael Bell BotA',
  source: 'mrbell/connectfour, commit cb92ebe; BotA + trainer.py',
  license: 'GPL-3.0-or-later',
  family: 'reinforcement-learning-monte-carlo-tabular',
  settings: { key: 'trainingGames', label: 'Training games', values: [10000], default: 10000 },
  capabilities: { deterministic: false, supportsSeed: true, supportsDifficulty: false, reportsNodes: false, learnedWeights: true },
  create(options = {}) {
    const trainingGames = Number(options.trainingGames ?? 10000);
    if (trainingGames !== 10000) throw new RangeError('Only the preserved 10,000-game snapshot is available');
    return {
      id: 'michael-bell-bota-10k',
      reset() {},
      chooseMove(position, context = {}) {
        const result = choose(position.board, position.player, context.rng);
        return { column: result.column, value: result.value, tiedCandidates: result.candidates, trainingGames };
      },
    };
  },
};

export const _test = { boardId, canonicalId, probability, choose, knowledge, metadata: bellBotaMetadata };
