// SPDX-License-Identifier: GPL-3.0-only
import { CuperativaAI } from "./CuperativaAI.js";
import { toCuperativaLabel } from "./CuperativaCard.js";

/**
 * Adapter between BriscoLab's public observation and the faithful
 * CuperativaSoloRuby Briscola "master" port.
 */
export class CuperativaAdapter {
  constructor({ ai = new CuperativaAI(), name = "Cuperativa" } = {}) {
    this.ai = ai;
    this.name = name;
    this.id = "cuperativa";
    this.originalTrump = null;
  }

  reset() {
    this.originalTrump = null;
  }

  async chooseAction(observation) {
    if (!observation?.isMyTurn) {
      throw new Error("CuperativaAdapter received an observation outside its turn");
    }

    const legacyState = this.buildLegacyState(observation);
    const chosenLabel = this.ai.scegliCarta(legacyState);
    const chosenCard = observation.hand.find(
      (card) => toCuperativaLabel(card) === chosenLabel
    );

    if (!chosenCard) {
      throw new Error(`Cuperativa returned a card not present in hand: ${chosenLabel}`);
    }

    return {
      type: "PLAY_CARD",
      cardId: chosenCard.id,
      debug: {
        algorithm: "Cuperativa",
        rule: this.ai.lastRule,
        chosenLabel,
        weights: this.ai.lastWeights
      }
    };
  }

  buildLegacyState(observation) {
    if (!observation) throw new TypeError("observation is required");

    if (observation.visibleTrump) {
      this.originalTrump = toCuperativaLabel(observation.visibleTrump);
    }

    // The original algorithm stores the initially exposed trump for the whole
    // game. If attached after it disappeared, its rank is no longer consulted
    // because numCardsOnDeck is already 0, so a neutral 2 of trump is enough.
    const legacyTrump = this.originalTrump ?? toCuperativaLabel({
      suit: observation.trumpSuit,
      rank: 2
    });

    const strozziOnSuite = { b: 2, d: 2, s: 2, c: 2 };
    const publicCardsSoFar = [
      ...observation.playedCards,
      ...observation.table.map((play) => play.card)
    ];

    for (const card of publicCardsSoFar) {
      if (card.rank !== 1 && card.rank !== 3) continue;
      const label = toCuperativaLabel(card);
      strozziOnSuite[label[2]] -= 1;
    }

    const opponentLead = observation.table.find(
      (play) => play.playerId !== observation.playerId
    );

    return {
      cardsOnHand: observation.hand.map(toCuperativaLabel),
      // `briscola` is an upstream Cuperativa field name preserved by the port.
      briscola: legacyTrump,
      cardPlayed: opponentLead ? [toCuperativaLabel(opponentLead.card)] : [],
      pointsMine: observation.scores.mine,
      pointsOpponent: observation.scores.opponent,
      targetPoints: 61,
      strozziOnSuite,
      // Cuperativa starts at 33 and decrements by two after each draw, so
      // after the exposed trump is distributed its internal counter is -1.
      numCardsOnDeck:
        observation.stockCount === 0 && observation.visibleTrump == null
          ? -1
          : observation.stockCount
    };
  }
}
