/*
 * Childsplay Fourrow historical AI adapter
 *
 * Faithful JavaScript reimplementation of the AI behaviour found in
 * Childsplay/Schoolsplay fourrow.py, itself derived from Al Sweigart's
 * Four-In-A-Row example.
 *
 * This file intentionally preserves historical quirks, including Python 2
 * integer-division semantics in the recursive evaluator and the fact that
 * Childsplay levels 3 and 4 use the same AI policy.
 *
 * Port code: GPL-3.0-only.
 * Original Childsplay module: GPLv3 header, Stas Zytkiewicz (2011).
 * Upstream algorithm: Al Sweigart, Simplified BSD / BSD-2-Clause.
 */

const BOARD_WIDTH = 7;
const BOARD_HEIGHT = 6;
const RED = 'red';
const BLACK = 'black';

function cloneBoard(board) {
  return board.map((column) => column.slice());
}

function assertBoard(board) {
  if (!Array.isArray(board) || board.length !== BOARD_WIDTH) {
    throw new TypeError('Fourrow board must be 7 columns.');
  }
  for (const column of board) {
    if (!Array.isArray(column) || column.length !== BOARD_HEIGHT) {
      throw new TypeError('Each Fourrow column must contain 6 cells.');
    }
    for (const cell of column) {
      if (cell !== null && cell !== RED && cell !== BLACK) {
        throw new TypeError("Cells must be null, 'red', or 'black'.");
      }
    }
  }
}

function lowestFreeSpace(board, column) {
  for (let y = BOARD_HEIGHT - 1; y >= 0; y -= 1) {
    if (board[column][y] === null) return y;
  }
  return -1;
}

function isValidMove(board, move) {
  return move >= 0 && move < BOARD_WIDTH && board[move][0] === null;
}

function legalMoves(board) {
  const result = [];
  for (let x = 0; x < BOARD_WIDTH; x += 1) {
    if (isValidMove(board, x)) result.push(x);
  }
  return result;
}

function makeMove(board, player, column) {
  const y = lowestFreeSpace(board, column);
  if (y !== -1) board[column][y] = player;
}

function isBoardFull(board) {
  for (let x = 0; x < BOARD_WIDTH; x += 1) {
    for (let y = 0; y < BOARD_HEIGHT; y += 1) {
      if (board[x][y] === null) return false;
    }
  }
  return true;
}

function isWinner(board, tile) {
  for (let y = 0; y < BOARD_HEIGHT; y += 1) {
    for (let x = 0; x < BOARD_WIDTH - 3; x += 1) {
      if (
        board[x][y] === tile && board[x + 1][y] === tile &&
        board[x + 2][y] === tile && board[x + 3][y] === tile
      ) return true;
    }
  }
  for (let x = 0; x < BOARD_WIDTH; x += 1) {
    for (let y = 0; y < BOARD_HEIGHT - 3; y += 1) {
      if (
        board[x][y] === tile && board[x][y + 1] === tile &&
        board[x][y + 2] === tile && board[x][y + 3] === tile
      ) return true;
    }
  }
  for (let x = 0; x < BOARD_WIDTH - 3; x += 1) {
    for (let y = 3; y < BOARD_HEIGHT; y += 1) {
      if (
        board[x][y] === tile && board[x + 1][y - 1] === tile &&
        board[x + 2][y - 2] === tile && board[x + 3][y - 3] === tile
      ) return true;
    }
  }
  for (let x = 0; x < BOARD_WIDTH - 3; x += 1) {
    for (let y = 0; y < BOARD_HEIGHT - 3; y += 1) {
      if (
        board[x][y] === tile && board[x + 1][y + 1] === tile &&
        board[x + 2][y + 2] === tile && board[x + 3][y + 3] === tile
      ) return true;
    }
  }
  return false;
}

// Python 2 int / int uses floor division. Childsplay 3.3 is a Python 2 program.
function py2IntDiv(a, b) {
  return Math.floor(a / b);
}

function sum(values) {
  let total = 0;
  for (const value of values) total += value;
  return total;
}

function getPotentialMoves(board, playerTile, lookAhead, level) {
  // Exact Childsplay ordering/quirk: level 1 short-circuits here too.
  if (lookAhead === 0 || level === 1) return Array(BOARD_WIDTH).fill(0);

  const enemyTile = playerTile === RED ? BLACK : RED;
  if (isBoardFull(board)) return Array(BOARD_WIDTH).fill(0);

  const potentialMoves = Array(BOARD_WIDTH).fill(0);

  for (let playerMove = 0; playerMove < BOARD_WIDTH; playerMove += 1) {
    const dupeBoard = cloneBoard(board);
    if (!isValidMove(dupeBoard, playerMove)) continue;

    makeMove(dupeBoard, playerTile, playerMove);
    if (isWinner(dupeBoard, playerTile)) {
      potentialMoves[playerMove] = 1;
      // Historical behaviour: stop evaluating later candidate columns.
      break;
    }

    if (isBoardFull(dupeBoard)) {
      potentialMoves[playerMove] = 0;
      continue;
    }

    for (let enemyMove = 0; enemyMove < BOARD_WIDTH; enemyMove += 1) {
      const dupeBoard2 = cloneBoard(dupeBoard);
      if (!isValidMove(dupeBoard2, enemyMove)) continue;

      makeMove(dupeBoard2, enemyTile, enemyMove);
      if (isWinner(dupeBoard2, enemyTile)) {
        potentialMoves[playerMove] = -1;
        break;
      }

      const results = getPotentialMoves(
        dupeBoard2,
        playerTile,
        lookAhead - 1,
        level,
      );

      // Preserve Python 2's two successive integer divisions exactly.
      potentialMoves[playerMove] += py2IntDiv(
        py2IntDiv(sum(results), BOARD_WIDTH),
        BOARD_WIDTH,
      );
    }
  }

  return potentialMoves;
}

function randomIndex(length, rng) {
  return Math.floor(rng() * length);
}

function choice(values, rng) {
  if (!values.length) throw new Error('choice() called with an empty list');
  return values[randomIndex(values.length, rng)];
}

function randrange(stop, rng) {
  return Math.floor(rng() * stop);
}

function bestMove(board, difficulty, level, rng) {
  const moves = getPotentialMoves(board, BLACK, difficulty, level);
  let bestMoveScore = -Infinity;
  for (let i = 0; i < BOARD_WIDTH; i += 1) {
    if (isValidMove(board, i) && moves[i] > bestMoveScore) {
      bestMoveScore = moves[i];
    }
  }
  const bestMoves = [];
  for (let i = 0; i < BOARD_WIDTH; i += 1) {
    if (isValidMove(board, i) && moves[i] === bestMoveScore) bestMoves.push(i);
  }
  return choice(bestMoves, rng);
}

function getRandomMove(board, randomLevel, difficulty, level, rng) {
  const legal = legalMoves(board);
  if (!legal.length) return null;

  if (
    randomLevel === 0 ||
    (randomLevel !== -1 && randrange(randomLevel, rng) === 0)
  ) {
    return choice(legal, rng);
  }

  return bestMove(board, difficulty, level, rng);
}

/**
 * Pure historical move selector.
 * Returns a zero-based column or null on a full board.
 */
export function chooseHistoricalMove(board, options = {}) {
  assertBoard(board);
  const level = Number(options.level ?? 6);
  if (!Number.isInteger(level) || level < 1 || level > 6) {
    throw new RangeError('Childsplay Fourrow level must be an integer from 1 to 6.');
  }
  const rng = options.rng ?? Math.random;
  const firstMove = options.firstMove ?? false;

  if (isBoardFull(board)) return null;

  if (firstMove && level > 2) {
    const centreCandidates = [];
    if (isValidMove(board, 3)) centreCandidates.push(3);
    if (isValidMove(board, 4)) centreCandidates.push(4);
    if (centreCandidates.length) return choice(centreCandidates, rng);
  }

  if (level === 1) return getRandomMove(board, 0, 1, level, rng);
  if (level === 2) return getRandomMove(board, 4, 1, level, rng);
  if (level === 3 || level === 4) return getRandomMove(board, 7, 1, level, rng);
  if (level === 5) return getRandomMove(board, -1, 1, level, rng);
  return getRandomMove(board, -1, 2, level, rng);
}

/**
 * ConnectLab-style player definition.
 * Position contract for this drop-in package:
 *   position.board = 7 columns x 6 rows, top-to-bottom cells,
 *                    each cell null | 'red' | 'black'.
 * A small glue mapper may be required by the current ConnectLab core.
 */
export const childsplayFourrowPlayer = {
  id: 'childsplay-fourrow-3.3',
  name: 'Childsplay Fourrow',
  source: 'Childsplay 3.3 / fourrow.py; derived from Al Sweigart Four-In-A-Row',
  license: 'GPL-3.0-only (port); BSD-2-Clause provenance retained for upstream algorithm)',
  family: 'historical-lookahead',
  settings: { key: 'level', label: 'Level', min: 1, max: 6, default: 5 },
  capabilities: {
    deterministic: false,
    supportsSeed: true,
    supportsDifficulty: true,
    reportsNodes: false,
    perfectPlay: false,
  },

  create(options = {}) {
    const level = Number(options.level ?? 6);
    const defaultRng = options.rng ?? Math.random;
    let firstMove = true;

    return {
      id: `childsplay-fourrow-3.3-l${level}`,
      reset() {
        firstMove = true;
      },
      chooseMove(position, context = {}) {
        const rng = context.rng ?? defaultRng;
        const own = position.player;
        const mappedBoard = position.board.map((column) => column.map((cell) => {
          if (cell === 0 || cell === null) return null;
          return cell === own ? BLACK : RED;
        }));
        const move = chooseHistoricalMove(mappedBoard, {
          level,
          rng,
          firstMove,
        });
        firstMove = false;
        return { column: move };
      },
    };
  },
};

export const _test = {
  BOARD_WIDTH,
  BOARD_HEIGHT,
  RED,
  BLACK,
  py2IntDiv,
  legalMoves,
  makeMove,
  isWinner,
  isBoardFull,
  getPotentialMoves,
};
