/*
 * Browser port of Pascal Pons' Connect4 Solver position and search design.
 * Original and this derived module: AGPL-3.0-or-later.
 */

const WIDTH = 7;
const HEIGHT = 6;
const CELLS = WIDTH * HEIGHT;
const ORDER = [3, 4, 2, 5, 1, 6, 0];
const BOARD_MASK = (1n << BigInt(WIDTH * (HEIGHT + 1))) - 1n;
const BOTTOM_MASK = Array.from({ length: WIDTH }, (_, column) => 1n << BigInt(column * (HEIGHT + 1))).reduce((a, b) => a | b, 0n);
const PLAYABLE_MASK = Array.from({ length: WIDTH }, (_, column) => ((1n << BigInt(HEIGHT)) - 1n) << BigInt(column * (HEIGHT + 1))).reduce((a, b) => a | b, 0n);

const columnMask = (column) => ((1n << BigInt(HEIGHT)) - 1n) << BigInt(column * (HEIGHT + 1));
const topMask = (column) => 1n << BigInt((HEIGHT - 1) + column * (HEIGHT + 1));
const bottomMask = (column) => 1n << BigInt(column * (HEIGHT + 1));

function popcount(value) {
  let count = 0;
  for (let bits = value; bits; bits &= bits - 1n) count += 1;
  return count;
}

function computeWinningPosition(position, mask) {
  let result = (position << 1n) & (position << 2n) & (position << 3n);
  for (const shift of [BigInt(HEIGHT + 1), BigInt(HEIGHT), BigInt(HEIGHT + 2)]) {
    let pair = (position << shift) & (position << (2n * shift));
    result |= pair & (position << (3n * shift));
    result |= pair & (position >> shift);
    pair = (position >> shift) & (position >> (2n * shift));
    result |= pair & (position << shift);
    result |= pair & (position >> (3n * shift));
  }
  return result & (PLAYABLE_MASK ^ mask);
}

export class PonsPosition {
  constructor(source) {
    this.current = source?.current ?? 0n;
    this.mask = source?.mask ?? 0n;
    this.moves = source?.moves ?? 0;
  }

  clone() { return new PonsPosition(this); }
  key() { return this.current + this.mask; }
  canPlay(column) { return (this.mask & topMask(column)) === 0n; }
  possible() { return (this.mask + BOTTOM_MASK) & PLAYABLE_MASK & BOARD_MASK; }
  winningPosition() { return computeWinningPosition(this.current, this.mask); }
  opponentWinningPosition() { return computeWinningPosition(this.current ^ this.mask, this.mask); }
  canWinNext() { return (this.winningPosition() & this.possible()) !== 0n; }
  isWinningMove(column) { return (this.winningPosition() & this.possible() & columnMask(column)) !== 0n; }

  play(move) {
    this.current ^= this.mask;
    this.mask |= move;
    this.moves += 1;
  }

  playColumn(column) { this.play((this.mask + bottomMask(column)) & columnMask(column)); }

  possibleNonLosingMoves() {
    let possible = this.possible();
    const opponentWin = this.opponentWinningPosition();
    const forced = possible & opponentWin;
    if (forced) {
      if (forced & (forced - 1n)) return 0n;
      possible = forced;
    }
    return possible & ~(opponentWin >> 1n);
  }

  moveScore(move) { return popcount(computeWinningPosition(this.current | move, this.mask)); }
}

class SearchLimit extends Error {}

export class PonsSolver {
  constructor({ nodeLimit = Infinity } = {}) {
    this.nodeLimit = nodeLimit;
    this.nodes = 0;
    this.table = new Map();
  }

  negamax(position, alpha, beta) {
    this.nodes += 1;
    if (this.nodes > this.nodeLimit) throw new SearchLimit();
    const originalAlpha = alpha;
    const possible = position.possibleNonLosingMoves();
    if (possible === 0n) return -Math.floor((CELLS - position.moves) / 2);
    if (position.moves >= CELLS - 2) return 0;
    const cached = this.table.get(position.key());
    if (cached?.exact) return cached.value;
    if (cached?.lower) alpha = Math.max(alpha, cached.value);
    if (cached?.upper) beta = Math.min(beta, cached.value);
    if (alpha >= beta) return cached.value;

    const candidates = ORDER
      .map((column) => ({ column, move: possible & columnMask(column) }))
      .filter((entry) => entry.move)
      .map((entry, index) => ({ ...entry, score: position.moveScore(entry.move), index }))
      .sort((a, b) => b.score - a.score || a.index - b.index);
    let value = -CELLS;
    for (const candidate of candidates) {
      const child = position.clone();
      child.play(candidate.move);
      value = Math.max(value, -this.negamax(child, -beta, -alpha));
      alpha = Math.max(alpha, value);
      if (alpha >= beta) break;
    }
    const entry = { value };
    if (value <= originalAlpha) entry.upper = true;
    else if (value >= beta) entry.lower = true;
    else entry.exact = true;
    this.table.set(position.key(), entry);
    return value;
  }

  solve(position, weak = false) {
    if (position.canWinNext()) return Math.floor((CELLS + 1 - position.moves) / 2);
    let min = weak ? -1 : -Math.floor((CELLS - position.moves) / 2);
    let max = weak ? 1 : Math.floor((CELLS + 1 - position.moves) / 2);
    while (min < max) {
      let middle = min + Math.floor((max - min) / 2);
      if (middle <= 0 && Math.trunc(min / 2) < middle) middle = Math.trunc(min / 2);
      else if (middle >= 0 && Math.trunc(max / 2) > middle) middle = Math.trunc(max / 2);
      const result = this.negamax(position, middle, middle + 1);
      if (result <= middle) max = result;
      else min = result;
    }
    return min;
  }

  analyze(position, weak = false) {
    const scores = Array(WIDTH).fill(null);
    for (let column = 0; column < WIDTH; column += 1) {
      if (!position.canPlay(column)) continue;
      if (position.isWinningMove(column)) scores[column] = Math.floor((CELLS + 1 - position.moves) / 2);
      else {
        const child = position.clone();
        child.playColumn(column);
        scores[column] = -this.solve(child, weak);
      }
    }
    return scores;
  }
}

function fromMoves(moves) {
  const position = new PonsPosition();
  for (const column of moves) position.playColumn(column);
  return position;
}

function boundedChoice(position, nodeLimit) {
  const safeMask = position.canWinNext() ? position.possible() : position.possibleNonLosingMoves();
  const legal = ORDER.filter((column) => position.canPlay(column) && (!safeMask || (safeMask & columnMask(column))));
  const winning = legal.find((column) => position.isWinningMove(column));
  if (winning !== undefined) return { column: winning, nodes: 0, exact: true };
  let best = legal[0];
  let bestScore = -Infinity;
  let completed = 0;
  for (const column of legal) {
    const child = position.clone();
    child.playColumn(column);
    const solver = new PonsSolver({ nodeLimit: Math.max(1, nodeLimit - completed) });
    try {
      const score = -solver.solve(child, true);
      completed += solver.nodes;
      if (score > bestScore) { best = column; bestScore = score; }
    } catch (error) {
      completed += solver.nodes;
      if (!(error instanceof SearchLimit)) throw error;
      break;
    }
  }
  return { column: best, nodes: completed, exact: completed <= nodeLimit && bestScore > -Infinity, score: bestScore };
}

export const pascalPonsPlayer = {
  id: 'pascal-pons-bitboard',
  name: 'Pascal Pons Bitboard',
  source: 'PascalPons/connect4, commit d6ba50d',
  license: 'AGPL-3.0-or-later',
  family: 'bitboard-negamax-transposition-table',
  settings: { key: 'nodes', label: 'Node budget', values: [1000, 10000, 50000, 250000], default: 10000 },
  capabilities: { deterministic: true, supportsSeed: false, supportsDifficulty: true, reportsNodes: true, perfectPlay: false, exactEndgames: true },
  create(options = {}) {
    const nodes = Number(options.nodes ?? 10000);
    if (!Number.isInteger(nodes) || nodes < 1) throw new RangeError('Node budget must be positive');
    return {
      id: `pascal-pons-n${nodes}`,
      reset() {},
      chooseMove(position) {
        const result = boundedChoice(fromMoves(position.moves), nodes);
        return { column: result.column, nodes: result.nodes, exact: result.exact, score: result.score };
      },
    };
  },
};

export const _test = { computeWinningPosition, fromMoves, boundedChoice, popcount };
