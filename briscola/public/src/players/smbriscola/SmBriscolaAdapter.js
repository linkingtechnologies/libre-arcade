// SPDX-License-Identifier: GPL-3.0-only
import { SmBriscolaAI } from "./SmBriscolaAI.js";
import { toSmCarta } from "./SmBriscolaCard.js";

/**
 * Adapter between BriscoLab's public observation and the faithful
 * smBrisCola 2005 heuristic port.
 */
export class SmBriscolaAdapter {
  constructor({ method = "Empirico1", ai = null, id = null, name = null } = {}) {
    this.method = method;
    this.ai = ai ?? new SmBriscolaAI({ method });
    this.id = id ?? `smbriscola-${method.toLowerCase()}`;
    this.name = name ?? `smBrisCola ${method}`;
    this.originalTrump = null;
  }

  reset() {
    this.originalTrump = null;
  }

  async chooseAction(observation) {
    if (!observation?.isMyTurn) {
      throw new Error("SmBriscolaAdapter received an observation outside its turn");
    }

    const legacyState = this.buildLegacyState(observation);
    const chosenIndex = this.ai.scegliCarta(legacyState);
    const chosenCard = observation.hand[chosenIndex];

    if (!chosenCard) {
      throw new Error(`smBrisCola returned invalid hand index ${chosenIndex}`);
    }

    return {
      type: "PLAY_CARD",
      cardId: chosenCard.id,
      debug: {
        algorithm: "smBrisCola",
        method: this.method,
        chosenIndex
      }
    };
  }

  buildLegacyState(observation) {
    if (!observation) throw new TypeError("observation is required");

    if (observation.visibleTrump) {
      this.originalTrump = toSmCarta(observation.visibleTrump);
    }

    // The original table object always retains the initially exposed trump.
    // Its exact rank matters to Empirico2, so the adapter remembers it from
    // the public observation instead of reconstructing hidden information.
    const legacyTrump = this.originalTrump ?? toSmCarta({
      suit: observation.trumpSuit,
      rank: 2
    });

    const opponentLead = observation.table.find(
      (play) => play.playerId !== observation.playerId
    );

    return {
      // Legacy field names intentionally mirror the original Python player.
      carte: observation.hand.map(toSmCarta),
      briscola: legacyTrump,
      cartaGiocata: opponentLead ? toSmCarta(opponentLead.card) : null
    };
  }
}
