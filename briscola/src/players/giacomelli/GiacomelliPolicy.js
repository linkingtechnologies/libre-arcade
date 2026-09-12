// SPDX-License-Identifier: MIT

/**
 * Faithful JavaScript port of the three deterministic policies published in:
 * Piero Giacomelli, "Beyond the Briscola Advantage" (2026).
 *
 * Upstream repository: https://github.com/pgiacome/BriscolaPaperSourceCode
 * Upstream license: MIT.
 */

function cheaper(a, b) {
  if ((a.points ?? 0) !== (b.points ?? 0)) return (a.points ?? 0) - (b.points ?? 0);
  return (a.strength ?? 0) - (b.strength ?? 0);
}

function cheapest(cards) {
  if (!cards.length) return null;
  return [...cards].sort(cheaper)[0];
}

function cheapestNonTrump(hand, trumpSuit) {
  return cheapest(hand.filter((card) => card.suit !== trumpSuit));
}

function beatsLead(card, lead, trumpSuit) {
  if (card.suit === lead.suit) return (card.strength ?? 0) > (lead.strength ?? 0);
  if (card.suit === trumpSuit && lead.suit !== trumpSuit) return true;
  return false;
}

function inSuitWinners(hand, lead) {
  return hand.filter(
    (card) => card.suit === lead.suit && (card.strength ?? 0) > (lead.strength ?? 0)
  );
}

function overtrumpingTrumps(hand, lead, trumpSuit) {
  return hand.filter(
    (card) => card.suit === trumpSuit && beatsLead(card, lead, trumpSuit)
  );
}

function greedyLead(hand, trumpSuit) {
  // Published implementation: lexicographic sort on
  // (isTrump, points, strength), therefore non-trumps are preferred.
  return [...hand].sort((a, b) => {
    const aTrump = a.suit === trumpSuit ? 1 : 0;
    const bTrump = b.suit === trumpSuit ? 1 : 0;
    if (aTrump !== bTrump) return aTrump - bTrump;
    return cheaper(a, b);
  })[0];
}

function hoarderLead(hand, trumpSuit) {
  return cheapestNonTrump(hand, trumpSuit) ?? cheapest(hand);
}

function hoarderFollow(hand, lead, trumpSuit, threshold = 10) {
  const suitWinner = cheapest(inSuitWinners(hand, lead));
  if (suitWinner) return suitWinner;

  const trumpWinner = cheapest(overtrumpingTrumps(hand, lead, trumpSuit));
  if (trumpWinner && (lead.points ?? 0) >= threshold) return trumpWinner;

  return cheapestNonTrump(hand, trumpSuit) ?? cheapest(hand);
}

export class GiacomelliPolicy {
  constructor({ policy = "G" } = {}) {
    const normalized = String(policy).toUpperCase();
    if (!["G", "H", "C"].includes(normalized)) {
      throw new Error(`Unknown Giacomelli policy '${policy}'`);
    }
    this.policy = normalized;
  }

  chooseCard({ hand, lead = null, trumpSuit, memory = [] }) {
    if (!Array.isArray(hand) || hand.length === 0) {
      throw new Error("GiacomelliPolicy received an empty hand");
    }

    if (!lead) {
      if (this.policy === "G") return greedyLead(hand, trumpSuit);
      if (this.policy === "H") return hoarderLead(hand, trumpSuit);

      // πC carico trap. Among non-trump Aces/Threes, test Ace (11) before
      // Three (10); ties preserve hand order, matching stable sort semantics.
      const knownIds = new Set(memory.map((card) => card.id));
      const traps = hand
        .map((card, index) => ({ card, index }))
        .filter(({ card }) => card.suit !== trumpSuit && (card.rank === 1 || card.rank === 3))
        .filter(({ card }) => {
          const siblingRank = card.rank === 1 ? 3 : 1;
          return knownIds.has(`${card.suit}-${siblingRank}`);
        })
        .sort((a, b) => ((b.card.points ?? 0) - (a.card.points ?? 0)) || (a.index - b.index));

      return traps[0]?.card ?? hoarderLead(hand, trumpSuit);
    }

    const suitWinner = cheapest(inSuitWinners(hand, lead));
    if (suitWinner) return suitWinner;

    if (this.policy === "G") {
      return cheapest(overtrumpingTrumps(hand, lead, trumpSuit)) ?? cheapest(hand);
    }

    return hoarderFollow(hand, lead, trumpSuit, 10);
  }
}
