// SPDX-License-Identifier: GPL-3.0-only
import { JBriscolaAI } from "./JBriscolaAI.js";
import {
  sortJBriscolaHand,
  toJBriscolaNumber
} from "./JBriscolaCard.js";
import { JavaRandom } from "./JavaRandom.js";

/** Adapter between BriscoLab observations and the faithful JBriscola CPU. */
export class JBriscolaAdapter {
  constructor({ name = "JBriscola", randomSeed = 0x4a425249 } = {}) {
    this.id = "jbriscola";
    this.name = name;
    this.randomSeed = randomSeed;
    this.reset();
  }

  reset() {
    this.ai = null;
    this.trumpNumber = null;
    this.random = new JavaRandom(this.randomSeed);
  }

  async chooseAction(observation) {
    if (!observation?.isMyTurn) {
      throw new Error("JBriscolaAdapter received an observation outside its turn");
    }

    this.ensureAI(observation);
    const legacyState = this.buildLegacyState(observation);
    const chosenIndex = this.ai.scegliCarta(legacyState);
    const chosenLegacyCard = legacyState.sortedHand[chosenIndex];

    if (!chosenLegacyCard) {
      throw new Error(`JBriscola returned invalid hand index ${chosenIndex}`);
    }

    return {
      type: "PLAY_CARD",
      cardId: chosenLegacyCard.card.id,
      debug: {
        algorithm: "JBriscola",
        chosenIndex,
        legacyCardNumber: chosenLegacyCard.number
      }
    };
  }

  ensureAI(observation) {
    if (this.ai) return;

    // The CPU only needs the trump suit. JBriscola receives the numeric ID of
    // the exposed trump card, so rank 1 is a harmless canonical representative
    // when the exact exposed card is no longer visible in the public state.
    const trumpCard = observation.visibleTrump ?? {
      suit: observation.trumpSuit,
      rank: 1
    };
    this.trumpNumber = toJBriscolaNumber(trumpCard);
    this.ai = new JBriscolaAI({ briscola: this.trumpNumber, random: this.random });
  }

  buildLegacyState(observation) {
    if (!observation) throw new TypeError("observation is required");
    this.ensureAI(observation);

    const sortableHand = observation.hand.map((card) => ({
      card,
      number: toJBriscolaNumber(card)
    }));
    const sortedHand = sortJBriscolaHand(sortableHand, this.trumpNumber);

    const opponentLead = observation.table.find(
      (play) => play.playerId !== observation.playerId
    );

    return {
      // Legacy field names mirror the original JBriscola CPU contract.
      mano: sortedHand.map((entry) => entry.number),
      cartaAvversario: opponentLead ? toJBriscolaNumber(opponentLead.card) : null,
      sortedHand
    };
  }
}
