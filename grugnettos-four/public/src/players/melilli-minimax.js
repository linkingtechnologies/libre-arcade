/*
 * Faithful adapter of Marco Melilli's four-in-a-row-js-minimax (2017).
 * Original: MIT. Adapter/port: GPL-3.0-only, with MIT notice retained.
 *
 * Historical invariants deliberately preserved:
 * - row-major source board and player values 1 (max) / 2 (min);
 * - left-to-right move ordering and first-best tie break;
 * - exact score routine, including its counter-reset behaviour;
 * - original terminal thresholds, alpha/beta values and strict comparisons.
 */

const ROWS = 6;
const COLUMNS = 7;
const HUMAN = 1;
const COMPUTER = 2;
const WINNING_SCORE = 100000;

function cloneMatrix(matrix) {
  return matrix.map((row) => row.slice());
}

function placeMove(matrix, player, column) {
  const board = cloneMatrix(matrix);
  for (let row = ROWS - 1; row >= 0; row -= 1) {
    if (board[row][column] === 0) {
      board[row][column] = player;
      return board;
    }
  }
  return false;
}

function updateScore(humanInRow, computerInRow) {
  let points = 0;
  if (humanInRow === 4) points += WINNING_SCORE;
  else if (humanInRow === 3) points += 5;
  else if (humanInRow === 2) points += 1;
  if (computerInRow === 4) points -= WINNING_SCORE;
  else if (computerInRow === 3) points -= 5;
  else if (computerInRow === 2) points -= 1;
  return points;
}

export function getMelilliScore(matrix) {
  let score = 0;
  for (let row = 0; row < ROWS; row += 1) {
    for (let column = 0; column <= COLUMNS - 4; column += 1) {
      let human = 0; let computer = 0;
      for (let offset = column; offset < column + 4; offset += 1) {
        if (matrix[row][offset] === HUMAN) { human += 1; computer = 0; }
        else if (matrix[row][offset] === COMPUTER) { computer += 1; human = 0; }
      }
      score += updateScore(human, computer);
      if (score <= -WINNING_SCORE || score >= WINNING_SCORE) return score;
    }
  }
  for (let column = 0; column < COLUMNS; column += 1) {
    for (let row = 0; row <= ROWS - 4; row += 1) {
      let human = 0; let computer = 0;
      for (let offset = row; offset < row + 4; offset += 1) {
        if (matrix[offset][column] === HUMAN) { human += 1; computer = 0; }
        else if (matrix[offset][column] === COMPUTER) { computer += 1; human = 0; }
      }
      score += updateScore(human, computer);
      if (score <= -WINNING_SCORE || score >= WINNING_SCORE) return score;
    }
  }
  for (let column = 0; column <= COLUMNS - 4; column += 1) {
    for (let row = 0; row <= ROWS - 4; row += 1) {
      let human = 0; let computer = 0;
      for (let offset = row; offset < row + 4; offset += 1) {
        const cell = matrix[offset][(offset - row) + column];
        if (cell === HUMAN) { human += 1; computer = 0; }
        else if (cell === COMPUTER) { computer += 1; human = 0; }
      }
      score += updateScore(human, computer);
      if (score <= -WINNING_SCORE || score >= WINNING_SCORE) return score;
    }
  }
  for (let column = COLUMNS - 1; column >= COLUMNS - 4; column -= 1) {
    for (let row = 0; row <= ROWS - 4; row += 1) {
      let human = 0; let computer = 0;
      for (let offset = row; offset < row + 4; offset += 1) {
        const cell = matrix[offset][column - (offset - row)];
        if (cell === HUMAN) { human += 1; computer = 0; }
        else if (cell === COMPUTER) { computer += 1; human = 0; }
      }
      score += updateScore(human, computer);
      if (score <= -WINNING_SCORE || score >= WINNING_SCORE) return score;
    }
  }
  return score;
}

function maxScore(x, y) { return x.score > y.score ? { ...x } : { ...y }; }
function minScore(x, y) { return x.score < y.score ? { ...x } : { ...y }; }

export function melilliAlphaBeta(matrix, depth, a, b, maximizingPlayer, stats = { nodes: 0 }) {
  stats.nodes += 1;
  const currentScore = getMelilliScore(matrix);
  const nodes = [];
  const player = maximizingPlayer ? HUMAN : COMPUTER;
  for (let column = 0; column < COLUMNS; column += 1) {
    const next = placeMove(matrix, player, column);
    if (next) nodes[column] = next;
  }
  const isDrawn = nodes.length === 0;
  if (depth === 0 || isDrawn || currentScore <= -WINNING_SCORE || currentScore >= WINNING_SCORE) {
    return { columnMove: null, score: currentScore };
  }
  if (maximizingPlayer) {
    const v = { columnMove: null, score: -99999 };
    for (let i = 0; i <= nodes.length - 1; i += 1) {
      if (!nodes[i]) continue;
      const nextMove = melilliAlphaBeta(nodes[i], depth - 1, a, b, false, stats);
      if (nextMove.score > v.score || v.columnMove === null) {
        v.columnMove = i; v.score = nextMove.score;
      }
      a = maxScore(a, nextMove);
      if (b.score <= a.score) break;
    }
    return v;
  }
  const v = { columnMove: null, score: 99999 };
  for (let i = 0; i <= nodes.length - 1; i += 1) {
    if (!nodes[i]) continue;
    const nextMove = melilliAlphaBeta(nodes[i], depth - 1, a, b, true, stats);
    if (nextMove.score < v.score || v.columnMove === null) {
      v.columnMove = i; v.score = nextMove.score;
    }
    b = minScore(b, nextMove);
    if (b.score <= a.score) break;
  }
  return v;
}

function toHistoricalMatrix(position) {
  const own = position.player;
  return Array.from({ length: ROWS }, (_, row) =>
    Array.from({ length: COLUMNS }, (_, column) => {
      const cell = position.board[column][row];
      if (cell === 0) return 0;
      return cell === own ? COMPUTER : HUMAN;
    }));
}

export const melilliMinimaxPlayer = {
  id: 'marco-melilli-minimax',
  name: 'Marco Melilli Minimax',
  source: 'marcomelilli/four-in-a-row-js-minimax, commit 875faea',
  license: 'MIT (original); GPL-3.0-only adapter',
  family: 'minimax-alpha-beta',
  settings: { key: 'depth', label: 'Depth', min: 1, max: 8, default: 4 },
  capabilities: { deterministic: true, supportsSeed: false, supportsDifficulty: true, reportsNodes: true, perfectPlay: false },
  create(options = {}) {
    const depth = Number(options.depth ?? 4);
    if (!Number.isInteger(depth) || depth < 1 || depth > 8) throw new RangeError('Melilli depth must be 1–8');
    return {
      id: `marco-melilli-minimax-d${depth}`,
      reset() {},
      chooseMove(position) {
        const stats = { nodes: 0 };
        const result = melilliAlphaBeta(toHistoricalMatrix(position), depth, { score: -9999999 }, { score: 9999999 }, false, stats);
        return { column: result.columnMove, score: result.score, nodes: stats.nodes, depth };
      },
    };
  },
};
