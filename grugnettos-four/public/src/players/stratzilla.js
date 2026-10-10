/* Faithful JavaScript port of stratzilla/connect-four source.cpp.
 * Original and port: GPL-3.0-only. Historical search and scoring preserved.
 */

const ROWS = 6;
const COLUMNS = 7;
const PLAYER = 1;
const COMPUTER = 2;
const INT_MIN = -2147483648;
const INT_MAX = 2147483647;

function cloneBoard(board) { return board.map((row) => row.slice()); }

function makeMove(board, column, player) {
  for (let row = 0; row < ROWS; row += 1) {
    if (board[row][column] === 0) { board[row][column] = player; break; }
  }
}

export function stratzillaHeuristic(good, bad, empty) {
  if (good === 4) return 500001;
  if (good === 3 && empty === 1) return 5000;
  if (good === 2 && empty === 2) return 500;
  if (bad === 2 && empty === 2) return -501;
  if (bad === 3 && empty === 1) return -5001;
  if (bad === 4) return -500000;
  return 0;
}

export function stratzillaScoreSet(values, player) {
  let good = 0; let occupied = 0; let empty = 0;
  for (const value of values) {
    good += value === player ? 1 : 0;
    occupied += value === PLAYER || value === COMPUTER ? 1 : 0;
    empty += value === 0 ? 1 : 0;
  }
  return stratzillaHeuristic(good, occupied - good, empty);
}

export function stratzillaTabScore(board, player = COMPUTER) {
  let score = 0;
  for (let row = 0; row < ROWS; row += 1) {
    for (let column = 0; column < COLUMNS - 3; column += 1) {
      score += stratzillaScoreSet(board[row].slice(column, column + 4), player);
    }
  }
  for (let column = 0; column < COLUMNS; column += 1) {
    for (let row = 0; row < ROWS - 3; row += 1) {
      score += stratzillaScoreSet(Array.from({ length: 4 }, (_, i) => board[row + i][column]), player);
    }
  }
  for (let row = 0; row < ROWS - 3; row += 1) {
    for (let column = 0; column < COLUMNS - 3; column += 1) {
      score += stratzillaScoreSet(Array.from({ length: 4 }, (_, i) => board[row + i][column + i]), player);
    }
  }
  for (let row = 0; row < ROWS - 3; row += 1) {
    for (let column = 0; column < COLUMNS - 3; column += 1) {
      score += stratzillaScoreSet(Array.from({ length: 4 }, (_, i) => board[row + 3 - i][column + i]), player);
    }
  }
  return score;
}

export function stratzillaWinningMove(board, player) {
  for (let column = 0; column < COLUMNS - 3; column += 1)
    for (let row = 0; row < ROWS; row += 1)
      if ([0, 1, 2, 3].every((i) => board[row][column + i] === player)) return true;
  for (let column = 0; column < COLUMNS; column += 1)
    for (let row = 0; row < ROWS - 3; row += 1)
      if ([0, 1, 2, 3].every((i) => board[row + i][column] === player)) return true;
  for (let column = 0; column < COLUMNS - 3; column += 1)
    for (let row = 3; row < ROWS; row += 1)
      if ([0, 1, 2, 3].every((i) => board[row - i][column + i] === player)) return true;
  for (let column = 0; column < COLUMNS - 3; column += 1)
    for (let row = 0; row < ROWS - 3; row += 1)
      if ([0, 1, 2, 3].every((i) => board[row + i][column + i] === player)) return true;
  return false;
}

export function stratzillaMiniMax(board, depth, alpha, beta, player, turns, stats = { nodes: 0 }) {
  stats.nodes += 1;
  if (depth === 0 || depth >= COLUMNS * ROWS - turns) {
    return [stratzillaTabScore(board, COMPUTER), -1];
  }
  if (player === COMPUTER) {
    let moveSoFar = [INT_MIN, -1];
    if (stratzillaWinningMove(board, PLAYER)) return moveSoFar;
    for (let column = 0; column < COLUMNS; column += 1) {
      if (board[ROWS - 1][column] !== 0) continue;
      const next = cloneBoard(board); makeMove(next, column, player);
      const score = stratzillaMiniMax(next, depth - 1, alpha, beta, PLAYER, turns, stats)[0];
      if (score > moveSoFar[0]) moveSoFar = [score, column];
      alpha = Math.max(alpha, moveSoFar[0]);
      if (alpha >= beta) break;
    }
    return moveSoFar;
  }
  let moveSoFar = [INT_MAX, -1];
  if (stratzillaWinningMove(board, COMPUTER)) return moveSoFar;
  for (let column = 0; column < COLUMNS; column += 1) {
    if (board[ROWS - 1][column] !== 0) continue;
    const next = cloneBoard(board); makeMove(next, column, player);
    const score = stratzillaMiniMax(next, depth - 1, alpha, beta, COMPUTER, turns, stats)[0];
    if (score < moveSoFar[0]) moveSoFar = [score, column];
    beta = Math.min(beta, moveSoFar[0]);
    if (alpha >= beta) break;
  }
  return moveSoFar;
}

function toHistoricalBoard(position) {
  const own = position.player;
  return Array.from({ length: ROWS }, (_, row) =>
    Array.from({ length: COLUMNS }, (_, column) => {
      const cell = position.board[column][ROWS - 1 - row];
      if (cell === 0) return 0;
      return cell === own ? COMPUTER : PLAYER;
    }));
}

export const stratzillaPlayer = {
  id: 'stratzilla-connect-four',
  name: 'Stratzilla C++',
  source: 'stratzilla/connect-four, commit fc1c912',
  license: 'GPL-3.0-only',
  family: 'minimax-alpha-beta-asymmetric',
  settings: { key: 'depth', label: 'Depth', min: 1, max: 8, default: 5 },
  capabilities: { deterministic: true, supportsSeed: false, supportsDifficulty: true, reportsNodes: true, perfectPlay: false },
  create(options = {}) {
    const depth = Number(options.depth ?? 5);
    if (!Number.isInteger(depth) || depth < 0 || depth > 42) throw new RangeError('Stratzilla depth must be 0–42');
    return {
      id: `stratzilla-connect-four-d${depth}`,
      reset() {},
      chooseMove(position) {
        const stats = { nodes: 0 };
        const historicalBoard = toHistoricalBoard(position);
        let result = stratzillaMiniMax(historicalBoard, depth, INT_MIN + 1, INT_MAX, COMPUTER, position.moves.length, stats);
        let adapterFallback = false;
        if (result[1] < 0) {
          adapterFallback = true;
          const legal = Array.from({ length: COLUMNS }, (_, column) => column).filter((column) => historicalBoard[ROWS - 1][column] === 0);
          const safeDepth = Math.min(depth, Math.max(0, COLUMNS * ROWS - position.moves.length - 1));
          if (safeDepth > 0) result = stratzillaMiniMax(historicalBoard, safeDepth, INT_MIN + 1, INT_MAX, COMPUTER, position.moves.length, stats);
          if (result[1] < 0 && legal.length > 0) result = [stratzillaTabScore(historicalBoard, COMPUTER), legal[0]];
        }
        return { column: result[1], score: result[0], nodes: stats.nodes, depth, adapterFallback };
      },
    };
  },
};
