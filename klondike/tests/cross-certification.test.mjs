import assert from "node:assert/strict";
import test from "node:test";
import { boardFromMinimalDeal, shuffledMinimalDeal, solveMinimalKlondike } from "../src/solver/minimal-klondike-js.js";
import { replaySolverCertificate } from "../lib/solver-reference-adapter.js";

for (const drawCount of [1, 3]) {
  test(`random certificate is accepted by restored engine with draw ${drawCount}`, { timeout: 20_000 }, () => {
    const encoded = shuffledMinimalDeal(1);
    const board = boardFromMinimalDeal(encoded, drawCount);
    const solved = solveMinimalKlondike(board, { maxStates: 10_000 });
    assert.equal(solved.result, "solved");
    assert.equal(replaySolverCertificate({ encoded }, board, solved.moves).won, true);
  });
}
