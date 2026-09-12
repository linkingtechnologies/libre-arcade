// SPDX-License-Identifier: GPL-3.0-only
import test from "node:test";
import assert from "node:assert/strict";

import { BriscolaGame } from "../src/core/BriscolaGame.js";
import { PryscolaAdapter } from "../src/players/pryscola/PryscolaAdapter.js";

if (typeof globalThis.CustomEvent === "undefined") {
  globalThis.CustomEvent = class CustomEvent extends Event {
    constructor(type, options = {}) {
      super(type);
      this.detail = options.detail;
    }
  };
}

test("PryscolaAdapter returns only legal BriscoLab actions", async () => {
  for (let seed = 1; seed <= 50; seed += 1) {
    const game = new BriscolaGame({ seed, firstPlayer: 0 });
    const bot = new PryscolaAdapter();

    // Use the first legal card for player 0 and Pryscola for player 1 until the
    // match completes. This exercises both leading and replying decisions.
    while (game.getPublicState().phase === "playing") {
      const playerId = game.getPublicState().turn;
      if (playerId === 0) {
        game.playCard(0, game.legalActions(0)[0].cardId);
      } else {
        const action = await bot.chooseAction(game.getObservation(1));
        assert.ok(game.legalActions(1).some((legal) => legal.cardId === action.cardId));
        game.playCard(1, action.cardId);
      }
    }

    const result = game.getPublicState();
    assert.equal(result.scores[0] + result.scores[1], 120);
  }
});

test("PryscolaAdapter retains the original exposed trump", () => {
  const adapter = new PryscolaAdapter();
  const first = {
    playerId: 1,
    isMyTurn: true,
    hand: [{ id: "coppe-2", suit: "coppe", rank: 2 }],
    table: [],
    visibleTrump: { id: "denari-3", suit: "denari", rank: 3 },
    trumpSuit: "denari"
  };
  assert.equal(adapter.buildLegacyState(first).briscola.value, "TRE");

  const later = { ...first, visibleTrump: null };
  assert.equal(adapter.buildLegacyState(later).briscola.value, "TRE");
});
