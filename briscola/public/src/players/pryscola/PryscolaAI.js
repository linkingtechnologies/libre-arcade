// SPDX-License-Identifier: GPL-3.0-only
// Derived from Pryscola (GPL-3.0-or-later); see THIRD_PARTY_NOTICES.md.
import { pryscolaBeats } from "./PryscolaCard.js";

/**
 * Faithful JavaScript port of Pryscola's Player.aiplaycard()/getchoice().
 *
 * The original algorithm is intentionally simple and its quirks are retained:
 * - leading with more than one card always selects hand index 0 without sorting;
 * - when replying, the hand is stably sorted by card points only;
 * - same-suit overtaking compares points rather than full Briscola strength;
 * - a trump is spent only when the current winning card has points.
 */
export class PryscolaAI {
  handwinner(cardlist, briscola, first, second) {
    if (cardlist.length === 1) return first;

    if (pryscolaBeats(cardlist[first], cardlist[second], briscola)) {
      if (second + 1 === cardlist.length) return first;
      return this.handwinner(cardlist, briscola, first, second + 1);
    }

    if (second + 1 === cardlist.length) return second;
    return this.handwinner(cardlist, briscola, second, second + 1);
  }

  /** Faithful equivalent of Player.aiplaycard(). Mutates hand ordering. */
  aiplaycard(hand, cardsplayed, briscola) {
    // Python's list.sort() is stable. Sorting by points reproduces Card.__cmp__.
    hand.sort((left, right) => left.points - right.points);

    const winnercard = cardsplayed[
      this.handwinner(cardsplayed, briscola, 0, 1)
    ];

    for (let idx = 0; idx < hand.length; idx += 1) {
      const card = hand[idx];
      if (
        (winnercard.seed === card.seed && winnercard.points < card.points) ||
        (
          winnercard.points > 0 &&
          winnercard.seed !== briscola.seed &&
          card.seed === briscola.seed
        )
      ) {
        return idx;
      }
    }

    return 0;
  }

  /** Faithful equivalent of Player.getchoice() for a non-human player. */
  getchoice({ hand, cardsplayed = null, briscola = null } = {}) {
    if (!Array.isArray(hand) || hand.length < 1 || hand.length > 3) {
      throw new TypeError("hand must contain 1 to 3 Pryscola cards");
    }

    if (hand.length === 1) return 0;

    // The original non-human player returns index 0 when it leads or when no
    // trump card is available to the decision method. No sorting happens here.
    if (!cardsplayed?.length || !briscola) return 0;

    return this.aiplaycard(hand, cardsplayed, briscola);
  }

  chooseCard(state) {
    return this.getchoice(state);
  }
}
