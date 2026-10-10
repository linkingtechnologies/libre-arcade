/* Structural browser port of Markus Thill's 2014 Java MCTS agent. Original: MIT. */

const WIDTH = 7;
const HEIGHT = 6;
const EXPLORATION = 2 * Math.SQRT2;
const EPSILON = 1e-6;

function seededRng(seed) {
  let state = (Number(seed) >>> 0) || 0x9e3779b9;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function cloneBoard(board) { return board.map((column) => column.slice()); }
function boardKey(board, player) { return `${player}:${board.map((column) => column.join('')).join('|')}`; }
function legalMoves(board) { return Array.from({ length: WIDTH }, (_, column) => column).filter((column) => board[column][0] === 0); }
function play(board, column, player) {
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

class GameState {
  constructor(board, player) { this.board = cloneBoard(board); this.player = player; this.actions = legalMoves(this.board); }
  key() { return boardKey(this.board, this.player); }
  advance(action) { return new GameState(play(this.board, action, this.player), 3 - this.player); }
  winningAction() { return this.actions.find((action) => wins(play(this.board, action, this.player), this.player)) ?? -1; }
  terminal() { return wins(this.board, 3 - this.player) || this.actions.length === 0; }
  rollout(rng) {
    const perspective = this.player;
    let board = cloneBoard(this.board); let player = this.player;
    if (wins(board, 3 - player)) return -1;
    while (true) {
      const actions = legalMoves(board);
      if (!actions.length) return 0;
      const action = actions[Math.floor(rng() * actions.length)];
      board = play(board, action, player);
      if (wins(board, player)) return player === perspective ? 1 : -1;
      player = 3 - player;
    }
  }
}

class TreeNode {
  constructor(parent, state, action = -1) {
    this.parent = parent;
    this.state = state;
    this.action = action;
    this.children = Array(state.actions.length).fill(null);
    this.visits = 0;
    this.reward = 0;
    this.depth = parent ? parent.depth + 1 : 0;
  }
  fullyExpanded() { return this.children.every(Boolean); }
  expand() {
    const index = this.children.findIndex((child) => child === null);
    const action = this.state.actions[index];
    const child = new TreeNode(this, this.state.advance(action), action);
    this.children[index] = child;
    return child;
  }
  bestChild(rng) {
    let best = null; let bestUcb = -Infinity;
    for (const child of this.children) {
      const exploitation = -child.reward / child.visits;
      const exploration = EXPLORATION * Math.sqrt(Math.log(this.visits + 1) / (child.visits + EPSILON));
      const ucb = exploitation + exploration + rng() * EPSILON;
      if (ucb > bestUcb) { best = child; bestUcb = ucb; }
    }
    return best;
  }
  treePolicy(rng) {
    let node = this;
    while (!node.state.terminal()) node = node.fullyExpanded() ? node.bestChild(rng) : node.expand();
    return node;
  }
  search(iterations, rng) {
    const win = this.state.winningAction();
    if (win >= 0) return { column: win, immediate: true };
    for (let iteration = 0; iteration < iterations; iteration += 1) {
      const node = this.treePolicy(rng);
      let result = node.state.rollout(rng);
      for (let current = node; current; current = current.parent) {
        current.visits += 1;
        current.reward += result;
        result = -result;
      }
    }
    return { column: this.mostVisitedAction(), immediate: false };
  }
  bestAction() {
    let best = null; let bestValue = -Infinity;
    for (const child of this.children.filter(Boolean)) {
      const value = -child.reward / child.visits;
      if (value > bestValue) { best = child; bestValue = value; }
    }
    return best?.action ?? this.state.actions[0];
  }
  mostVisitedAction() {
    const children = this.children.filter(Boolean);
    const maximum = Math.max(...children.map((child) => child.visits));
    const leaders = children.filter((child) => child.visits === maximum);
    return leaders.length === children.length ? this.bestAction() : leaders[0].action;
  }
  find(key, remainingDepth = 6) {
    if (this.state.key() === key) return this;
    if (remainingDepth <= 0) return null;
    for (const child of this.children) {
      const found = child?.find(key, remainingDepth - 1);
      if (found) return found;
    }
    return null;
  }
}

export const markusThillMctsPlayer = {
  id: 'markus-thill-mcts',
  name: 'Markus Thill MCTS',
  source: 'MarkusThill/Connect-Four, commit 2a58844',
  license: 'MIT',
  family: 'monte-carlo-tree-search-persistent-uct',
  settings: { key: 'iterations', label: 'Iterations', values: [100, 500, 2000, 10000], default: 500 },
  capabilities: { deterministic: false, supportsSeed: true, supportsDifficulty: true, reportsNodes: true, persistentTree: true },
  create(options = {}) {
    const iterations = Number(options.iterations ?? 500);
    if (!Number.isInteger(iterations) || iterations < 1) throw new RangeError('MCTS iterations must be positive');
    let root = null;
    return {
      id: `markus-thill-mcts-i${iterations}`,
      reset() { root = null; },
      chooseMove(position, context = {}) {
        const state = new GameState(position.board, position.player);
        const previous = root;
        root = root?.find(state.key(), 6) ?? new TreeNode(null, state);
        root.parent = null; root.depth = 0;
        const reused = Boolean(previous && root !== previous && root.visits > 0);
        const seed = ((Number(context.seed ?? 0) >>> 0) + Math.imul(position.moves.length + 1, 0x9e3779b1)) >>> 0;
        const result = root.search(iterations, seededRng(seed));
        return { column: result.column, nodes: result.immediate ? 0 : iterations, visits: root.visits, reused, immediate: result.immediate };
      },
    };
  },
};

export const _test = { GameState, TreeNode, seededRng, wins, legalMoves, play, boardKey, EXPLORATION };
