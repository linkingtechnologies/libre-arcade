// SPDX-License-Identifier: GPL-3.0-only
import test from "node:test";
import assert from "node:assert/strict";
import { PoianaAdapter, actionIndexFromPoianaOutputs, clampPoianaActionIndex } from "../src/players/poiana/PoianaAdapter.js";
import { getPoianaModel } from "../src/players/poiana/PoianaModels.js";

const card = (suit, rank, points) => ({ id: `${suit}-${rank}`, suit, rank, points, strength: 1 });
const trump = card("denari", 1, 11);

function observation(hand) {
  return {
    playerId: 1,
    phase: "playing",
    isMyTurn: true,
    isLeading: false,
    hand,
    opponentHandCount: hand.length,
    scores: { mine: 0, opponent: 0 },
    table: [{ playerId: 0, card: card("coppe", 2, 0) }],
    playedCards: [],
    stockCount: 33,
    visibleTrump: trump,
    trumpSuit: "denari",
    trickNumber: 1
  };
}

test("PoIAna extracts scalar ONNX action outputs", () => {
  assert.equal(actionIndexFromPoianaOutputs({ output: { data: BigInt64Array.of(2n), type: "int64", dims: [1] } }), 2);
});

test("PoIAna faithfully decrements unavailable action slots", () => {
  assert.equal(clampPoianaActionIndex(2, 3), 2);
  assert.equal(clampPoianaActionIndex(2, 2), 1);
  assert.equal(clampPoianaActionIndex(2, 1), 0);
  assert.equal(clampPoianaActionIndex(1, 1), 0);
});

test("PoIAna adapter returns a legal BriscoLab card action", async () => {
  const hand = [card("spade", 3, 10), card("bastoni", 4, 0)];
  const runtime = {
    reset() {},
    async infer(input) {
      assert.equal(input.length, 519);
      return { selected: { type: "int64", dims: [1], data: Int32Array.of(2) } };
    }
  };
  const model = getPoianaModel("blooming-bird");
  const player = new PoianaAdapter({ model, runtime });
  const action = await player.chooseAction(observation(hand));
  assert.equal(action.type, "PLAY_CARD");
  assert.equal(action.cardId, hand[1].id); // 2 -> 1, exactly like upstream Hand.TakeCard
  assert.equal(action.debug.model, "blooming-bird");
});
