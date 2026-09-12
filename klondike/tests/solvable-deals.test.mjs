import assert from "node:assert/strict";
import test from "node:test";
import { cardsFromMinimalDeal } from "../public/src/deal-codec.js";
import { shuffledMinimalDeal } from "../src/solver/minimal-klondike-js.js";
import { createReferenceGame } from "../lib/reference-engine.js";

test("runtime shuffles decode into a complete restored-engine deal", () => {
  const deal = { encoded: shuffledMinimalDeal(1987) };
  const cards = cardsFromMinimalDeal(deal);
  assert.equal(cards.length, 52);
  assert.equal(new Set(cards.map((card) => card.id)).size, 52);
  const game = createReferenceGame(cards);
  assert.equal(game.tableau.reduce((sum, pile) => sum + pile.length, 0), 28);
  assert.equal(game.stock.length, 24);
  assert.notEqual(game.cards[game.stock.at(-1)].id, game.cards[game.stock[0]].id);
});

test("multiple runtime seeds each contain one complete deck", () => {
  for (let seed = 1; seed <= 20; seed++) {
    const deal = { encoded: shuffledMinimalDeal(seed) };
    const cards = cardsFromMinimalDeal(deal);
    assert.equal(cards.length, 52, seed);
    assert.equal(new Set(cards.map((card) => card.id)).size, 52, seed);
  }
});
