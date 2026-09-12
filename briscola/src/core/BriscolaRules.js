// SPDX-License-Identifier: GPL-3.0-only
export const SUITS = Object.freeze(["denari", "coppe", "spade", "bastoni"]);
export const RANKS = Object.freeze([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

const CARD_POINTS = Object.freeze({
  1: 11,
  3: 10,
  10: 4,
  9: 3,
  8: 2,
  2: 0,
  4: 0,
  5: 0,
  6: 0,
  7: 0
});

// Higher value means stronger card within the same suit.
const CARD_STRENGTH = Object.freeze({
  1: 10,
  3: 9,
  10: 8,
  9: 7,
  8: 6,
  7: 5,
  6: 4,
  5: 3,
  4: 2,
  2: 1
});

export function cardId(suit, rank) {
  return `${suit}-${rank}`;
}

export function createDeck() {
  return SUITS.flatMap((suit) =>
    RANKS.map((rank) => ({
      id: cardId(suit, rank),
      suit,
      rank,
      points: CARD_POINTS[rank],
      strength: CARD_STRENGTH[rank]
    }))
  );
}

export function getCardPoints(card) {
  return CARD_POINTS[card.rank] ?? 0;
}

export function getCardStrength(card) {
  return CARD_STRENGTH[card.rank] ?? 0;
}

export function trickWinner(leadPlay, replyPlay, trumpSuit) {
  const lead = leadPlay.card;
  const reply = replyPlay.card;

  if (lead.suit === reply.suit) {
    return getCardStrength(reply) > getCardStrength(lead)
      ? replyPlay.playerId
      : leadPlay.playerId;
  }

  if (reply.suit === trumpSuit && lead.suit !== trumpSuit) {
    return replyPlay.playerId;
  }

  return leadPlay.playerId;
}

export function trickPoints(table) {
  return table.reduce((sum, play) => sum + getCardPoints(play.card), 0);
}

export function resultFromScores(scores) {
  const [a, b] = scores;
  if (a === b) return { winner: null, draw: true };
  return { winner: a > b ? 0 : 1, draw: false };
}
