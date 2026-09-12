// SPDX-License-Identifier: GPL-3.0-only
import test from "node:test";
import assert from "node:assert/strict";
import { BriscolaGame } from "../src/core/BriscolaGame.js";
import { CuperativaAdapter } from "../src/players/cuperativa/CuperativaAdapter.js";
import { QBriscolaAdapter } from "../src/players/qbriscola/QBriscolaAdapter.js";
import { SmBriscolaEmpirico1Adapter } from "../src/players/smbriscola/SmBriscolaEmpirico1Adapter.js";
import { SmBriscolaEmpirico2Adapter } from "../src/players/smbriscola/SmBriscolaEmpirico2Adapter.js";
import { JBriscolaAdapter } from "../src/players/jbriscola/JBriscolaAdapter.js";
import { PryscolaAdapter } from "../src/players/pryscola/PryscolaAdapter.js";
import { BriscolaBotAdapter } from "../src/players/briscolabot/BriscolaBotAdapter.js";
import { BriscolaBotDeterministicRuntime } from "../src/players/briscolabot/BriscolaBotDeterministicRuntime.js";
import { RandomAdapter } from "../src/players/random/RandomAdapter.js";
import { PiGAdapter, PiHAdapter, PiCAdapter } from "../src/players/giacomelli/GiacomelliAdapter.js";
import {
  CardFrameworkCpu0Adapter,
  CardFrameworkCpu1Adapter,
  CardFrameworkCpu2Adapter
} from "../src/players/cardframework/CardFrameworkAdapter.js";

if (typeof globalThis.CustomEvent === "undefined") {
  globalThis.CustomEvent = class CustomEvent extends Event {
    constructor(type, options = {}) {
      super(type);
      this.detail = options.detail;
    }
  };
}

async function playBots(seed, bot0, bot1) {
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

const factories = [
  ["QBriscola", () => new QBriscolaAdapter()],
  ["Cuperativa", () => new CuperativaAdapter()],
  ["smBrisCola Empirico1", () => new SmBriscolaEmpirico1Adapter()],
  ["smBrisCola Empirico2", () => new SmBriscolaEmpirico2Adapter()],
  ["JBriscola", () => new JBriscolaAdapter({ randomSeed: 12345 })],
  ["Pryscola", () => new PryscolaAdapter()],
  ["Random", () => new RandomAdapter({ randomSeed: 24680 })],
  ["πG Greedy", () => new PiGAdapter()],
  ["πH Hoarder", () => new PiHAdapter()],
  ["πC Counter", () => new PiCAdapter()],
  ["CardFramework Cpu0", () => new CardFrameworkCpu0Adapter({ randomSeed: 0x43463030 })],
  ["CardFramework Cpu1", () => new CardFrameworkCpu1Adapter({ randomSeed: 0x43463031 })],
  ["CardFramework Cpu2", () => new CardFrameworkCpu2Adapter({ randomSeed: 0x43463032 })],
  [
    "BriscolaBot v3",
    () => new BriscolaBotAdapter({
      randomSeed: 67890,
      runtime: new BriscolaBotDeterministicRuntime()
    })
  ]
];

test("all exposed algorithms can complete matches against every other algorithm", async () => {
  for (let i = 0; i < factories.length; i += 1) {
    for (let j = i + 1; j < factories.length; j += 1) {
      const [, makeA] = factories[i];
      const [, makeB] = factories[j];
      for (let seed = 1; seed <= 10; seed += 1) {
        const a = await playBots(seed, makeA(), makeB());
        assert.equal(a.scores[0] + a.scores[1], 120);

        const b = await playBots(seed, makeB(), makeA());
        assert.equal(b.scores[0] + b.scores[1], 120);
      }
    }
  }
});
