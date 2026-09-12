// SPDX-FileCopyrightText: 2021 DevilSquirrel
// SPDX-FileCopyrightText: 2026 Umberto Bresciani
// SPDX-License-Identifier: MIT

/**
 * JavaScript port of MinimalKlondike's board/search architecture.
 *
 * Provenance: reference/minimal-klondike/Entities/Board.cs (MIT).
 * This first faithful layer keeps the same deal encoding, Klondike move rules,
 * draw/recycle semantics, foundation fallback moves and bounded best-first
 * search. It uses readable JS arrays instead of the C# packed unsafe structs.
 */
const SUIT_CODE = { 1: "c", 2: "d", 3: "h", 4: "s" };
const SUIT_INDEX = { c: 0, d: 1, h: 2, s: 3 };
const IS_RED = { c: false, d: true, h: true, s: false };
const SUIT_NUMBER = { c: 1, d: 2, h: 3, s: 4 };

function decodeCard(token) {
  const rank = Number(token.slice(0, 2));
  const suit = SUIT_CODE[token[2]];
  return { id: `${suit}-${rank}`, suit, rank };
}

export function boardFromMinimalDeal(encoded, drawCount = 1) {
  const cards = encoded.match(/.{3}/g)?.map(decodeCard) ?? [];
  if (cards.length !== 52 || new Set(cards.map((card) => card.id)).size !== 52) {
    throw new Error("MinimalKlondike deal must be a unique 52-card deck");
  }

  const tableau = Array.from({ length: 7 }, () => ({ cards: [], hidden: 0 }));
  let cursor = 0;
  for (let row = 0; row < 7; row++) {
    for (let pile = row; pile < 7; pile++) tableau[pile].cards.push(cards[cursor++]);
  }
  for (const pile of tableau) pile.hidden = Math.max(0, pile.cards.length - 1);

  return {
    drawCount,
    rounds: 0,
    foundations: [0, 0, 0, 0],
    tableau,
    // C# deal position 29 is first to turn; stack end is next to draw.
    stock: cards.slice(28).reverse(),
    waste: [],
  };
}

export function shuffledMinimalDeal(seed = 1) {
  let value = seed >>> 0;
  const random = () => {
    value ^= value << 13; value ^= value >>> 17; value ^= value << 5;
    return (value >>> 0) / 4294967296;
  };
  const cards = ["c", "d", "h", "s"].flatMap((suit) =>
    Array.from({ length: 13 }, (_, index) => ({ suit, rank: index + 1 })),
  );
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards.map((card) => `${String(card.rank).padStart(2, "0")}${SUIT_NUMBER[card.suit]}`).join("");
}

function cloneBoard(board) {
  return {
    drawCount: board.drawCount,
    rounds: board.rounds,
    foundations: [...board.foundations],
    tableau: board.tableau.map((pile) => ({ cards: [...pile.cards], hidden: pile.hidden })),
    stock: [...board.stock],
    waste: [...board.waste],
  };
}

function top(array) { return array[array.length - 1]; }
function fitsTableau(card, parent) {
  return parent ? parent.rank === card.rank + 1 && IS_RED[parent.suit] !== IS_RED[card.suit] : card.rank === 13;
}
function fitsFoundation(board, card) {
  return board.foundations[SUIT_INDEX[card.suit]] + 1 === card.rank;
}
function revealAfterMove(pile) {
  if (pile.cards.length && pile.hidden === pile.cards.length) pile.hidden--;
  if (!pile.cards.length) pile.hidden = 0;
}

export function availableSolverMoves(board, { allowFoundationToTableau = true, autoSafe = true } = {}) {
  const moves = [];
  const waste = top(board.waste);
  if (waste) {
    if (fitsFoundation(board, waste)) moves.push({ type: "waste-foundation" });
    board.tableau.forEach((pile, to) => {
      if (fitsTableau(waste, top(pile.cards))) moves.push({ type: "waste-tableau", to });
    });
  }

  board.tableau.forEach((pile, from) => {
    const exposed = pile.cards.slice(pile.hidden);
    const exposedTop = top(exposed);
    if (!exposedTop) return;
    if (fitsFoundation(board, top(pile.cards))) moves.push({ type: "tableau-foundation", from });
    for (let offset = 0; offset < exposed.length; offset++) {
      const card = exposed[offset];
      board.tableau.forEach((target, to) => {
        if (to !== from && fitsTableau(card, top(target.cards))) {
          // Moving an entire visible King stack between empty columns is symmetric.
          if (!target.cards.length && offset === 0 && pile.hidden === 0) return;
          moves.push({ type: "tableau-tableau", from, to, count: exposed.length - offset });
        }
      });
    }
  });

  if (allowFoundationToTableau) {
    board.foundations.forEach((rank, suitIndex) => {
      if (!rank) return;
      const suit = ["c", "d", "h", "s"][suitIndex];
      const card = { id: `${suit}-${rank}`, suit, rank };
      // Same conservative intent as Board.CheckFoundation(): only retreat
      // cards above the safely completed opposite-colour foundations.
      const opposite = IS_RED[suit] ? [0, 3] : [1, 2];
      if (rank <= Math.min(...opposite.map((i) => board.foundations[i])) + 1) return;
      board.tableau.forEach((pile, to) => {
        if (fitsTableau(card, top(pile.cards))) moves.push({ type: "foundation-tableau", suitIndex, to });
      });
    });
  }

  if (autoSafe) {
    const minimum = Math.min(...board.foundations);
    const safe = moves.find((move) => {
      if (move.type === "waste-foundation") return waste.rank <= minimum + 2;
      if (move.type === "tableau-foundation") return top(board.tableau[move.from].cards).rank <= minimum + 2;
      return false;
    });
    if (safe) return [safe];
  }

  if (board.stock.length) moves.push({ type: "draw" });
  else if (board.waste.length) moves.push({ type: "recycle" });
  return moves;
}

export function applySolverMove(board, move) {
  if (move.type === "talon-move") {
    const reached = move.steps.reduce((state, step) => applySolverMove(state, step), board);
    return applySolverMove(reached, move.destination);
  }
  const next = cloneBoard(board);
  if (move.type === "draw") {
    const count = Math.min(next.drawCount, next.stock.length);
    for (let i = 0; i < count; i++) next.waste.push(next.stock.pop());
  } else if (move.type === "recycle") {
    next.stock = next.waste;
    next.waste = [];
    next.rounds++;
  } else if (move.type === "waste-foundation") {
    const card = next.waste.pop();
    next.foundations[SUIT_INDEX[card.suit]]++;
  } else if (move.type === "waste-tableau") {
    next.tableau[move.to].cards.push(next.waste.pop());
  } else if (move.type === "tableau-foundation") {
    const pile = next.tableau[move.from];
    const card = pile.cards.pop();
    next.foundations[SUIT_INDEX[card.suit]]++;
    revealAfterMove(pile);
  } else if (move.type === "tableau-tableau") {
    const source = next.tableau[move.from];
    next.tableau[move.to].cards.push(...source.cards.splice(-move.count));
    revealAfterMove(source);
  } else if (move.type === "foundation-tableau") {
    const suit = ["c", "d", "h", "s"][move.suitIndex];
    const rank = next.foundations[move.suitIndex]--;
    next.tableau[move.to].cards.push({ id: `${suit}-${rank}`, suit, rank });
  } else {
    throw new Error(`Unknown move: ${move.type}`);
  }
  return next;
}

function wasteMoves(board) {
  const moves = [];
  const card = top(board.waste);
  if (!card) return moves;
  if (fitsFoundation(board, card)) moves.push({ type: "waste-foundation" });
  board.tableau.forEach((pile, to) => {
    if (fitsTableau(card, top(pile.cards))) moves.push({ type: "waste-tableau", to });
  });
  return moves;
}

// Readable equivalent of TalonHelper.Calculate: enumerate only waste cards that
// can actually be reached, and attach the draw/redeal operations needed to use
// them. This avoids storing every unproductive intermediate talon state.
function talonMoves(board, maxRounds) {
  const result = [];
  let state = cloneBoard(board);
  const steps = [];
  const seen = new Set();
  while (state.rounds <= maxRounds) {
    const key = `${state.stock.map((c) => c.id).join(",")}|${state.waste.map((c) => c.id).join(",")}`;
    if (seen.has(key)) break;
    seen.add(key);
    for (const destination of wasteMoves(state)) {
      result.push({ type: "talon-move", steps: [...steps], destination });
    }
    if (state.stock.length) {
      const step = { type: "draw" };
      state = applySolverMove(state, step);
      steps.push(step);
    } else if (state.waste.length && state.rounds < maxRounds) {
      const step = { type: "recycle" };
      state = applySolverMove(state, step);
      steps.push(step);
    } else break;
  }
  return result;
}

export function solverStateKey(board) {
  // Tableau columns are interchangeable, as in MinimalKlondike.GameState().
  const tableau = board.tableau
    .map((pile) => `${pile.hidden}:${pile.cards.map((card) => card.id).join(",")}`)
    .sort()
    .join("|");
  return `${board.foundations.join(",")};${board.stock.map((c) => c.id).join(",")};${board.waste.map((c) => c.id).join(",")};${tableau}`;
}

export function minimumMovesRemaining(board, lastRound = false) {
  let moves = board.stock.length + Math.ceil(board.stock.length / board.drawCount) + board.waste.length;
  const scan = (cards, hidden = cards.length) => {
    const mins = [Infinity, Infinity, Infinity, Infinity];
    for (let index = 0; index < cards.length; index++) {
      const card = cards[index];
      const suit = SUIT_INDEX[card.suit];
      if (card.rank < mins[suit]) {
        if (index < hidden) mins[suit] = card.rank;
      } else {
        moves++;
        if (index >= hidden) break;
      }
    }
  };
  if (board.drawCount === 1 || lastRound) scan(board.waste);
  for (const pile of board.tableau) {
    moves += pile.cards.length;
    scan(pile.cards, pile.hidden);
  }
  return moves;
}

function score(board, depth, lastRound = false, heuristic = "fast") {
  const foundation = board.foundations.reduce((sum, rank) => sum + rank, 0);
  if (heuristic === "fast") {
    const hidden = board.tableau.reduce((sum, pile) => sum + pile.hidden, 0);
    return (52 - foundation) * 12 + hidden * 8 + board.stock.length + board.rounds * 6 + depth * 0.05;
  }
  const estimate = depth + minimumMovesRemaining(board, lastRound);
  // Mirrors Board.Solve's priority shape while retaining JS-readable state.
  return estimate * 2 + (52 - foundation) + board.rounds * 2;
}

class MinHeap {
  constructor() { this.items = []; }
  get size() { return this.items.length; }
  push(value) {
    const items = this.items;
    items.push(value);
    let i = items.length - 1;
    while (i) {
      const parent = (i - 1) >> 1;
      if (items[parent].priority <= value.priority) break;
      items[i] = items[parent]; i = parent;
    }
    items[i] = value;
  }
  pop() {
    const items = this.items;
    const root = items[0];
    const last = items.pop();
    if (items.length) {
      let i = 0;
      while (true) {
        let child = i * 2 + 1;
        if (child >= items.length) break;
        if (child + 1 < items.length && items[child + 1].priority < items[child].priority) child++;
        if (items[child].priority >= last.priority) break;
        items[i] = items[child]; i = child;
      }
      items[i] = last;
    }
    return root;
  }
}

function solutionFrom(nodes, index) {
  const moves = [];
  while (index > 0) {
    moves.push(nodes[index].move);
    index = nodes[index].parent;
  }
  return moves.reverse();
}

export function solveMinimalKlondike(initial, {
  maxStates = 250_000,
  maxRounds = 10,
  maxMoves = 250,
  allowFoundationToTableau = true,
  heuristic = "fast",
  macroTalon = false,
} = {}) {
  const started = Date.now();
  const nodes = [{ board: cloneBoard(initial), parent: -1, move: null, depth: 0 }];
  const open = new MinHeap();
  open.push({ index: 0, priority: score(initial, 0, maxRounds === 0, heuristic) });
  const seen = new Map([[solverStateKey(initial), 0]]);
  let bestFoundation = 0;
  let bestIndex = 0;

  while (open.size && nodes.length < maxStates) {
    const currentIndex = open.pop().index;
    const current = nodes[currentIndex];
    if (current.depth >= maxMoves || current.board.rounds > maxRounds) continue;
    let moves = availableSolverMoves(current.board, { allowFoundationToTableau });
    if (macroTalon) {
      moves = moves.filter((move) => !["draw", "recycle", "waste-foundation", "waste-tableau"].includes(move.type));
      moves.push(...talonMoves(current.board, maxRounds));
    }
    for (const move of moves) {
      const board = applySolverMove(current.board, move);
      const depth = current.depth + (move.type === "talon-move" ? move.steps.length + 1 : 1);
      const key = solverStateKey(board);
      if (seen.has(key) && seen.get(key) <= depth) continue;
      seen.set(key, depth);
      const index = nodes.length;
      nodes.push({ board, parent: currentIndex, move, depth });
      const foundation = board.foundations.reduce((sum, rank) => sum + rank, 0);
      if (foundation > bestFoundation) { bestFoundation = foundation; bestIndex = index; }
      if (foundation === 52) {
        return { result: "solved", moves: solutionFrom(nodes, index), states: nodes.length, timeMs: Date.now() - started, foundation };
      }
      open.push({ index, priority: score(board, depth, board.rounds === maxRounds, heuristic) });
      if (nodes.length >= maxStates) break;
    }
  }
  return {
    // Exhaustion in this readable first port is not yet a mathematical proof
    // of impossibility: report Unknown, as the bounded C# solver does at cap.
    result: "unknown",
    moves: solutionFrom(nodes, bestIndex),
    states: nodes.length,
    timeMs: Date.now() - started,
    foundation: bestFoundation,
  };
}
