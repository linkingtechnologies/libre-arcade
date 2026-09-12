// SPDX-FileCopyrightText: 2021 Radovan Janjic
// SPDX-FileCopyrightText: 2026 Umberto Bresciani
// SPDX-License-Identifier: MIT

/**
 * Headless, traceable extraction of rjanjic/js-solitaire/src/index.js.
 * This module intentionally preserves upstream behavior before improvements.
 */

export const SUITS = ["c", "d", "h", "s"];
export const COLORS = { c: 0, d: 1, h: 1, s: 0 };

export function createCards() {
  return SUITS.flatMap((suit) =>
    Array.from({ length: 13 }, (_, i) => ({
      id: `${suit}-${i + 1}`,
      suit,
      rank: i + 1,
      faceUp: false,
    })),
  );
}

// Faithful to resetGame(): deliberately biased and non-reproducible by default.
export function referenceShuffle(cards, random = Math.random) {
  return [...cards].sort(() => (random() < 0.5 ? -1 : 1));
}

export function createReferenceGame(cards = referenceShuffle(createCards())) {
  const game = {
    cards: cards.map((card) => ({ ...card, faceUp: false })),
    stock: cards.map((_, i) => i),
    waste: [],
    foundations: [[], [], [], []],
    tableau: [[], [], [], [], [], [], []],
  };

  let card = 0;
  // Exact triangular deal order used by upstream dealCards().
  for (let row = 0; row < 7; row++) {
    for (let pile = row; pile < 7; pile++) {
      game.tableau[pile].push(card);
      game.stock.splice(game.stock.indexOf(card), 1);
      if (pile === row) game.cards[card].faceUp = true;
      card++;
    }
  }
  return game;
}

export function drawCards(game, drawCount = 3) {
  const count = Math.min(drawCount, game.stock.length);
  for (let i = 0; i < count; i++) {
    const card = game.stock.pop();
    game.cards[card].faceUp = true;
    game.waste.push(card);
  }
  return game;
}

export function drawThree(game) { return drawCards(game, 3); }

// Upstream reuses the waste array without reversing it.
export function recycleWaste(game) {
  game.stock = game.waste;
  game.waste = [];
  game.stock.forEach((card) => { game.cards[card].faceUp = false; });
  return game;
}

export function locate(game, card) {
  for (let pile = 0; pile < 7; pile++) {
    const index = game.tableau[pile].indexOf(card);
    if (index >= 0) return { area: "tableau", pile, index };
  }
  for (let pile = 0; pile < 4; pile++) {
    const index = game.foundations[pile].indexOf(card);
    if (index >= 0) return { area: "foundations", pile, index };
  }
  for (const area of ["waste", "stock"]) {
    const index = game[area].indexOf(card);
    if (index >= 0) return { area, pile: null, index };
  }
  return null;
}

function pileAt(game, location) {
  return location.pile === null ? game[location.area] : game[location.area][location.pile];
}

export function availableDestinations(game, card, firstOnly = false) {
  const value = game.cards[card];
  const location = locate(game, card);
  if (!location) return [];
  const source = pileAt(game, location);
  const hasSubCards = location.area === "tableau" && location.index < source.length - 1;
  const result = [];
  const add = (area, pile) => {
    result.push({ area, pile });
    return firstOnly;
  };

  // Historical quirk: an Ace may claim any empty foundation.
  if (value.rank === 1) {
    for (let pile = 0; pile < 4; pile++) {
      if (game.foundations[pile].length === 0 && add("foundations", pile)) return result;
    }
  }

  if (!hasSubCards) {
    for (let pile = 0; pile < 4; pile++) {
      const foundation = game.foundations[pile];
      if (foundation.length + 1 !== value.rank || foundation.length === 0) continue;
      const top = game.cards[foundation.at(-1)];
      if (top.suit === value.suit) {
        if (add("foundations", pile)) return result;
        break;
      }
    }
  }

  for (let pile = 0; pile < 7; pile++) {
    const tableau = game.tableau[pile];
    if (tableau.length === 0) {
      if (value.rank === 13 && add("tableau", pile)) return result;
      continue;
    }
    const parent = game.cards[tableau.at(-1)];
    if (parent.rank - 1 === value.rank && COLORS[parent.suit] !== COLORS[value.suit]) {
      if (add("tableau", pile)) return result;
    }
  }
  return result;
}

export function moveTo(game, card, destination) {
  const location = locate(game, card);
  if (!location) return false;
  const source = pileAt(game, location);
  const moving = source.splice(location.index);
  game[destination.area][destination.pile].push(...moving);
  if (location.area === "tableau" && source.length) game.cards[source.at(-1)].faceUp = true;
  return true;
}

export function clickCard(game, card) {
  const destination = availableDestinations(game, card, true)[0];
  return destination ? moveTo(game, card, destination) : false;
}

export function isWon(game) {
  return game.foundations.every((pile) => pile.length === 13);
}
