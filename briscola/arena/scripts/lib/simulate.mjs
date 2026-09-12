// SPDX-License-Identifier: GPL-3.0-only
import { BriscolaGame } from "../../../src/core/BriscolaGame.js";

if (typeof globalThis.CustomEvent === "undefined") {
  globalThis.CustomEvent = class CustomEvent extends Event {
    constructor(type, options = {}) {
      super(type);
      this.detail = options.detail;
    }
  };
}

export async function playGame(seed, player0, player1) {
  player0.reset?.();
  player1.reset?.();

  const game = new BriscolaGame({ seed, firstPlayer: 0 });
  const players = [player0, player1];

  while (game.getPublicState().phase === "playing") {
    const playerId = game.getPublicState().turn;
    const observation = game.getObservation(playerId);
    const action = await players[playerId].chooseAction(observation);
    game.playCard(playerId, action.cardId);
  }

  return game.getPublicState().result;
}

export function playerRandomSeeds(seed, swapped) {
  return {
    first: seed * 4 + (swapped ? 2 : 0) + 1,
    second: seed * 4 + (swapped ? 2 : 0) + 2
  };
}

export async function playBalancedPair(seed, a, b) {
  const games = [];

  for (const swapped of [false, true]) {
    const first = swapped ? b : a;
    const second = swapped ? a : b;
    const randomSeeds = playerRandomSeeds(seed, swapped);
    const result = await playGame(
      seed,
      first.create(randomSeeds.first),
      second.create(randomSeeds.second)
    );

    games.push({ swapped, first, second, result });
  }

  return games;
}
