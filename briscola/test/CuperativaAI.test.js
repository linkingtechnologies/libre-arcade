// SPDX-License-Identifier: GPL-3.0-only
import test from "node:test";
import assert from "node:assert/strict";
import { CuperativaAI } from "../src/players/cuperativa/CuperativaAI.js";
import {
  cuperativaCardInfo,
  fromCuperativaLabel,
  toCuperativaLabel
} from "../src/players/cuperativa/CuperativaCard.js";

function choose(state) {
  const ai = new CuperativaAI();
  const card = ai.scegliCarta(state);
  return { card, rule: ai.lastRule };
}

test("Cuperativa label mapping matches the original _Ab/_3d convention", () => {
  assert.equal(toCuperativaLabel({ suit: "bastoni", rank: 1 }), "_Ab");
  assert.equal(toCuperativaLabel({ suit: "denari", rank: 3 }), "_3d");
  assert.deepEqual(fromCuperativaLabel("_Fs"), { suit: "spade", rank: 8 });
  assert.deepEqual(cuperativaCardInfo("_Ac"), {
    rank: 12,
    points: 11,
    suitCode: "c",
    rankCode: "A"
  });
});

test("as leader Cuperativa chooses the minimum-weight card", () => {
  const result = choose({
    cardsOnHand: ["_Ab", "_2c", "_Rd"],
    briscola: "_7s",
    numCardsOnDeck: 33
  });
  assert.deepEqual(result, { card: "_Rd", rule: "FIRST_MIN_WEIGHT" });
});

test("R3 spends trump on a 20+ point capture", () => {
  const result = choose({
    cardsOnHand: ["_Ab", "_2c", "_4d"],
    briscola: "_7b",
    cardPlayed: ["_3c"],
    numCardsOnDeck: 33
  });
  assert.deepEqual(result, { card: "_Ab", rule: "R3" });
});

test("R4 takes a 10+ point card without trump while stock remains", () => {
  const result = choose({
    cardsOnHand: ["_Ac", "_2d", "_4d"],
    briscola: "_7b",
    cardPlayed: ["_3c"],
    numCardsOnDeck: 33
  });
  assert.deepEqual(result, { card: "_Ac", rule: "R4" });
});

test("R10 leaves a zero-point trick", () => {
  const result = choose({
    cardsOnHand: ["_2d", "_5c", "_Ab"],
    briscola: "_7b",
    cardPlayed: ["_4c"],
    numCardsOnDeck: 33
  });
  assert.deepEqual(result, { card: "_2d", rule: "R10" });
});

test("R9 protects cards before drawing a high exposed trump", () => {
  const result = choose({
    cardsOnHand: ["_2d", "_5c", "_Ab"],
    briscola: "_Ab",
    cardPlayed: ["_Rc"],
    numCardsOnDeck: 1
  });
  assert.deepEqual(result, { card: "_2d", rule: "R9" });
});

test("R5 becomes more aggressive when opponent has over 40 points", () => {
  const result = choose({
    cardsOnHand: ["_Rc", "_2d", "_4d"],
    briscola: "_7s",
    cardPlayed: ["_Fc"],
    numCardsOnDeck: -1,
    pointsOpponent: 41
  });
  assert.deepEqual(result, { card: "_Rc", rule: "R5" });
});

test("R6 uses best_taken_card when several captures avoid losing points", () => {
  const result = choose({
    cardsOnHand: ["_Ac", "_3c", "_2d"],
    briscola: "_7s",
    cardPlayed: ["_Rc"],
    numCardsOnDeck: -1
  });
  assert.deepEqual(result, { card: "_3c", rule: "R6" });
});

test("R12 refuses to spend trump Ace/Three for a modest loss", () => {
  const result = choose({
    cardsOnHand: ["_3b", "_Fd", "_Cd"],
    briscola: "_7b",
    cardPlayed: ["_Rc"],
    numCardsOnDeck: -1
  });
  assert.deepEqual(result, { card: "_Fd", rule: "R12" });
});

test("R11 uses a cheap trump when enough points would otherwise be lost", () => {
  const result = choose({
    cardsOnHand: ["_2b", "_Fd", "_Cd"],
    briscola: "_7b",
    cardPlayed: ["_Rc"],
    numCardsOnDeck: -1
  });
  assert.deepEqual(result, { card: "_2b", rule: "R11" });
});
