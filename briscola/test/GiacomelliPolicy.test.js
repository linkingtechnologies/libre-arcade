// SPDX-License-Identifier: GPL-3.0-only
import test from "node:test";
import assert from "node:assert/strict";
import { GiacomelliPolicy } from "../src/players/giacomelli/GiacomelliPolicy.js";
import { PiGAdapter, PiHAdapter, PiCAdapter } from "../src/players/giacomelli/GiacomelliAdapter.js";

const c = (suit, rank, points, strength) => ({ id: `${suit}-${rank}`, suit, rank, points, strength });

test("πG prefers cheapest non-trump as leader", () => {
  const policy = new GiacomelliPolicy({ policy: "G" });
  const hand = [
    c("coppe", 2, 0, 1),
    c("denari", 4, 0, 2),
    c("spade", 1, 11, 10)
  ];
  assert.equal(policy.chooseCard({ hand, trumpSuit: "coppe" }).id, "denari-4");
});

test("πG follows with cheapest winning trump even on zero-point lead", () => {
  const policy = new GiacomelliPolicy({ policy: "G" });
  const hand = [
    c("coppe", 2, 0, 1),
    c("bastoni", 4, 0, 2),
    c("spade", 1, 11, 10)
  ];
  const lead = c("denari", 7, 0, 5);
  assert.equal(policy.chooseCard({ hand, lead, trumpSuit: "coppe" }).id, "coppe-2");
});

test("πH refuses to spend trump below the 10-point threshold", () => {
  const policy = new GiacomelliPolicy({ policy: "H" });
  const hand = [
    c("coppe", 2, 0, 1),
    c("bastoni", 4, 0, 2),
    c("spade", 1, 11, 10)
  ];
  const lead = c("denari", 10, 4, 8);
  assert.equal(policy.chooseCard({ hand, lead, trumpSuit: "coppe" }).id, "bastoni-4");
});

test("πH spends the cheapest winning trump on a 10-point carico", () => {
  const policy = new GiacomelliPolicy({ policy: "H" });
  const hand = [
    c("coppe", 2, 0, 1),
    c("coppe", 4, 0, 2),
    c("bastoni", 5, 0, 3)
  ];
  const lead = c("denari", 3, 10, 9);
  assert.equal(policy.chooseCard({ hand, lead, trumpSuit: "coppe" }).id, "coppe-2");
});

test("πC springs the published carico trap when sibling carico is public", () => {
  const policy = new GiacomelliPolicy({ policy: "C" });
  const hand = [
    c("denari", 1, 11, 10),
    c("spade", 4, 0, 2),
    c("coppe", 5, 0, 3)
  ];
  const memory = [c("denari", 3, 10, 9)];
  assert.equal(policy.chooseCard({ hand, trumpSuit: "coppe", memory }).id, "denari-1");
});

test("Giacomelli adapters expose three distinct player identities", () => {
  assert.deepEqual(
    [new PiGAdapter().id, new PiHAdapter().id, new PiCAdapter().id],
    ["giacomelli-pig", "giacomelli-pih", "giacomelli-pic"]
  );
});
