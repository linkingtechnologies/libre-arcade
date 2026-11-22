// SPDX-License-Identifier: GPL-3.0-only
import { SeededRandom } from "../../core/SeededRandom.js";

/**
 * Uniform random baseline.
 *
 * This is a BriscoLab-native control player rather than a historical port.
 * It intentionally uses no information beyond the cards currently in hand.
 */
export class RandomAdapter {
  constructor({ name = "Random", randomSeed = 0x52414e44 } = {}) {
    this.id = "random";
    this.name = name;
    this.initialRandomSeed = Number(randomSeed) >>> 0;
    this.reset();
  }

  reset() {
    this.rng = new SeededRandom(this.initialRandomSeed);
  }

  async chooseAction(observation) {
    if (!observation?.isMyTurn) {
      throw new Error("RandomAdapter received an observation outside its turn");
    }
    if (!Array.isArray(observation.hand) || observation.hand.length === 0) {
      throw new Error("RandomAdapter received an empty hand");
    }

    const chosenIndex = this.rng.int(observation.hand.length);
    const chosenCard = observation.hand[chosenIndex];

    return {
      type: "PLAY_CARD",
      cardId: chosenCard.id,
      debug: {
        algorithm: "Uniform random baseline",
        chosenIndex
      }
    };
  }
}
