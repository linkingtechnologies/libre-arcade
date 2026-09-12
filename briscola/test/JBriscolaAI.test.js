// SPDX-License-Identifier: GPL-3.0-only
import test from "node:test";
import assert from "node:assert/strict";

import { JBriscolaAI } from "../src/players/jbriscola/JBriscolaAI.js";
import {
  JBRISCOLA_COMPARISON,
  compareJBriscolaCards,
  fromJBriscolaNumber,
  getJBriscolaPoints,
  sortJBriscolaHand,
  toJBriscolaNumber
} from "../src/players/jbriscola/JBriscolaCard.js";
import { JavaRandom } from "../src/players/jbriscola/JavaRandom.js";

const card = (suit, rank) => ({ id: `${suit}-${rank}`, suit, rank });

test("JBriscola card encoding matches the original 0..39 layout", () => {
  assert.equal(toJBriscolaNumber(card("bastoni", 1)), 0);
  assert.equal(toJBriscolaNumber(card("coppe", 3)), 12);
  assert.equal(toJBriscolaNumber(card("denari", 10)), 29);
  assert.equal(toJBriscolaNumber(card("spade", 7)), 36);
  assert.deepEqual(fromJBriscolaNumber(20), { suit: "denari", rank: 1 });
});

test("JBriscola point mapping matches CartaHelperBriscola", () => {
  assert.equal(getJBriscolaPoints(0), 11);
  assert.equal(getJBriscolaPoints(2), 10);
  assert.equal(getJBriscolaPoints(9), 4);
  assert.equal(getJBriscolaPoints(8), 3);
  assert.equal(getJBriscolaPoints(7), 2);
  assert.equal(getJBriscolaPoints(6), 0);
});

test("Carta.Compara behavior is preserved", () => {
  const trump = 20; // denari
  assert.equal(compareJBriscolaCards(0, 2, trump), JBRISCOLA_COMPARISON.FIRST_GREATER);
  assert.equal(compareJBriscolaCards(6, 5, trump), JBRISCOLA_COMPARISON.FIRST_GREATER);
  assert.equal(compareJBriscolaCards(16, 26, trump), JBRISCOLA_COMPARISON.SECOND_GREATER);
});

test("CPU hand order matches Giocatore ordinaMano=true", () => {
  const trump = 20;
  const sorted = sortJBriscolaHand(
    [
      { card: card("coppe", 5), number: 14 },
      { card: card("denari", 5), number: 24 },
      { card: card("spade", 1), number: 30 }
    ],
    trump
  );
  assert.deepEqual(sorted.map((item) => item.number), [30, 24, 14]);
});


test("CPU hand ordering reverses equal-comparison cards like Giocatore.AddCarta", () => {
  const trump = 20;
  const sorted = sortJBriscolaHand(
    [
      { card: card("coppe", 5), number: 14 },
      { card: card("spade", 5), number: 34 }
    ],
    trump
  );
  assert.deepEqual(sorted.map((item) => item.number), [34, 14]);
});

test("as leader JBriscola discards the weakest non-trump non-load card", () => {
  const ai = new JBriscolaAI({ briscola: 20, random: new JavaRandom(1) });
  // Sorted hand: A spade, 7 cups, 4 coins (trump). Scan starts from the end.
  assert.equal(ai.scegliCarta({ mano: [30, 16, 23] }), 1);
});

test("when replying JBriscola uses the least same-suit card that overtakes", () => {
  const ai = new JBriscolaAI({ briscola: 20, random: new JavaRandom(1) });
  // 7 cups can be beaten by Fante cups; A spades is unrelated.
  assert.equal(ai.scegliCarta({ mano: [10, 17, 30], cartaAvversario: 16 }), 1);
});

test("JBriscola spends a trump to take an Ace or Three when no overtake exists", () => {
  const ai = new JBriscolaAI({ briscola: 20, random: new JavaRandom(1) });
  assert.equal(ai.scegliCarta({ mano: [22, 36, 15], cartaAvversario: 10 }), 0);
});

test("JavaRandom reproduces java.util.Random nextInt values", () => {
  const random = new JavaRandom(12345);
  assert.deepEqual(
    [random.nextInt(), random.nextInt(), random.nextInt(), random.nextInt()],
    [1553932502, -2090749135, -287790814, -355989640]
  );
});
