// SPDX-License-Identifier: GPL-3.0-only
import test from "node:test";
import assert from "node:assert/strict";
import { cardLabel } from "../src/ui/CardRenderer.js";

test("card labels use complete Italian names without emoji", () => {
  assert.equal(cardLabel({ rank: 1, suit: "spade" }), "Asso di spade");
  assert.equal(cardLabel({ rank: 3, suit: "denari" }), "Tre di denari");
  assert.equal(cardLabel({ rank: 9, suit: "coppe" }), "Cavallo di coppe");
  assert.equal(cardLabel({ rank: 10, suit: "bastoni" }), "Re di bastoni");
});
