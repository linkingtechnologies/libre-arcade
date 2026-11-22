// SPDX-License-Identifier: GPL-3.0-only
// Derived from JBriscola 0.3.1 (GPL-3.0); see THIRD_PARTY_NOTICES.md.
/**
 * Card compatibility helpers for the original JBriscola Java model.
 *
 * JBriscola encodes cards as integers 0..39:
 *   0..9   = bastoni
 *   10..19 = coppe
 *   20..29 = denari
 *   30..39 = spade
 * and the value inside a suit is rank - 1.
 */

const SUIT_TO_INDEX = Object.freeze({
  bastoni: 0,
  coppe: 1,
  denari: 2,
  spade: 3
});

const INDEX_TO_SUIT = Object.freeze(["bastoni", "coppe", "denari", "spade"]);

export const JBRISCOLA_COMPARISON = Object.freeze({
  EQUAL: 0,
  FIRST_GREATER: 1,
  SECOND_GREATER: 2
});

export function toJBriscolaNumber(card) {
  const suitIndex = SUIT_TO_INDEX[card?.suit];
  if (suitIndex === undefined || !Number.isInteger(card?.rank) || card.rank < 1 || card.rank > 10) {
    throw new TypeError(`Invalid BriscoLab card: ${JSON.stringify(card)}`);
  }
  return suitIndex * 10 + (card.rank - 1);
}

export function fromJBriscolaNumber(number) {
  if (!Number.isInteger(number) || number < 0 || number > 39) {
    throw new RangeError(`Invalid JBriscola card number: ${number}`);
  }
  return {
    suit: INDEX_TO_SUIT[Math.floor(number / 10)],
    rank: (number % 10) + 1
  };
}

export function getJBriscolaSuit(number) {
  return Math.floor(number / 10);
}

export function getJBriscolaValue(number) {
  return number % 10;
}

export function getJBriscolaPoints(number) {
  switch (getJBriscolaValue(number)) {
    case 0:
      return 11;
    case 2:
      return 10;
    case 9:
      return 4;
    case 8:
      return 3;
    case 7:
      return 2;
    default:
      return 0;
  }
}

/** Faithful port of CartaHelperBriscola.Compara. */
export function compareJBriscolaCards(first, second, trumpNumber) {
  const firstPoints = getJBriscolaPoints(first);
  const secondPoints = getJBriscolaPoints(second);
  const firstValue = getJBriscolaValue(first);
  const secondValue = getJBriscolaValue(second);
  const trumpSuit = getJBriscolaSuit(trumpNumber);
  const firstSuit = getJBriscolaSuit(first);
  const secondSuit = getJBriscolaSuit(second);

  if (firstPoints < secondPoints) return JBRISCOLA_COMPARISON.SECOND_GREATER;
  if (firstPoints > secondPoints) return JBRISCOLA_COMPARISON.FIRST_GREATER;

  if (
    firstValue < secondValue ||
    (secondSuit === trumpSuit && firstSuit !== trumpSuit)
  ) {
    return JBRISCOLA_COMPARISON.SECOND_GREATER;
  }

  if (
    firstValue > secondValue ||
    (firstSuit === trumpSuit && secondSuit !== trumpSuit)
  ) {
    return JBRISCOLA_COMPARISON.FIRST_GREATER;
  }

  return JBRISCOLA_COMPARISON.EQUAL;
}

/**
 * Recreates the order used by Giocatore when the CPU has ordinaMano=true.
 * Stronger cards are placed before weaker cards according to the legacy
 * Carta.Compara function.
 */
export function sortJBriscolaHand(cards, trumpNumber) {
  return cards
    .map((item, drawOrder) => ({ item, drawOrder }))
    .sort((left, right) => {
      const result = compareJBriscolaCards(
        left.item.number,
        right.item.number,
        trumpNumber
      );
      if (result === JBRISCOLA_COMPARISON.FIRST_GREATER) return -1;
      if (result === JBRISCOLA_COMPARISON.SECOND_GREATER) return 1;

      // Giocatore.AddCarta inserts a newly drawn card before an existing card
      // when Carta.Compara reports equality. BriscoLab keeps surviving cards
      // in draw order, so reversing ties reproduces the legacy insertion order.
      return right.drawOrder - left.drawOrder;
    })
    .map(({ item }) => item);
}
