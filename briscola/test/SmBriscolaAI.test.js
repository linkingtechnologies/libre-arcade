// SPDX-License-Identifier: GPL-3.0-only
import test from "node:test";
import assert from "node:assert/strict";
import { SmBriscolaEmpirico1AI } from "../src/players/smbriscola/SmBriscolaEmpirico1AI.js";
import { SmBriscolaEmpirico2AI } from "../src/players/smbriscola/SmBriscolaEmpirico2AI.js";
import { smCarta } from "../src/players/smbriscola/SmBriscolaCard.js";

function state({ hand, trump, played = null }) {
  return {
    carte: hand.map(([suit, rank]) => smCarta(suit, rank)),
    briscola: smCarta(...trump),
    cartaGiocata: played ? smCarta(...played) : null
  };
}

test("Empirico1 and Empirico2 are exposed as independent AI classes", () => {
  const e1 = new SmBriscolaEmpirico1AI();
  const e2 = new SmBriscolaEmpirico2AI();
  assert.equal(e1.method, "Empirico1");
  assert.equal(e2.method, "Empirico2");
});

test("Empirico1 leads a non-trump point card before a zero-point discard", () => {
  const ai = new SmBriscolaEmpirico1AI();
  const input = state({
    hand: [["coppe", 10], ["spade", 7], ["bastoni", 2]],
    trump: ["denari", 4]
  });
  assert.equal(ai.scegliCarta(input), 0);
});

test("Empirico2 prefers a zero-point non-trump lead when available", () => {
  const ai = new SmBriscolaEmpirico2AI();
  const input = state({
    hand: [["coppe", 10], ["spade", 7], ["bastoni", 2]],
    trump: ["denari", 4]
  });
  assert.equal(ai.scegliCarta(input), 1);
});

test("Empirico1 and Empirico2 can make different response decisions", () => {
  const input = state({
    hand: [["coppe", 8], ["spade", 3], ["denari", 3]],
    trump: ["denari", 7],
    played: ["denari", 10]
  });

  assert.equal(new SmBriscolaEmpirico1AI().scegliCarta(input), 2);
  assert.equal(new SmBriscolaEmpirico2AI().scegliCarta(input), 0);
});
