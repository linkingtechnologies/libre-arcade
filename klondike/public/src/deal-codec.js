// SPDX-FileCopyrightText: 2026 Umberto Bresciani
// SPDX-License-Identifier: GPL-3.0-or-later

const suits = { 1: "c", 2: "d", 3: "h", 4: "s" };

export function validateMinimalDeal(deal) {
  if (!deal || typeof deal.encoded !== "string") return false;
  const encodedCards = deal.encoded.match(/.{3}/g) ?? [];
  if (deal.encoded.length !== 156 || encodedCards.length !== 52) return false;
  if (!encodedCards.every((token) => /^(0[1-9]|1[0-3])[1-4]$/.test(token))) return false;
  return new Set(encodedCards).size === 52;
}

export function cardsFromMinimalDeal(deal) {
  if (!validateMinimalDeal(deal)) throw new Error("MinimalKlondike deal must contain one complete 52-card deck");
  const encodedCards = deal?.encoded?.match(/.{3}/g) ?? [];
  const tableau = encodedCards.slice(0, 28);
  const stock = encodedCards.slice(28).reverse();
  return [...tableau, ...stock].map((token) => {
    const rank = Number(token.slice(0, 2));
    const suit = suits[token[2]];
    return { id: `${suit}-${rank}`, suit, rank, faceUp: false };
  });
}
