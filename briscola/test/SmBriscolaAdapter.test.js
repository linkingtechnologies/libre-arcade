// SPDX-License-Identifier: GPL-3.0-only
import test from "node:test";
import assert from "node:assert/strict";
import { BriscolaGame } from "../src/core/BriscolaGame.js";
import { SmBriscolaEmpirico1Adapter } from "../src/players/smbriscola/SmBriscolaEmpirico1Adapter.js";
import { SmBriscolaEmpirico2Adapter } from "../src/players/smbriscola/SmBriscolaEmpirico2Adapter.js";

if (typeof globalThis.CustomEvent === "undefined") {
  globalThis.CustomEvent = class CustomEvent extends Event {
    constructor(type, options = {}) {
      super(type);
      this.detail = options.detail;
    }
  };
}

async function play(seed, bot0, bot1) {
  bot0.reset?.();
  bot1.reset?.();
  const game = new BriscolaGame({ seed, firstPlayer: 0 });
  const bots = [bot0, bot1];
  while (game.getPublicState().phase === "playing") {
    const playerId = game.getPublicState().turn;
    const action = await bots[playerId].chooseAction(game.getObservation(playerId));
    assert.ok(game.legalActions(playerId).some((legal) => legal.cardId === action.cardId));
    game.playCard(playerId, action.cardId);
  }
  return game.getPublicState();
}

test("smBrisCola adapters have distinct stable player identities", () => {
  const e1 = new SmBriscolaEmpirico1Adapter();
  const e2 = new SmBriscolaEmpirico2Adapter();
  assert.equal(e1.id, "smbriscola-empirico1");
  assert.equal(e2.id, "smbriscola-empirico2");
  assert.notEqual(e1.id, e2.id);
});

test("Empirico1 and Empirico2 can complete matches against each other in both seats", async () => {
  for (let seed = 1; seed <= 50; seed += 1) {
    const a = await play(seed, new SmBriscolaEmpirico1Adapter(), new SmBriscolaEmpirico2Adapter());
    assert.equal(a.scores[0] + a.scores[1], 120);

    const b = await play(seed, new SmBriscolaEmpirico2Adapter(), new SmBriscolaEmpirico1Adapter());
    assert.equal(b.scores[0] + b.scores[1], 120);
  }
});
