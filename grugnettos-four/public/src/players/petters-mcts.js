/* Faithful structural port of Petter Strandmark's MCTS library and ConnectFourState.
 * Original: MIT (2013–2020). Adapter: GPL-3.0-only; MIT notice retained.
 */

const ROWS = 6;
const COLUMNS = 7;
const NO_MOVE = -1;

function seededRng(seed) {
  let state = (Number(seed) >>> 0) || 0x6d2b79f5;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

class ConnectFourState {
  constructor(source) {
    if (source) {
      this.board = source.board.map((row) => row.slice());
      this.playerToMove = source.playerToMove;
      this.lastColumn = source.lastColumn;
      this.lastRow = source.lastRow;
    } else {
      this.board = Array.from({ length: ROWS }, () => Array(COLUMNS).fill(0));
      this.playerToMove = 1;
      this.lastColumn = -1;
      this.lastRow = -1;
    }
  }

  clone() { return new ConnectFourState(this); }

  doMove(column) {
    let row = ROWS - 1;
    while (this.board[row][column] !== 0) row -= 1;
    this.board[row][column] = this.playerToMove;
    this.lastColumn = column;
    this.lastRow = row;
    this.playerToMove = 3 - this.playerToMove;
  }

  getWinner() {
    if (this.lastColumn < 0) return 0;
    const piece = this.board[this.lastRow][this.lastColumn];
    const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
    for (const [dr, dc] of directions) {
      let count = 1;
      for (const sign of [-1, 1]) {
        let row = this.lastRow + dr * sign;
        let column = this.lastColumn + dc * sign;
        while (row >= 0 && row < ROWS && column >= 0 && column < COLUMNS && this.board[row][column] === piece) {
          count += 1; row += dr * sign; column += dc * sign;
        }
      }
      if (count >= 4) return piece;
    }
    return 0;
  }

  getMoves() {
    if (this.getWinner() !== 0) return [];
    return Array.from({ length: COLUMNS }, (_, column) => column).filter((column) => this.board[0][column] === 0);
  }

  hasMoves() { return this.getMoves().length > 0; }

  doRandomMove(rng) {
    while (true) {
      const column = Math.floor(rng() * COLUMNS);
      if (this.board[0][column] === 0) { this.doMove(column); return; }
    }
  }

  getResult(currentPlayerToMove) {
    const winner = this.getWinner();
    if (winner === 0) return 0.5;
    return winner === currentPlayerToMove ? 0 : 1;
  }
}

class Node {
  constructor(state, move = NO_MOVE, parent = null) {
    this.move = move;
    this.parent = parent;
    this.playerToMove = state.playerToMove;
    this.wins = 0;
    this.visits = 0;
    this.moves = state.getMoves();
    this.children = [];
    this.uctScore = 0;
  }

  getUntriedMove(rng) { return this.moves[Math.floor(rng() * this.moves.length)]; }

  selectChildUCT() {
    let best = this.children[0];
    let bestScore = -Infinity;
    for (const child of this.children) {
      child.uctScore = child.wins / child.visits + Math.sqrt(2 * Math.log(this.visits) / child.visits);
      if (child.uctScore > bestScore) { best = child; bestScore = child.uctScore; }
    }
    return best;
  }

  addChild(move, state) {
    const child = new Node(state, move, this);
    this.children.push(child);
    const index = this.moves.indexOf(move);
    this.moves[index] = this.moves[this.moves.length - 1];
    this.moves.pop();
    return child;
  }

  update(result) { this.visits += 1; this.wins += result; }
}

function computeTree(rootState, iterations, seed) {
  const rng = seededRng(seed);
  const root = new Node(rootState);
  for (let iteration = 0; iteration < iterations; iteration += 1) {
    let node = root;
    const state = rootState.clone();
    while (node.moves.length === 0 && node.children.length > 0) {
      node = node.selectChildUCT();
      state.doMove(node.move);
    }
    if (node.moves.length > 0) {
      const move = node.getUntriedMove(rng);
      state.doMove(move);
      node = node.addChild(move, state);
    }
    while (state.hasMoves()) state.doRandomMove(rng);
    while (node) {
      node.update(state.getResult(node.playerToMove));
      node = node.parent;
    }
  }
  return root;
}

export function pettersComputeMove(state, { iterations = 1000, trees = 8, seed = 0 } = {}) {
  const moves = state.getMoves();
  if (moves.length === 1) return { column: moves[0], simulations: 0, expectedSuccess: 1 };
  const visits = new Map();
  const wins = new Map();
  for (let tree = 0; tree < trees; tree += 1) {
    const treeSeed = ((Number(seed) >>> 0) ^ (1012411 * tree + 12515)) >>> 0;
    const root = computeTree(state, iterations, treeSeed);
    for (const child of root.children) {
      visits.set(child.move, (visits.get(child.move) || 0) + child.visits);
      wins.set(child.move, (wins.get(child.move) || 0) + child.wins);
    }
  }
  let bestColumn = moves[0]; let bestScore = -1;
  for (const move of [...visits.keys()].sort((a, b) => a - b)) {
    const expected = ((wins.get(move) || 0) + 1) / ((visits.get(move) || 0) + 2);
    if (expected > bestScore) { bestColumn = move; bestScore = expected; }
  }
  return { column: bestColumn, simulations: iterations * trees, expectedSuccess: bestScore, visits: Object.fromEntries(visits) };
}

function fromPosition(position) {
  const state = new ConnectFourState();
  const own = position.player;
  state.board = Array.from({ length: ROWS }, (_, row) =>
    Array.from({ length: COLUMNS }, (_, column) => {
      const cell = position.board[column][row];
      if (cell === 0) return 0;
      return cell === own ? 1 : 2;
    }));
  state.playerToMove = 1;
  if (position.moves.length) {
    state.lastColumn = position.moves[position.moves.length - 1];
    state.lastRow = state.board.findIndex((row) => row[state.lastColumn] !== 0);
  }
  return state;
}

export const pettersMctsPlayer = {
  id: 'petters-mcts',
  name: 'PetterS MCTS',
  source: 'PetterS/monte-carlo-tree-search, commit 52a6208',
  license: 'MIT (original); GPL-3.0-only adapter',
  family: 'monte-carlo-tree-search-uct',
  settings: { key: 'iterations', label: 'Iterations/tree', values: [100, 500, 2000, 10000], default: 500 },
  capabilities: { deterministic: false, supportsSeed: true, supportsDifficulty: true, reportsNodes: true, perfectPlay: false },
  create(options = {}) {
    const iterations = Number(options.iterations ?? 500);
    const trees = Number(options.trees ?? 8);
    if (!Number.isInteger(iterations) || iterations < 1) throw new RangeError('MCTS iterations must be positive');
    return {
      id: `petters-mcts-i${iterations}x${trees}`,
      reset() {},
      chooseMove(position, context = {}) {
        const seed = context.seed ?? Math.floor((context.rng?.() ?? Math.random()) * 4294967296);
        const result = pettersComputeMove(fromPosition(position), { iterations, trees, seed: (Number(seed) + position.moves.length) >>> 0 });
        return { column: result.column, nodes: result.simulations, iterations, trees, expectedSuccess: result.expectedSuccess };
      },
    };
  },
};

export const _test = { ConnectFourState, Node, computeTree, fromPosition, seededRng };
