// SPDX-License-Identifier: GPL-3.0-only
import { QBriscolaAI } from "./QBriscolaAI.js";
import { qCarta } from "./QBriscolaCard.js";

/**
 * Adapter between BriscoLab's public PlayerObservation and the faithful
 * QBriscola port. This is intentionally the only place that knows both data
 * models.
 */
export class QBriscolaAdapter {
  constructor({ ai = new QBriscolaAI(), name = "QBriscola" } = {}) {
    this.ai = ai;
    this.name = name;
    this.id = "qbriscola";
    this.originalTrump = null;
  }

  reset() {
    this.originalTrump = null;
  }

  /**
   * Generic player API used by the web layer.
   * Returns a BriscoLab action, never a QBriscola hand index.
   */
  async chooseAction(observation) {
    if (!observation?.isMyTurn) {
      throw new Error("QBriscolaAdapter received an observation outside its turn");
    }

    const legacyState = this.buildLegacyState(observation);
    const chosenIndex = this.ai.scegliCarta(legacyState);
    const chosenCard = observation.hand[chosenIndex];

    if (!chosenCard) {
      throw new Error(`QBriscola returned invalid hand index ${chosenIndex}`);
    }

    return {
      type: "PLAY_CARD",
      cardId: chosenCard.id,
      debug: {
        algorithm: "QBriscola",
        chosenIndex
      }
    };
  }

  /**
   * Public for tests/debugging: translates only information present in the
   * observation. No opponent hand or stock card is ever available here.
   */
  buildLegacyState(observation) {
    if (!observation) throw new TypeError("observation is required");

    if (observation.visibleTrump) {
      this.originalTrump = this.#toQCard(observation.visibleTrump);
    }

    // QBriscola keeps the originally exposed trump card around as `br`, even
    // after it has been drawn. If an adapter is attached in the middle of a
    // game and missed it, only its suit is relevant once stockCount is zero;
    // rank 2 is therefore a neutral fallback (0 points, lowest priority).
    const legacyTrump = this.originalTrump ?? qCarta(observation.trumpSuit, 2);

    const legacyPlayedCards = observation.playedCards.map((card) => this.#toQCard(card));
    const legacyPlayedTrumps = observation.playedCards
      .filter((card) => card.suit === observation.trumpSuit)
      .map((card) => this.#toQCard(card));

    const opponentPlay = observation.table.find(
      (play) => play.playerId !== observation.playerId
    );

    return {
      mano: observation.hand.map((card) => this.#toQCard(card)),
      // Legacy field names are part of the faithful QBriscola state contract.
      briscola: legacyTrump,
      uscite: legacyPlayedCards,
      brUscite: legacyPlayedTrumps,
      cartaAvversario: opponentPlay ? this.#toQCard(opponentPlay.card) : null,
      // In both engines this counts the stock excluding the exposed trump.
      mazzoMax: observation.stockCount
    };
  }

  #toQCard(card) {
    return qCarta(card.suit, card.rank);
  }
}
