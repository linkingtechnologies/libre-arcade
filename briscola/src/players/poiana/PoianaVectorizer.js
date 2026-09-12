// SPDX-License-Identifier: GPL-3.0-only

export const POIANA_OBSERVATION_SIZE = 519;

const SUIT_INDEX = Object.freeze({
  spade: 1,
  denari: 2,
  coppe: 3,
  bastoni: 4
});

const SCORE_INDEX = Object.freeze({
  1: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 6,
  7: 7,
  8: 11, // Jack / Fante
  9: 12, // Knight / Cavallo
  10: 13 // King / Re
});

function oneHot(value, cardinality) {
  if (!Number.isInteger(value) || value < 0 || value >= cardinality) {
    throw new RangeError(`Cannot one-hot encode ${value} with cardinality ${cardinality}`);
  }
  const out = new Float32Array(cardinality);
  out[value] = 1;
  return out;
}

function append(target, offset, values) {
  target.set(values, offset);
  return offset + values.length;
}

export function poianaCardVector(card) {
  // Upstream pad card is (score=0, suit=0, points=0), encoded as three
  // one-hot index-zero values rather than an all-zero vector.
  const score = card ? SCORE_INDEX[card.rank] : 0;
  const suit = card ? SUIT_INDEX[card.suit] : 0;
  const points = card ? Number(card.points) : 0;
  if (card && score == null) throw new Error(`Unsupported PoIAna rank ${card.rank}`);
  if (card && suit == null) throw new Error(`Unsupported PoIAna suit ${card.suit}`);

  const out = new Float32Array(31);
  let offset = 0;
  offset = append(out, offset, oneHot(score, 14));
  offset = append(out, offset, oneHot(suit, 5));
  append(out, offset, oneHot(points, 12));
  return out;
}

function appendCards(target, offset, cards, paddedLength) {
  for (let i = 0; i < paddedLength; i += 1) {
    offset = append(target, offset, poianaCardVector(cards[i] ?? null));
  }
  return offset;
}

/**
 * Faithful translation of PoIAna OnnxState.FlatOneHot().
 *
 * The upstream Godot game uses a 1-based `_turn` counter except for the
 * special opening case where PoIAna itself leads before `_turn = 1` runs.
 * `poianaTurn()` intentionally preserves that deployed quirk.
 */
export function poianaTurn(observation) {
  if (observation.trickNumber === 1 && observation.isLeading) return 0;
  return observation.trickNumber;
}

export function vectorizePoianaObservation(observation, originalTrump) {
  if (!observation) throw new TypeError("observation is required");
  const briscola = originalTrump ?? observation.visibleTrump;
  if (!briscola) throw new Error("PoIAna requires the originally exposed trump card");

  const out = new Float32Array(POIANA_OBSERVATION_SIZE);
  let offset = 0;

  // Exact upstream flatten order (equivalent to Gymnasium Dict flatten order):
  // briscola, hand, hand_size, my_points, order, other_hand_size,
  // other_points, remaining_deck_cards, table, turn.
  offset = append(out, offset, poianaCardVector(briscola));
  offset = appendCards(out, offset, observation.hand, 3);
  offset = append(out, offset, oneHot(observation.hand.length, 4));
  offset = append(out, offset, oneHot(observation.scores.mine, 121));
  offset = append(out, offset, oneHot(observation.isLeading ? 0 : 1, 2));
  offset = append(out, offset, oneHot(observation.opponentHandCount, 4));
  offset = append(out, offset, oneHot(observation.scores.opponent, 121));

  const remainingDeckCards = observation.stockCount + (observation.visibleTrump ? 1 : 0);
  offset = append(out, offset, oneHot(remainingDeckCards, 41));
  offset = appendCards(out, offset, observation.table.map((play) => play.card), 2);
  offset = append(out, offset, oneHot(poianaTurn(observation), 40));

  if (offset !== POIANA_OBSERVATION_SIZE) {
    throw new Error(`PoIAna vectorizer produced ${offset} values, expected ${POIANA_OBSERVATION_SIZE}`);
  }
  return out;
}
