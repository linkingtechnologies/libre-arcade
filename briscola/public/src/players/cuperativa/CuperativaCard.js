// SPDX-License-Identifier: GPL-3.0-only
// Derived from CuperativaSoloRuby; Copyright (c) 2018-2019 Invido.it.
// Upstream MIT notice is preserved in THIRD_PARTY/Cuperativa-MIT.LICENSE.
/*
 * Card-label compatibility helpers for CuperativaSoloRuby.
 * Original project license: MIT.
 * Cuperativa uses labels such as :_Ab, :_3d, :_Fs, :_Rc.
 */

const SUIT_TO_CODE = Object.freeze({
  bastoni: "b",
  coppe: "c",
  denari: "d",
  spade: "s"
});

const CODE_TO_SUIT = Object.freeze({
  b: "bastoni",
  c: "coppe",
  d: "denari",
  s: "spade"
});

const RANK_TO_CODE = Object.freeze({
  1: "A",
  2: "2",
  3: "3",
  4: "4",
  5: "5",
  6: "6",
  7: "7",
  8: "F",
  9: "C",
  10: "R"
});

const CODE_TO_RANK = Object.freeze({
  A: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 6,
  7: 7,
  F: 8,
  C: 9,
  R: 10
});

const CARD_RANK = Object.freeze({
  A: 12,
  2: 2,
  3: 11,
  4: 4,
  5: 5,
  6: 6,
  7: 7,
  F: 8,
  C: 9,
  R: 10
});

const CARD_POINTS = Object.freeze({
  A: 11,
  2: 0,
  3: 10,
  4: 0,
  5: 0,
  6: 0,
  7: 0,
  F: 2,
  C: 3,
  R: 4
});

export function toCuperativaLabel(card) {
  if (!card) return null;
  const rankCode = RANK_TO_CODE[card.rank];
  const suitCode = SUIT_TO_CODE[card.suit];
  if (!rankCode || !suitCode) {
    throw new TypeError(`Unsupported Briscola card: ${JSON.stringify(card)}`);
  }
  return `_${rankCode}${suitCode}`;
}

export function fromCuperativaLabel(label) {
  assertCuperativaLabel(label);
  return {
    suit: CODE_TO_SUIT[label[2]],
    rank: CODE_TO_RANK[label[1]]
  };
}

export function assertCuperativaLabel(label) {
  if (
    typeof label !== "string" ||
    label.length !== 3 ||
    label[0] !== "_" ||
    !(label[1] in CARD_RANK) ||
    !(label[2] in CODE_TO_SUIT)
  ) {
    throw new TypeError(`Invalid Cuperativa card label: ${String(label)}`);
  }
}

export function cuperativaCardInfo(label) {
  assertCuperativaLabel(label);
  return {
    rank: CARD_RANK[label[1]],
    points: CARD_POINTS[label[1]],
    suitCode: label[2],
    rankCode: label[1]
  };
}
