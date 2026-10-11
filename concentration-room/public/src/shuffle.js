import { activePositions, CARD_SETS, EXPECTED_CARD_COUNTS, faceDownValue, FIELD_SIZE } from './layouts.js';

export function buildDeck(difficulty) {
  const identities = CARD_SETS[difficulty];
  if (!identities) throw new RangeError(`Invalid difficulty ${difficulty}`);
  const deck = [];
  for (const identity of identities) {
    const value = faceDownValue(identity);
    deck.push(value, value);
  }
  return deck;
}

// Exact 0.02 shuffle. This is intentionally not replaced with Fisher-Yates.
export function shuffleDeckInPlace(deck, prng) {
  const nCards = deck.length;
  for (let shufflePos = nCards - 1; shufflePos >= 0; shufflePos -= 1) {
    prng.randomBits(6);
    const random6 = prng.rand3 & 0x3f;
    const swapWith = (random6 + shufflePos + 1) % nCards;
    [deck[shufflePos], deck[swapWith]] = [deck[swapWith], deck[shufflePos]];
  }
  return deck;
}

export function dealBoard({ difficulty, prng, dealNmis = 0 }) {
  if (!Number.isInteger(difficulty) || difficulty < 0 || difficulty > 4) {
    throw new RangeError(`Invalid difficulty ${difficulty}`);
  }
  prng.mixDealTime(dealNmis);
  const deck = shuffleDeckInPlace(buildDeck(difficulty), prng);
  const positions = activePositions(difficulty);
  if (positions.length !== EXPECTED_CARD_COUNTS[difficulty]) {
    throw new Error('Internal layout/card count mismatch');
  }
  const board = new Uint8Array(FIELD_SIZE);
  positions.forEach((position, i) => {
    board[position] = deck[i];
  });
  return { board, deck: Uint8Array.from(deck), positions };
}
