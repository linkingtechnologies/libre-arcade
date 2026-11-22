// SPDX-License-Identifier: GPL-3.0-only
// Derived from QBriscola 1.1 (GPL-2.0-or-later); see THIRD_PARTY_NOTICES.md.
/* Helper used only by tests/examples of the faithful QBriscola port. */
const PRIORITA = Object.freeze({
  1: 10,
  2: 1,
  3: 9,
  4: 2,
  5: 3,
  6: 4,
  7: 5,
  8: 6,
  9: 7,
  10: 8
});

const PUNTEGGIO = Object.freeze({
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

export function qCarta(seme, numero) {
  return Object.freeze({
    seme,
    numero,
    priorita: PRIORITA[numero],
    punteggio: PUNTEGGIO[numero]
  });
}
