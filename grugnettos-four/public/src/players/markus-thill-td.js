/* Port of Markus Thill's 2014/2015 Connect-Four TD n-tuple agent. Original: MIT. */
import { thillWeightsBase64, thillWeightMetadata } from './markus-thill-weights.js';

const WIDTH = 7;
const HEIGHT = 6;
const P1 = 1;
// eslint-disable-next-line no-unused-vars -- seat constant kept next to P1 for symmetry; only P1 is read
const P2 = 2;

function decodeWeights(encoded) {
  const binary = atob(encoded);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  const view = new DataView(bytes.buffer);
  if (String.fromCharCode(...bytes.subarray(0, 4)) !== 'C4TD') throw new Error('Invalid TD weight payload');
  let offset = 4;
  const version = view.getUint8(offset++);
  const tupleCount = view.getUint8(offset++);
  const positionValues = view.getUint8(offset++);
  const tupleLength = view.getUint8(offset++);
  if (version !== 1 || positionValues !== 4) throw new Error('Unsupported TD weight payload');
  const points = Array.from({ length: tupleCount }, () => {
    const tuple = Array.from(bytes.subarray(offset, offset + tupleLength));
    offset += tupleLength;
    return tuple;
  });
  const players = Array.from({ length: 2 }, () => Array.from({ length: tupleCount }, () => {
    const count = view.getUint32(offset, true); offset += 4;
    const indices = new Uint16Array(count);
    const values = new Float32Array(count);
    for (let index = 0; index < count; index += 1) {
      indices[index] = view.getUint16(offset, true); offset += 2;
      values[index] = view.getFloat32(offset, true); offset += 4;
    }
    return { indices, values };
  }));
  if (offset !== bytes.length) throw new Error('Trailing TD weight data');
  return { points, players, tupleCount, tupleLength };
}

const network = decodeWeights(thillWeightsBase64);

function sparseWeight(table, wanted) {
  let low = 0; let high = table.indices.length - 1;
  while (low <= high) {
    const middle = (low + high) >> 1;
    const value = table.indices[middle];
    if (value === wanted) return table.values[middle];
    if (value < wanted) low = middle + 1;
    else high = middle - 1;
  }
  return 0;
}

function cellValues(board) {
  const cells = Array.from({ length: WIDTH }, () => Array(HEIGHT).fill(0));
  for (let column = 0; column < WIDTH; column += 1) {
    let reachable = true;
    for (let row = 0; row < HEIGHT; row += 1) {
      const source = board[column][HEIGHT - 1 - row];
      if (source) { cells[column][row] = source; reachable = true; }
      else if (reachable) { cells[column][row] = 3; reachable = false; }
    }
  }
  return cells;
}

function feature(cells, points, mirror = false) {
  let index = 0; let power = 1;
  for (const point of points) {
    const column = Math.floor(point / HEIGHT);
    const row = point % HEIGHT;
    index += power * cells[mirror ? WIDTH - 1 - column : column][row];
    power *= 4;
  }
  return index;
}

function linearValue(board, playerToMove) {
  const cells = cellValues(board);
  const tables = network.players[playerToMove - 1];
  let score = 0;
  for (let tuple = 0; tuple < network.tupleCount; tuple += 1) {
    const points = network.points[tuple];
    score += sparseWeight(tables[tuple], feature(cells, points, false));
    score += sparseWeight(tables[tuple], feature(cells, points, true));
  }
  return score;
}

const TANH_POINTS = Array.from({ length: 1001 }, (_, index) => Math.fround(Math.tanh(Math.fround(index * Math.fround(12 / 1000)))));
function historicalTanh(input) {
  let value = Math.fround(input); let sign = 1;
  if (value < 0) { sign = -1; value = Math.fround(-value); }
  if (value >= 12) return sign;
  const interval = Math.fround(12 / 1000);
  const entry = Math.trunc((value / 12) * 1000);
  const remainder = Math.fround(value - Math.fround(entry * interval));
  const slope = Math.fround(Math.fround(TANH_POINTS[entry + 1] - TANH_POINTS[entry]) / interval);
  return Math.fround(sign * Math.fround(TANH_POINTS[entry] + Math.fround(slope * remainder)));
}

function value(board, playerToMove) { return historicalTanh(linearValue(board, playerToMove)); }
function legalMoves(board) { return Array.from({ length: WIDTH }, (_, column) => column).filter((column) => board[column][0] === 0); }
function cloneBoard(board) { return board.map((column) => column.slice()); }
function drop(board, column, player) {
  const next = cloneBoard(board);
  for (let row = HEIGHT - 1; row >= 0; row -= 1) if (next[column][row] === 0) { next[column][row] = player; return next; }
  throw new RangeError('Column is full');
}
function wins(board, player) {
  for (let column = 0; column < WIDTH; column += 1) for (let row = 0; row < HEIGHT; row += 1) {
    if (board[column][row] !== player) continue;
    for (const [dx, dy] of [[1, 0], [0, 1], [1, 1], [1, -1]]) {
      let count = 1;
      while (count < 4 && board[column + dx * count]?.[row + dy * count] === player) count += 1;
      if (count === 4) return true;
    }
  }
  return false;
}

function leafScore(board, playerToMove, depth, counter) {
  counter.nodes += 1;
  const moves = legalMoves(board);
  if (!moves.length) return 0;
  if (depth <= 0) return value(board, playerToMove);
  const factor = playerToMove === P1 ? 1 : -1;
  let best = -Infinity;
  for (const column of moves) {
    const after = drop(board, column, playerToMove);
    if (wins(after, playerToMove)) return factor;
    const score = factor * leafScore(after, 3 - playerToMove, depth - 1, counter);
    best = Math.max(best, score);
  }
  return best * factor;
}

function choose(board, player, lookahead = 0) {
  const factor = player === P1 ? 1 : -1;
  let bestColumn = -1; let bestScore = -Infinity;
  const counter = { nodes: 0 };
  for (const column of legalMoves(board)) {
    const after = drop(board, column, player);
    if (wins(after, player)) return { column, score: factor, nodes: counter.nodes, immediate: true };
    const score = factor * leafScore(after, 3 - player, lookahead, counter);
    if (score > bestScore) { bestScore = score; bestColumn = column; }
  }
  return { column: bestColumn, score: bestScore, nodes: counter.nodes, immediate: false };
}

export const markusThillTdPlayer = {
  id: 'markus-thill-td-ntuple',
  name: 'Markus Thill TD n-Tuple',
  source: 'MarkusThill/Connect-Four, commit 2a58844; C4.TCL-EXP-lam0.0',
  license: 'MIT',
  family: 'reinforcement-learning-td-ntuple',
  settings: { key: 'lookahead', label: 'Lookahead', values: [0, 1, 2, 3], default: 0 },
  capabilities: { deterministic: true, supportsSeed: false, supportsDifficulty: true, reportsNodes: true, learnedWeights: true },
  create(options = {}) {
    const lookahead = Number(options.lookahead ?? 0);
    if (!Number.isInteger(lookahead) || lookahead < 0 || lookahead > 3) throw new RangeError('Lookahead must be 0–3');
    return {
      id: `markus-thill-td-l${lookahead}`,
      reset() {},
      chooseMove(position) {
        const result = choose(position.board, position.player, lookahead);
        return { column: result.column, nodes: result.nodes, value: result.score, lookahead };
      },
    };
  },
};

export const _test = { cellValues, feature, historicalTanh, linearValue, value, choose, network, metadata: thillWeightMetadata };
