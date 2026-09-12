// SPDX-License-Identifier: GPL-3.0-only
import test from "node:test";
import assert from "node:assert/strict";
import {
  POIANA_OBSERVATION_SIZE,
  poianaCardVector,
  poianaTurn,
  vectorizePoianaObservation
} from "../src/players/poiana/PoianaVectorizer.js";

const trump = { id: "denari-1", suit: "denari", rank: 1, points: 11, strength: 10 };
const card = (suit, rank, points) => ({ id: `${suit}-${rank}`, suit, rank, points, strength: 1 });

function observation(overrides = {}) {
  return {
    playerId: 1,
    phase: "playing",
    isMyTurn: true,
    isLeading: true,
    hand: [card("spade", 3, 10), card("coppe", 8, 2), card("bastoni", 10, 4)],
    opponentHandCount: 3,
    scores: { mine: 12, opponent: 7 },
    table: [],
    playedCards: [],
    stockCount: 33,
    visibleTrump: trump,
    trumpSuit: "denari",
    trickNumber: 1,
    ...overrides
  };
}

test("PoIAna card vector maps Italian BriscoLab cards to upstream score/suit/points indices", () => {
  const aceCoins = poianaCardVector(trump);
  assert.equal(aceCoins.length, 31);
  assert.equal(aceCoins[1], 1);   // Ace / Score.Ace
  assert.equal(aceCoins[16], 1);  // Suit.Coins = 2, suit block starts at 14
  assert.equal(aceCoins[30], 1);  // 11 points, points block starts at 19
  assert.equal(aceCoins.reduce((a, b) => a + b, 0), 3);

  const jack = poianaCardVector(card("coppe", 8, 2));
  assert.equal(jack[11], 1); // BriscoLab rank 8 -> upstream Score.Jack = 11
  assert.equal(jack[17], 1); // Cups = 3
  assert.equal(jack[21], 1); // 2 points
});

test("PoIAna vectorizer reproduces the 519-value upstream flatten layout", () => {
  const vector = vectorizePoianaObservation(observation(), trump);
  assert.ok(vector instanceof Float32Array);
  assert.equal(vector.length, POIANA_OBSERVATION_SIZE);

  // Segment starts: briscola=0, hand=31, hand_size=124, my_points=128,
  // order=249, other_hand_size=251, other_points=255,
  // remaining_deck=376, table=417, turn=479.
  assert.equal(vector[124 + 3], 1);
  assert.equal(vector[128 + 12], 1);
  assert.equal(vector[249 + 0], 1);
  assert.equal(vector[251 + 3], 1);
  assert.equal(vector[255 + 7], 1);
  assert.equal(vector[376 + 34], 1); // 33 stock + exposed trump
  assert.equal(vector[479 + 0], 1);  // deployed opening-leader quirk
});

test("PoIAna turn mapping preserves the deployed Godot opening quirk", () => {
  assert.equal(poianaTurn(observation({ trickNumber: 1, isLeading: true })), 0);
  assert.equal(poianaTurn(observation({ trickNumber: 1, isLeading: false })), 1);
  assert.equal(poianaTurn(observation({ trickNumber: 7, isLeading: true })), 7);
});
