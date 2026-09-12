// SPDX-License-Identifier: GPL-3.0-only
import test from "node:test";
import assert from "node:assert/strict";
import { createDeck, trickWinner, trickPoints } from "../src/core/BriscolaRules.js";

function c(suit, rank) {
  return createDeck().find((card) => card.suit === suit && card.rank === rank);
}

test("deck has 40 unique cards and 120 total points", () => {
  const deck = createDeck();
  assert.equal(deck.length, 40);
  assert.equal(new Set(deck.map((card) => card.id)).size, 40);
  assert.equal(deck.reduce((sum, card) => sum + card.points, 0), 120);
});

test("same suit uses briscola ranking", () => {
  assert.equal(
    trickWinner(
      { playerId: 0, card: c("coppe", 10) },
      { playerId: 1, card: c("coppe", 3) },
      "spade"
    ),
    1
  );
});

test("trump beats non-trump regardless of lead suit", () => {
  assert.equal(
    trickWinner(
      { playerId: 0, card: c("coppe", 1) },
      { playerId: 1, card: c("spade", 2) },
      "spade"
    ),
    1
  );
});

test("off-suit non-trump cannot beat lead", () => {
  assert.equal(
    trickWinner(
      { playerId: 0, card: c("coppe", 2) },
      { playerId: 1, card: c("denari", 1) },
      "spade"
    ),
    0
  );
});

test("trick points are summed", () => {
  assert.equal(
    trickPoints([
      { card: c("coppe", 1) },
      { card: c("denari", 3) }
    ]),
    21
  );
});
