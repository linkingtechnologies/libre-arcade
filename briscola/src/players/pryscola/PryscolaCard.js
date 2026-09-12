// SPDX-License-Identifier: GPL-3.0-only
// Derived from Pryscola (GPL-3.0-or-later); see THIRD_PARTY_NOTICES.md.
export const PRYSCOLA_CARD_NAMES = Object.freeze([
  "DUE",
  "QUATTRO",
  "CINQUE",
  "SEI",
  "SETTE",
  "JACK",
  "DONNA",
  "RE",
  "TRE",
  "ASSO"
]);

const RANK_TO_NAME = Object.freeze({
  1: "ASSO",
  2: "DUE",
  3: "TRE",
  4: "QUATTRO",
  5: "CINQUE",
  6: "SEI",
  7: "SETTE",
  8: "JACK",
  9: "DONNA",
  10: "RE"
});

const SUIT_TO_SEED = Object.freeze({
  coppe: "CUORI",
  denari: "QUADRI",
  spade: "PICCHE",
  bastoni: "FIORI"
});

const POINTS = Object.freeze({
  ASSO: 11,
  TRE: 10,
  RE: 4,
  DONNA: 3,
  JACK: 2
});

/** Minimal card shape used by the faithful Pryscola port. */
export function pryscolaCard(seed, value) {
  return {
    seed,
    value,
    points: POINTS[value] ?? 0
  };
}

export function toPryscolaCard(card) {
  const seed = SUIT_TO_SEED[card.suit];
  const value = RANK_TO_NAME[card.rank];
  if (!seed || !value) {
    throw new RangeError(`Unsupported BriscoLab card: ${card?.suit}-${card?.rank}`);
  }
  return pryscolaCard(seed, value);
}

export function pryscolaBeats(first, second, briscola) {
  const firstIsTrump = first.seed === briscola.seed;
  const secondIsTrump = second.seed === briscola.seed;

  if (firstIsTrump && !secondIsTrump) return true;
  if (!firstIsTrump && secondIsTrump) return false;

  if (first.seed === second.seed) {
    return PRYSCOLA_CARD_NAMES.indexOf(first.value) > PRYSCOLA_CARD_NAMES.indexOf(second.value);
  }

  // This intentionally mirrors Card.beats() from Pryscola.
  return true;
}
