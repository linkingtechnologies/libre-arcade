// SPDX-License-Identifier: GPL-3.0-only
import test from "node:test";
import assert from "node:assert/strict";

import { BriscolaGame } from "../src/core/BriscolaGame.js";
import { JBriscolaAdapter } from "../src/players/jbriscola/JBriscolaAdapter.js";

if (typeof globalThis.CustomEvent === "undefined") {
  globalThis.CustomEvent = class CustomEvent extends Event {
    constructor(type, options = {}) {
      super(type);
      this.detail = options.detail;
    }
  };
}

test("JBriscola adapter sorts the public hand in legacy CPU order", () => {
  const adapter = new JBriscolaAdapter({ randomSeed: 1 });
  const observation = {
    playerId: 1,
    isMyTurn: true,
    hand: [
      { id: "coppe-5", suit: "coppe", rank: 5 },
      { id: "denari-5", suit: "denari", rank: 5 },
      { id: "spade-1", suit: "spade", rank: 1 }
    ],
    table: [],
    visibleTrump: { id: "denari-2", suit: "denari", rank: 2 },
    trumpSuit: "denari"
  };

  const state = adapter.buildLegacyState(observation);
  assert.deepEqual(state.mano, [30, 24, 14]);
  assert.deepEqual(state.sortedHand.map((entry) => entry.card.id), ["spade-1", "denari-5", "coppe-5"]);
});

test("JBriscola adapter returns a legal BriscoLab action", async () => {
  const game = new BriscolaGame({ seed: 42, firstPlayer: 1 });
  const adapter = new JBriscolaAdapter({ randomSeed: 7 });
  const observation = game.getObservation(1);
  const action = await adapter.chooseAction(observation);

  assert.equal(action.type, "PLAY_CARD");
  assert.ok(observation.hand.some((card) => card.id === action.cardId));
  assert.equal(action.debug.algorithm, "JBriscola");
});

test("JBriscola adapter can complete 100 deterministic games without illegal moves", async () => {
  for (let seed = 1; seed <= 100; seed += 1) {
    const game = new BriscolaGame({ seed, firstPlayer: 0 });
    const bot0 = new JBriscolaAdapter({ randomSeed: seed * 2 + 1 });
    const bot1 = new JBriscolaAdapter({ randomSeed: seed * 2 + 2 });

    while (game.getPublicState().phase === "playing") {
      const playerId = game.getPublicState().turn;
      const bot = playerId === 0 ? bot0 : bot1;
      const action = await bot.chooseAction(game.getObservation(playerId));
      game.playCard(playerId, action.cardId);
    }

    const result = game.getPublicState().result;
    assert.equal(result.scores[0] + result.scores[1], 120);
  }
});
