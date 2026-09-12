// SPDX-License-Identifier: GPL-3.0-only
import test from "node:test";
import assert from "node:assert/strict";
import { BriscolaBotAdapter, chooseFromOutputs } from "../src/players/briscolabot/BriscolaBotAdapter.js";
import { SeededRandom } from "../src/core/SeededRandom.js";

const card = (suit, rank) => ({ id: `${suit}-${rank}`, suit, rank });

function observation(overrides = {}) {
  return {
    playerId: 1,
    phase: "playing",
    isMyTurn: true,
    isLeading: true,
    hand: [card("bastoni", 1), card("coppe", 3), card("denari", 10)],
    opponentHandCount: 3,
    scores: { mine: 0, opponent: 0 },
    table: [],
    playedCards: [],
    stockCount: 33,
    visibleTrump: card("spade", 7),
    trumpSuit: "spade",
    trickNumber: 1,
    ...overrides
  };
}

test("BriscolaBot adapter remembers the originally exposed trump", () => {
  const runtime = { reset() {}, async infer() { throw new Error("unused"); } };
  const adapter = new BriscolaBotAdapter({ runtime });
  adapter.buildModelInput(observation());
  const later = adapter.buildModelInput(observation({ visibleTrump: null, stockCount: 0 }));
  assert.equal(later.observation[40 + 36], 1);
});

test("BriscolaBot adapter translates a scalar ONNX action to engine card id", async () => {
  const runtime = {
    reset() {},
    async infer() { return { action: { data: BigInt64Array.from([12n]), dims: [1] } }; }
  };
  const adapter = new BriscolaBotAdapter({ runtime });
  const action = await adapter.chooseAction(observation());
  assert.equal(action.cardId, "coppe-3");
  assert.equal(action.type, "PLAY_CARD");
});

test("BriscolaBot policy sampling never returns an illegal action", () => {
  const scores = new Float32Array(40);
  scores[5] = 1000; // illegal and intentionally dominant
  scores[10] = -2;
  scores[22] = 2;
  for (let seed = 1; seed <= 100; seed += 1) {
    assert.ok([10, 22].includes(chooseFromOutputs({ logits: { data: scores, dims: [1, 40] } }, [10, 22], new SeededRandom(seed))));
  }
});

test("BriscolaBot adapter rejects use outside its turn", async () => {
  const adapter = new BriscolaBotAdapter({ runtime: { reset() {}, async infer() { return {}; } } });
  await assert.rejects(() => adapter.chooseAction(observation({ isMyTurn: false })), /outside its turn/);
});
