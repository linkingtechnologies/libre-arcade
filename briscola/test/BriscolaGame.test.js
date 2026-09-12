// SPDX-License-Identifier: GPL-3.0-only
import test from "node:test";
import assert from "node:assert/strict";
import { BriscolaGame } from "../src/core/BriscolaGame.js";

// Node does not expose CustomEvent in every supported release.
if (typeof globalThis.CustomEvent === "undefined") {
  globalThis.CustomEvent = class CustomEvent extends Event {
    constructor(type, options = {}) {
      super(type);
      this.detail = options.detail;
    }
  };
}

function playFirstLegalUntilEnd(game) {
  while (game.getPublicState().phase === "playing") {
    const state = game.getPublicState();
    const action = game.legalActions(state.turn)[0];
    game.playCard(state.turn, action.cardId);
  }
}

test("same seed produces same initial deal", () => {
  const a = new BriscolaGame({ seed: 12345 });
  const b = new BriscolaGame({ seed: 12345 });
  assert.deepEqual(a.getPublicState(), b.getPublicState());
});

test("observation never exposes opponent cards", () => {
  const game = new BriscolaGame({ seed: 7 });
  const observation = game.getObservation(0);
  assert.equal("hands" in observation, false);
  assert.equal("opponentHand" in observation, false);
  assert.equal(observation.opponentHandCount, 3);
});

test("a full deterministic game consumes 40 cards and awards 120 points", () => {
  const game = new BriscolaGame({ seed: 99 });
  playFirstLegalUntilEnd(game);
  const state = game.getPublicState();
  assert.equal(state.phase, "finished");
  assert.equal(state.playedCards.length, 40);
  assert.equal(state.scores[0] + state.scores[1], 120);
  assert.equal(state.stockCount, 0);
  assert.equal(state.visibleTrump, null);
  assert.deepEqual(state.handCounts, [0, 0]);
});
