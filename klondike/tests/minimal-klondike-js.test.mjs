import assert from "node:assert/strict";
import test from "node:test";
import {
  applySolverMove,
  availableSolverMoves,
  boardFromMinimalDeal,
  minimumMovesRemaining,
  solveMinimalKlondike,
  solverStateKey,
  shuffledMinimalDeal,
} from "../src/solver/minimal-klondike-js.js";
import { replaySolverCertificate } from "../lib/solver-reference-adapter.js";

test("JS port reads the exact MinimalKlondike deal and draw order", () => {
  const board = boardFromMinimalDeal(shuffledMinimalDeal(1987), 3);
  assert.deepEqual(board.tableau.map((pile) => pile.cards.length), [1, 2, 3, 4, 5, 6, 7]);
  const drawn = applySolverMove(board, { type: "draw" });
  assert.equal(drawn.waste.length, 3);
  assert.equal(new Set(drawn.waste.map((card) => card.id)).size, 3);
});

test("deterministic JS shuffler emits valid reproducible MinimalKlondike deals", () => {
  const first = shuffledMinimalDeal(1987);
  assert.equal(first, shuffledMinimalDeal(1987));
  assert.notEqual(first, shuffledMinimalDeal(1988));
  const board = boardFromMinimalDeal(first, 1);
  assert.equal(board.stock.length, 24);
});

test("JS port certifies and replays a newly generated deal", { timeout: 20000 }, () => {
  const encoded = shuffledMinimalDeal(1);
  const board = boardFromMinimalDeal(encoded, 1);
  const result = solveMinimalKlondike(board, { maxStates: 5000 });
  assert.equal(result.result, "solved", JSON.stringify(result));
  const replayed = result.moves.reduce(applySolverMove, board);
  assert.deepEqual(replayed.foundations, [13, 13, 13, 13]);
  const reference = replaySolverCertificate({ encoded }, board, result.moves);
  assert.equal(reference.won, true);
});

test("JS port creates stable canonical states and legal moves", () => {
  const board = boardFromMinimalDeal(shuffledMinimalDeal(1), 1);
  assert.equal(typeof solverStateKey(board), "string");
  assert.ok(minimumMovesRemaining(board) > 0);
  assert.ok(availableSolverMoves(board).length > 0);
});

test("JS bounded search solves a deterministic runtime shuffle", { timeout: 20000 }, () => {
  const board = boardFromMinimalDeal(shuffledMinimalDeal(1), 1);
  const result = solveMinimalKlondike(board, { maxStates: 50000 });
  assert.equal(result.result, "solved", JSON.stringify(result));
  assert.equal(result.foundation, 52);
  const replayed = result.moves.reduce(applySolverMove, board);
  assert.equal(replayed.foundations.reduce((sum, rank) => sum + rank, 0), 52);
});
