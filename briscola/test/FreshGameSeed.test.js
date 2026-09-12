// SPDX-License-Identifier: GPL-3.0-only
import assert from "node:assert/strict";
import test from "node:test";
import { freshGameSeed, nextSeriesScore, nextStartingPlayer } from "../src/ui/WebUI.js";

test("a new game gets the current timestamp when it differs from the previous seed", () => {
  assert.equal(freshGameSeed(100, 200), 200);
});

test("a new game seed still changes when the clock value matches the previous seed", () => {
  assert.equal(freshGameSeed(200, 200), 201);
});

test("seed comparison uses the same uint32 normalization as BriscolaGame", () => {
  assert.equal(freshGameSeed(5, 0x1_0000_0005), 6);
});

test("uint32 seed collision at the maximum value wraps to a different seed", () => {
  assert.equal(freshGameSeed(0xffff_ffff, 0xffff_ffff), 0);
});

test("best-of-three finishes when either player reaches two wins", () => {
  const first = nextSeriesScore([0, 0], { winner: 0, draw: false });
  assert.deepEqual(first, { wins: [1, 0], complete: false });
  const second = nextSeriesScore(first.wins, { winner: 0, draw: false });
  assert.deepEqual(second, { wins: [2, 0], complete: true });
});

test("a draw does not award a best-of-three win", () => {
  assert.deepEqual(nextSeriesScore([1, 1], { winner: null, draw: true }), {
    wins: [1, 1],
    complete: false
  });
});

test("the opening player alternates between completed games", () => {
  assert.equal(nextStartingPlayer(0), 1);
  assert.equal(nextStartingPlayer(1), 0);
});
