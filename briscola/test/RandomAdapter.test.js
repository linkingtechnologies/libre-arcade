// SPDX-License-Identifier: GPL-3.0-only
import test from "node:test";
import assert from "node:assert/strict";
import { RandomAdapter } from "../src/players/random/RandomAdapter.js";

const observation = {
  isMyTurn: true,
  hand: [
    { id: "denari-1", suit: "denari", rank: 1 },
    { id: "coppe-3", suit: "coppe", rank: 3 },
    { id: "spade-7", suit: "spade", rank: 7 }
  ]
};

test("RandomAdapter is deterministic for a fixed player seed", async () => {
  const a = new RandomAdapter({ randomSeed: 12345 });
  const b = new RandomAdapter({ randomSeed: 12345 });

  const sequenceA = [];
  const sequenceB = [];
  for (let i = 0; i < 20; i += 1) {
    sequenceA.push((await a.chooseAction(observation)).cardId);
    sequenceB.push((await b.chooseAction(observation)).cardId);
  }

  assert.deepEqual(sequenceA, sequenceB);
});

test("RandomAdapter always selects a card from the visible hand", async () => {
  const player = new RandomAdapter({ randomSeed: 7 });
  const legal = new Set(observation.hand.map((card) => card.id));

  for (let i = 0; i < 100; i += 1) {
    const action = await player.chooseAction(observation);
    assert.equal(action.type, "PLAY_CARD");
    assert.ok(legal.has(action.cardId));
  }
});

test("RandomAdapter rejects calls outside its turn", async () => {
  const player = new RandomAdapter();
  await assert.rejects(
    () => player.chooseAction({ ...observation, isMyTurn: false }),
    /outside its turn/
  );
});
