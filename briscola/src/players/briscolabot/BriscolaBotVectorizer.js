// SPDX-License-Identifier: GPL-3.0-only

// BriscolaBot upstream encodes cards as suit * 10 + (rank - 1), with suits:
// 0=Bastoni, 1=Coppe, 2=Denari, 3=Spade.
const SUIT_INDEX = Object.freeze({
  bastoni: 0,
  coppe: 1,
  denari: 2,
  spade: 3
});

export const BRISCOLABOT_DECK_SIZE = 40;
export const BRISCOLABOT_OBSERVATION_SIZE = 162;

export function toBriscolaBotCardIndex(card) {
  if (!card) throw new TypeError("card is required");
  const suitIndex = SUIT_INDEX[card.suit];
  if (!Number.isInteger(suitIndex)) throw new RangeError(`Unsupported suit: ${card.suit}`);
  if (!Number.isInteger(card.rank) || card.rank < 1 || card.rank > 10) {
    throw new RangeError(`Unsupported rank: ${card.rank}`);
  }
  return suitIndex * 10 + (card.rank - 1);
}

export function fromBriscolaBotCardIndex(index) {
  if (!Number.isInteger(index) || index < 0 || index >= BRISCOLABOT_DECK_SIZE) {
    throw new RangeError(`Invalid BriscolaBot card index: ${index}`);
  }
  const suits = ["bastoni", "coppe", "denari", "spade"];
  const suit = suits[Math.floor(index / 10)];
  const rank = (index % 10) + 1;
  return { suit, rank, id: `${suit}-${rank}` };
}

/**
 * Faithful translation of TwoPlayerBriscola.observe().
 * Layout: 40 thrown cards, 40 exposed trump card, 40 table card,
 * 40 current hand cards, own score / 120, opponent score / 120.
 */
export function vectorizeBriscolaBotObservation(observation, originalTrump) {
  if (!observation) throw new TypeError("observation is required");
  if (!originalTrump) {
    throw new Error("BriscolaBot requires the originally exposed trump card");
  }

  const vector = new Float32Array(BRISCOLABOT_OBSERVATION_SIZE);
  const actionMask = new BigInt64Array(BRISCOLABOT_DECK_SIZE);

  for (const card of observation.playedCards) {
    vector[toBriscolaBotCardIndex(card)] = 1;
  }

  vector[40 + toBriscolaBotCardIndex(originalTrump)] = 1;

  const tableCard = observation.table.find((play) => play.playerId !== observation.playerId)?.card;
  if (tableCard) {
    vector[80 + toBriscolaBotCardIndex(tableCard)] = 1;
  }

  for (const card of observation.hand) {
    const index = toBriscolaBotCardIndex(card);
    vector[120 + index] = 1;
    actionMask[index] = 1n;
  }

  vector[160] = observation.scores.mine / 120;
  vector[161] = observation.scores.opponent / 120;

  return { observation: vector, actionMask };
}
