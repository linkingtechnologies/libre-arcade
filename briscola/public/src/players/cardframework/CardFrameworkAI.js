// SPDX-License-Identifier: GPL-3.0-only
import { SeededRandom } from "../../core/SeededRandom.js";

/**
 * Faithful JavaScript port of CardFramework.Maui 1.6.20's Briscola CPU helpers.
 *
 * The upstream assembly was decompiled from the user-supplied NuGet package.
 * Decision-relevant quirks are intentionally preserved, including:
 * - the original insertion/bubble hand ordering;
 * - Cpu0/Cpu1's manual trump scan excluding the last hand slot;
 * - getSoprataglio comparing card points rather than complete trick strength;
 * - Cpu1's otherwise-unused random draw;
 * - Cpu2's 50% probabilistic branches.
 *
 * CardFramework's `stessoSeme` optional flag defaults to false. That is the
 * Briscola mode used here; the true branch is intended for games requiring
 * following suit (the upstream README also mentions poker).
 */

function legacyValue(card) {
  // Upstream card values are 0..9, while BriscoLab ranks are 1..10.
  return Number(card.rank) - 1;
}

function legacyPoints(card) {
  return Number(card.points ?? 0);
}

function sameSuit(a, b) {
  return Boolean(a && b && a.suit === b.suit);
}

function isTrump(card, trumpSuit) {
  return Boolean(card && card.suit === trumpSuit);
}

/**
 * Mirrors org.altervista.numerone.framework.briscola.CartaHelper.CompareTo.
 * Upstream semantics are unusual: -1 means the first card is "greater",
 * +1 means the second card is "greater".
 */
export function cardFrameworkCompareTo(a, b, trumpSuit) {
  if (!b) return 1;

  const pa = legacyPoints(a);
  const pb = legacyPoints(b);
  if (pa < pb) return 1;
  if (pa > pb) return -1;

  const va = legacyValue(a);
  const vb = legacyValue(b);
  if (va < vb) return 1;

  // Preserve the exact branch order of the upstream IL, including its
  // asymmetric-looking trump tie handling.
  if (isTrump(b, trumpSuit) && !isTrump(a, trumpSuit)) return 1;
  if (va > vb) return -1;
  if (isTrump(a, trumpSuit) && !isTrump(b, trumpSuit)) return -1;
  return 0;
}

/** Initial-deal insertion sort used by Giocatore.Ordina(). */
export function insertInitialCard(sortedHand, card, trumpSuit) {
  let i = 0;
  while (
    i < sortedHand.length &&
    sortedHand[i] &&
    cardFrameworkCompareTo(card, sortedHand[i], trumpSuit) < 0
  ) {
    i += 1;
  }
  sortedHand.splice(i, 0, card);
  return sortedHand;
}

/** Refill ordering used by Giocatore.AddCarta() after a played card is removed. */
export function appendAndBubbleRefill(sortedHand, card, trumpSuit) {
  sortedHand.push(card);
  let i = sortedHand.length - 2;
  while (
    i >= 0 &&
    cardFrameworkCompareTo(sortedHand[i], sortedHand[i + 1], trumpSuit) < 0
  ) {
    [sortedHand[i], sortedHand[i + 1]] = [sortedHand[i + 1], sortedHand[i]];
    i -= 1;
  }
  return sortedHand;
}

function firstIndex(hand, predicate) {
  const i = hand.findIndex(predicate);
  return i < 0 ? hand.length : i;
}

function lastIndex(hand, predicate) {
  for (let i = hand.length - 1; i >= 0; i -= 1) {
    if (predicate(hand[i])) return i;
  }
  return hand.length;
}

function getBriscola(hand, trumpSuit) {
  return firstIndex(hand, (card) => isTrump(card, trumpSuit));
}

function getSoprataglio(hand, lead, maggiore) {
  const predicate = (card) =>
    legacyPoints(card) > legacyPoints(lead) && sameSuit(card, lead);
  return maggiore ? lastIndex(hand, predicate) : firstIndex(hand, predicate);
}

function chooseLeader(hand, trumpSuit) {
  // In Briscola stessoSeme defaults to false, so primoDiMano never becomes
  // active. The remaining upstream priority is preserved exactly.
  let index = firstIndex(
    hand,
    (card) => legacyPoints(card) > 1 && legacyPoints(card) < 5 && !isTrump(card, trumpSuit)
  );
  if (index >= hand.length) {
    index = firstIndex(hand, (card) => legacyPoints(card) === 0);
  }
  if (index >= hand.length) {
    index = firstIndex(hand, (card) => isTrump(card, trumpSuit));
  }
  if (index >= hand.length || index < 0) index = 0;
  return index;
}

function cpu0Reply(hand, lead, trumpSuit) {
  let index = hand.length;

  // Faithfully preserve the upstream `i < numeroCarte - 1` scan. It can miss
  // a trump that occupies the last sorted slot.
  for (let i = 0; i < hand.length - 1 && index === hand.length; i += 1) {
    if (isTrump(hand[i], trumpSuit)) index = i;
  }

  // stessoSeme=false in Briscola mode, therefore the original fallback is 0.
  if (index === hand.length) index = 0;
  return index;
}

function cpu1Reply(hand, lead, trumpSuit, random) {
  // Upstream consumes Random.Next(0, 65535) even though the value is then
  // overwritten before it can influence the move.
  random.next();

  let index = hand.length;
  if (!isTrump(lead, trumpSuit)) {
    index = getSoprataglio(hand, lead, true);
    if (index < hand.length) return index;

    index = hand.length;
    for (let i = 0; i < hand.length - 1 && index === hand.length; i += 1) {
      if (isTrump(hand[i], trumpSuit)) index = i;
    }
  }

  if (index >= hand.length) index = 0;
  return index;
}

function legacyRandomMod10(random) {
  // System.Random.Next() returns [0, Int32.MaxValue). We preserve the modulo-10
  // decision shape while using BriscoLab's deterministic RNG for reproducible
  // Arena runs.
  return Math.floor(random.next() * 2147483647) % 10;
}

function cpu2Reply(hand, lead, trumpSuit, random) {
  // Dead/initial random draw present in the upstream method.
  random.next();
  let index = hand.length;

  if (!isTrump(lead, trumpSuit)) {
    index = getSoprataglio(hand, lead, true);
    if (index < hand.length) return index;

    if (legacyPoints(lead) > 0) {
      index = getBriscola(hand, trumpSuit);
      if (index < hand.length) {
        if (legacyPoints(lead) > 4) return index;
        if (legacyPoints(hand[index]) > 0 && legacyRandomMod10(random) < 5) {
          return index;
        }
      }
    }
  } else if (legacyRandomMod10(random) < 5) {
    index = getSoprataglio(hand, lead, false);
    if (index < hand.length) return index;
  }

  // stessoSeme=false in Briscola mode.
  if (index >= hand.length) index = 0;
  return index;
}

export class CardFrameworkAI {
  constructor({ level = 0, trumpSuit, randomSeed = 0x4346524d } = {}) {
    if (![0, 1, 2].includes(level)) throw new RangeError("CardFramework level must be 0, 1 or 2");
    if (!trumpSuit) throw new TypeError("trumpSuit is required");
    this.level = level;
    this.trumpSuit = trumpSuit;
    this.random = new SeededRandom(randomSeed);
  }

  chooseIndex({ hand, lead = null }) {
    if (!Array.isArray(hand) || hand.length === 0) {
      throw new Error("CardFrameworkAI requires a non-empty sorted hand");
    }
    if (!lead) return chooseLeader(hand, this.trumpSuit);
    if (this.level === 0) return cpu0Reply(hand, lead, this.trumpSuit);
    if (this.level === 1) return cpu1Reply(hand, lead, this.trumpSuit, this.random);
    return cpu2Reply(hand, lead, this.trumpSuit, this.random);
  }
}
