// SPDX-License-Identifier: GPL-3.0-only
import test from "node:test";
import assert from "node:assert/strict";
import { BriscolaGame } from "../src/core/BriscolaGame.js";
import { QBriscolaAdapter } from "../src/players/qbriscola/QBriscolaAdapter.js";

if (typeof globalThis.CustomEvent === "undefined") {
  globalThis.CustomEvent = class CustomEvent extends Event {
    constructor(type, options = {}) {
      super(type);
      this.detail = options.detail;
    }
  };
}

test("adapter maps a public observation to QBriscola state without hidden cards", () => {
  const game = new BriscolaGame({ seed: 20260810, firstPlayer: 0 });
  const adapter = new QBriscolaAdapter();

  // Let human/player 0 lead so player 1 receives an opponent card on table.
  const lead = game.legalActions(0)[0];
  game.playCard(0, lead.cardId);

  const observation = game.getObservation(1);
  const legacy = adapter.buildLegacyState(observation);

  assert.equal(legacy.mano.length, 3);
  assert.equal(legacy.mazzoMax, observation.stockCount);
  assert.equal(legacy.briscola.seme, observation.trumpSuit);
  assert.equal(legacy.cartaAvversario.numero, observation.table[0].card.rank);
  assert.equal(legacy.uscite.length, observation.playedCards.length);
  assert.equal(legacy.brUscite.length, 0);
  assert.equal("opponentHand" in legacy, false);
});

test("adapter returns a legal PLAY_CARD action", async () => {
  const game = new BriscolaGame({ seed: 777, firstPlayer: 1 });
  const adapter = new QBriscolaAdapter();
  const observation = game.getObservation(1);

  const action = await adapter.chooseAction(observation);
  assert.equal(action.type, "PLAY_CARD");
  assert.ok(game.legalActions(1).some((item) => item.cardId === action.cardId));
});

test("adapter remembers the exposed trump after it is drawn", async () => {
  const game = new BriscolaGame({ seed: 321, firstPlayer: 0 });
  const adapter = new QBriscolaAdapter();
  const originalTrumpId = game.getPublicState().visibleTrump.id;

  // Make sure the adapter sees the public trump while it is still exposed.
  adapter.buildLegacyState(game.getObservation(0));

  while (game.getPublicState().phase === "playing" && game.getPublicState().visibleTrump) {
    const state = game.getPublicState();
    game.playCard(state.turn, game.legalActions(state.turn)[0].cardId);
  }

  const state = game.getPublicState();
  assert.equal(state.visibleTrump, null);

  // Reconstruct whichever player's observation is available after the draw.
  const obs = game.getObservation(state.turn);
  const legacy = adapter.buildLegacyState(obs);
  const [suit, rank] = originalTrumpId.split("-");
  assert.equal(legacy.briscola.seme, suit);
  assert.equal(legacy.briscola.numero, Number(rank));
});

test("QBriscola adapter can complete many deterministic games without illegal moves", async () => {
  for (let seed = 1; seed <= 100; seed += 1) {
    const game = new BriscolaGame({ seed, firstPlayer: seed % 2 });
    const bot = new QBriscolaAdapter();

    while (game.getPublicState().phase === "playing") {
      const state = game.getPublicState();
      if (state.turn === 0) {
        const action = game.legalActions(0)[0];
        game.playCard(0, action.cardId);
      } else {
        const action = await bot.chooseAction(game.getObservation(1));
        assert.ok(game.legalActions(1).some((legal) => legal.cardId === action.cardId));
        game.playCard(1, action.cardId);
      }
    }

    const end = game.getPublicState();
    assert.equal(end.scores[0] + end.scores[1], 120);
  }
});
