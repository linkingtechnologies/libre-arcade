// SPDX-License-Identifier: GPL-3.0-only
import test from "node:test";
import assert from "node:assert/strict";
import {
  fromBriscolaBotCardIndex,
  toBriscolaBotCardIndex,
  vectorizeBriscolaBotObservation
} from "../src/players/briscolabot/BriscolaBotVectorizer.js";

const card = (suit, rank) => ({ id: `${suit}-${rank}`, suit, rank });

test("BriscolaBot card encoding matches upstream suit/rank numbering", () => {
  assert.equal(toBriscolaBotCardIndex(card("bastoni", 1)), 0);
  assert.equal(toBriscolaBotCardIndex(card("coppe", 10)), 19);
  assert.equal(toBriscolaBotCardIndex(card("denari", 1)), 20);
  assert.equal(toBriscolaBotCardIndex(card("spade", 10)), 39);
});

test("BriscolaBot card encoding round-trips all 40 cards", () => {
  for (let index = 0; index < 40; index += 1) {
    const decoded = fromBriscolaBotCardIndex(index);
    assert.equal(toBriscolaBotCardIndex(decoded), index);
  }
});

test("vectorizer reproduces the upstream 162-float observation layout", () => {
  const observation = {
    playerId: 1,
    playedCards: [card("bastoni", 1), card("spade", 10)],
    table: [{ playerId: 0, card: card("coppe", 3) }],
    hand: [card("denari", 1), card("denari", 3), card("spade", 2)],
    scores: { mine: 48, opponent: 24 }
  };
  const { observation: vector, actionMask } = vectorizeBriscolaBotObservation(
    observation,
    card("coppe", 7)
  );

  assert.equal(vector.length, 162);
  assert.equal(vector[0], 1);       // seen Bastoni Ace
  assert.equal(vector[39], 1);      // seen Spade 10
  assert.equal(vector[40 + 16], 1); // exposed Coppe 7
  assert.equal(vector[80 + 12], 1); // table Coppe 3
  assert.equal(vector[120 + 20], 1);
  assert.equal(vector[120 + 22], 1);
  assert.equal(vector[120 + 31], 1);
  assert.ok(Math.abs(vector[160] - 48 / 120) < 1e-6);
  assert.ok(Math.abs(vector[161] - 24 / 120) < 1e-6);
  assert.equal(actionMask[20], 1n);
  assert.equal(actionMask[22], 1n);
  assert.equal(actionMask[31], 1n);
  assert.equal(actionMask[0], 0n);
});

test("vectorizer does not duplicate the current table card among thrown cards", () => {
  const table = card("spade", 4);
  const { observation: vector } = vectorizeBriscolaBotObservation({
    playerId: 1,
    playedCards: [],
    table: [{ playerId: 0, card: table }],
    hand: [card("denari", 2)],
    scores: { mine: 0, opponent: 0 }
  }, card("bastoni", 5));
  const index = toBriscolaBotCardIndex(table);
  assert.equal(vector[index], 0);
  assert.equal(vector[80 + index], 1);
});
