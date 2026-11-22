// SPDX-License-Identifier: GPL-3.0-only
import { PryscolaAI } from "./PryscolaAI.js";
import { toPryscolaCard } from "./PryscolaCard.js";

/** Adapter between BriscoLab observations and the faithful Pryscola AI. */
export class PryscolaAdapter {
  constructor({ ai = new PryscolaAI(), name = "Pryscola" } = {}) {
    this.id = "pryscola";
    this.name = name;
    this.ai = ai;
    this.reset();
  }

  reset() {
    this.legacyHandOrder = [];
    this.originalTrump = null;
  }

  async chooseAction(observation) {
    if (!observation?.isMyTurn) {
      throw new Error("PryscolaAdapter received an observation outside its turn");
    }

    const legacyState = this.buildLegacyState(observation);
    const chosenIndex = this.ai.chooseCard(legacyState);
    const chosenLegacyCard = legacyState.hand[chosenIndex];
    const chosenCard = legacyState.engineCardByLegacyCard.get(chosenLegacyCard);

    if (!chosenCard) {
      throw new Error(`Pryscola returned invalid hand index ${chosenIndex}`);
    }

    // aiplaycard() sorts the legacy hand in place. Keep that ordering because
    // the original Player.hand remains sorted after a reply and future draws
    // are appended to it.
    this.legacyHandOrder = legacyState.hand.map(
      (legacyCard) => legacyState.engineCardByLegacyCard.get(legacyCard).id
    );

    return {
      type: "PLAY_CARD",
      cardId: chosenCard.id,
      debug: {
        algorithm: "Pryscola",
        chosenIndex
      }
    };
  }

  buildLegacyState(observation) {
    if (!observation) throw new TypeError("observation is required");

    if (observation.visibleTrump) {
      this.originalTrump = toPryscolaCard(observation.visibleTrump);
    }

    // Pryscola keeps Deck.briscola for the whole game. If an adapter is
    // attached after the exposed card was drawn, only its seed matters to the
    // AI, so rank 2 is a neutral zero-point representative.
    const legacyTrump = this.originalTrump ?? toPryscolaCard({
      suit: observation.trumpSuit,
      rank: 2
    });

    this.syncLegacyHand(observation.hand);

    const engineCardById = new Map(observation.hand.map((card) => [card.id, card]));
    const engineCards = this.legacyHandOrder
      .map((id) => engineCardById.get(id))
      .filter(Boolean);
    const legacyHand = engineCards.map(toPryscolaCard);
    const engineCardByLegacyCard = new Map(
      legacyHand.map((legacyCard, index) => [legacyCard, engineCards[index]])
    );

    const opponentCards = observation.table
      .filter((play) => play.playerId !== observation.playerId)
      .map((play) => toPryscolaCard(play.card));

    return {
      hand: legacyHand,
      cardsplayed: opponentCards,
      briscola: legacyTrump,
      engineCardByLegacyCard
    };
  }

  syncLegacyHand(currentHand) {
    const currentIds = new Set(currentHand.map((card) => card.id));
    const retained = this.legacyHandOrder.filter((id) => currentIds.has(id));
    const retainedIds = new Set(retained);

    // New cards are appended in engine hand order, matching the original game.
    for (const card of currentHand) {
      if (!retainedIds.has(card.id)) retained.push(card.id);
    }

    this.legacyHandOrder = retained;
  }
}
