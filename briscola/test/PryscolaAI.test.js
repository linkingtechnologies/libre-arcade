// SPDX-License-Identifier: GPL-3.0-only
import test from "node:test";
import assert from "node:assert/strict";

import { PryscolaAI } from "../src/players/pryscola/PryscolaAI.js";
import {
  pryscolaCard,
  pryscolaBeats,
  toPryscolaCard
} from "../src/players/pryscola/PryscolaCard.js";

const c = (seed, value) => pryscolaCard(seed, value);

test("Pryscola card mapping preserves the upstream French-suit model", () => {
  assert.deepEqual(toPryscolaCard({ suit: "coppe", rank: 1 }), c("CUORI", "ASSO"));
  assert.deepEqual(toPryscolaCard({ suit: "denari", rank: 3 }), c("QUADRI", "TRE"));
  assert.deepEqual(toPryscolaCard({ suit: "spade", rank: 8 }), c("PICCHE", "JACK"));
  assert.deepEqual(toPryscolaCard({ suit: "bastoni", rank: 10 }), c("FIORI", "RE"));
});

test("Pryscola Card.beats behavior is preserved", () => {
  const trump = c("QUADRI", "DUE");
  assert.equal(pryscolaBeats(c("QUADRI", "QUATTRO"), c("CUORI", "ASSO"), trump), true);
  assert.equal(pryscolaBeats(c("CUORI", "ASSO"), c("QUADRI", "DUE"), trump), false);
  assert.equal(pryscolaBeats(c("CUORI", "TRE"), c("CUORI", "RE"), trump), true);
});

test("Pryscola leads with hand index zero without sorting", () => {
  const hand = [c("CUORI", "ASSO"), c("PICCHE", "DUE"), c("QUADRI", "RE")];
  const ai = new PryscolaAI();
  assert.equal(ai.chooseCard({ hand, cardsplayed: [], briscola: c("FIORI", "DUE") }), 0);
  assert.deepEqual(hand.map((card) => card.value), ["ASSO", "DUE", "RE"]);
});

test("Pryscola stably sorts a replying hand by points", () => {
  const hand = [c("CUORI", "ASSO"), c("PICCHE", "DUE"), c("QUADRI", "QUATTRO")];
  const ai = new PryscolaAI();
  ai.chooseCard({
    hand,
    cardsplayed: [c("CUORI", "DUE")],
    briscola: c("FIORI", "DUE")
  });
  assert.deepEqual(hand.map((card) => `${card.seed}:${card.value}`), [
    "PICCHE:DUE",
    "QUADRI:QUATTRO",
    "CUORI:ASSO"
  ]);
});

test("Pryscola uses a point-bearing same-suit card to overtake", () => {
  const hand = [c("PICCHE", "DUE"), c("CUORI", "TRE"), c("QUADRI", "RE")];
  const ai = new PryscolaAI();
  // After point sorting: DUE (0), RE (4), TRE (10); TRE is the first same-suit
  // card whose points exceed the opponent's RE.
  assert.equal(ai.chooseCard({
    hand,
    cardsplayed: [c("CUORI", "RE")],
    briscola: c("FIORI", "DUE")
  }), 2);
});

test("Pryscola spends a trump only when the current winning card has points", () => {
  const ai = new PryscolaAI();
  const handWithPoints = [c("PICCHE", "DUE"), c("FIORI", "QUATTRO"), c("QUADRI", "DUE")];
  assert.equal(ai.chooseCard({
    hand: handWithPoints,
    cardsplayed: [c("CUORI", "RE")],
    briscola: c("FIORI", "DUE")
  }), 1);

  const zeroPointHand = [c("PICCHE", "DUE"), c("FIORI", "QUATTRO"), c("QUADRI", "DUE")];
  assert.equal(ai.chooseCard({
    hand: zeroPointHand,
    cardsplayed: [c("CUORI", "SETTE")],
    briscola: c("FIORI", "DUE")
  }), 0);
});
