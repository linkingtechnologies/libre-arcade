// SPDX-License-Identifier: GPL-3.0-only
import test from "node:test";
import assert from "node:assert/strict";
import { createDeck } from "../src/core/BriscolaRules.js";
import { BriscolaJsAI, chooseS0Card, chooseAlphaBetaEndgameCard } from "../src/players/briscolajs/BriscolaJsAI.js";
import { BriscolaJsS0Adapter, BriscolaJsS1Adapter } from "../src/players/briscolajs/BriscolaJsAdapter.js";

const deck = createDeck();
const card = (id) => deck.find((item) => item.id === id);

function obs(overrides = {}) {
  return {
    playerId: 1,
    phase: "playing",
    isMyTurn: true,
    isLeading: true,
    hand: [card("coppe-1"), card("denari-7"), card("bastoni-8")],
    opponentHandCount: 3,
    scores: { mine: 0, opponent: 0 },
    table: [],
    playedCards: [],
    stockCount: 20,
    visibleTrump: card("spade-2"),
    trumpSuit: "spade",
    trickNumber: 1,
    ...overrides
  };
}

test("S0 leads a zero-point non-trump before valuable cards and trump", () => {
  assert.equal(chooseS0Card(obs()).id, "denari-7");
});

test("S0 replying maximizes immediate score differential", () => {
  const observation = obs({
    isLeading: false,
    hand: [card("coppe-2"), card("spade-4"), card("coppe-1")],
    table: [{ playerId: 0, card: card("coppe-3") }],
    trumpSuit: "spade"
  });
  // coppe-1 wins 21 points; the cheap trump wins only the 10-point Three.
  assert.equal(chooseS0Card(observation).id, "coppe-1");
});

test("S1 equals S0 before round 18", () => {
  const observation = obs({ trickNumber: 17 });
  assert.equal(new BriscolaJsAI({ strategy: "S1" }).chooseCard(observation).id, chooseS0Card(observation).id);
});

test("alpha-beta endgame infers the opponent hand from public cards", () => {
  const mine = [card("coppe-1"), card("denari-2"), card("bastoni-2")];
  const opponent = [card("coppe-3"), card("spade-1"), card("denari-1")];
  const remainingIds = new Set([...mine, ...opponent].map((item) => item.id));
  const playedCards = deck.filter((item) => !remainingIds.has(item.id));
  const observation = obs({
    hand: mine,
    opponentHandCount: 3,
    playedCards,
    stockCount: 0,
    visibleTrump: null,
    trumpSuit: "spade",
    trickNumber: 18
  });
  const chosen = chooseAlphaBetaEndgameCard(observation);
  assert.ok(chosen && mine.some((item) => item.id === chosen.id));
});

test("S0/S1 adapters expose stable archaeological ids", () => {
  assert.equal(new BriscolaJsS0Adapter().id, "briscolajs-s0");
  assert.equal(new BriscolaJsS1Adapter().id, "briscolajs-s1");
});
