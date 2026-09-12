// SPDX-License-Identifier: GPL-3.0-only
import test from "node:test";
import assert from "node:assert/strict";
import {
  CardFrameworkAI,
  appendAndBubbleRefill,
  cardFrameworkCompareTo,
  insertInitialCard
} from "../src/players/cardframework/CardFrameworkAI.js";
import {
  CardFrameworkCpu0Adapter,
  CardFrameworkCpu1Adapter,
  CardFrameworkCpu2Adapter
} from "../src/players/cardframework/CardFrameworkAdapter.js";

const POINTS = { 1: 11, 3: 10, 8: 2, 9: 3, 10: 4 };
const c = (suit, rank) => ({
  id: `${suit}-${rank}`,
  suit,
  rank,
  points: POINTS[rank] ?? 0
});

test("CardFramework comparer preserves points-before-value ordering", () => {
  assert.equal(cardFrameworkCompareTo(c("denari", 3), c("denari", 1), "coppe"), 1);
  assert.equal(cardFrameworkCompareTo(c("denari", 1), c("denari", 3), "coppe"), -1);
  assert.equal(cardFrameworkCompareTo(c("denari", 10), c("denari", 9), "coppe"), -1);
});

test("CardFramework initial insertion and refill bubble are preserved separately", () => {
  const initial = [];
  for (const card of [c("denari", 2), c("spade", 1), c("coppe", 10)]) {
    insertInitialCard(initial, card, "coppe");
  }
  assert.deepEqual(initial.map((card) => card.id), ["denari-2", "coppe-10", "spade-1"]);

  const refill = [c("denari", 2), c("spade", 1)];
  appendAndBubbleRefill(refill, c("coppe", 10), "coppe");
  assert.deepEqual(refill.map((card) => card.id), ["denari-2", "coppe-10", "spade-1"]);
});

test("CardFramework leader prioritizes 2-4 point non-trump, then zero-point cards", () => {
  const ai = new CardFrameworkAI({ level: 0, trumpSuit: "coppe" });
  const hand = [c("denari", 1), c("spade", 10), c("coppe", 2)];
  assert.equal(ai.chooseIndex({ hand }), 1);

  const noSmallPoints = [c("denari", 1), c("spade", 2), c("coppe", 3)];
  assert.equal(ai.chooseIndex({ hand: noSmallPoints }), 1);
});

test("CardFramework Cpu0 faithfully misses a trump in the final sorted slot", () => {
  const ai = new CardFrameworkAI({ level: 0, trumpSuit: "coppe" });
  const hand = [c("spade", 2), c("bastoni", 4), c("coppe", 1)];
  const lead = c("denari", 3);
  assert.equal(ai.chooseIndex({ hand, lead }), 0);
});

test("CardFramework Cpu1 uses the last higher-point same-suit card", () => {
  const ai = new CardFrameworkAI({ level: 1, trumpSuit: "coppe", randomSeed: 123 });
  const hand = [c("denari", 9), c("denari", 10), c("spade", 2)];
  const lead = c("denari", 8);
  assert.equal(ai.chooseIndex({ hand, lead }), 1);
});

test("CardFramework Cpu2 is reproducible for a fixed BriscoLab seed", () => {
  const a = new CardFrameworkAI({ level: 2, trumpSuit: "coppe", randomSeed: 777 });
  const b = new CardFrameworkAI({ level: 2, trumpSuit: "coppe", randomSeed: 777 });
  const hand = [c("spade", 2), c("coppe", 10), c("bastoni", 4)];
  const lead = c("denari", 10);
  const seqA = Array.from({ length: 20 }, () => a.chooseIndex({ hand, lead }));
  const seqB = Array.from({ length: 20 }, () => b.chooseIndex({ hand, lead }));
  assert.deepEqual(seqA, seqB);
  assert.ok(seqA.every((index) => index >= 0 && index < hand.length));
});

test("CardFramework adapters expose the three upstream CPU identities", () => {
  assert.deepEqual(
    [new CardFrameworkCpu0Adapter().id, new CardFrameworkCpu1Adapter().id, new CardFrameworkCpu2Adapter().id],
    ["cardframework-cpu0", "cardframework-cpu1", "cardframework-cpu2"]
  );
});
