// SPDX-License-Identifier: GPL-3.0-only
// Derived from smBrisCola 2005-09-27; see THIRD_PARTY_NOTICES.md.
const POINTS = Object.freeze({
  1: 11,
  2: 0,
  3: 10,
  4: 0,
  5: 0,
  6: 0,
  7: 0,
  8: 2,
  9: 3,
  10: 4
});

/**
 * Minimal card shape used by the faithful smBrisCola port.
 * The Italian field names mirror the 2005 Python objects intentionally.
 */
export function smCarta(seme, valore) {
  return Object.freeze({
    seme,
    valore,
    punti: POINTS[valore] ?? 0
  });
}

export function toSmCarta(card) {
  return smCarta(card.suit, card.rank);
}
