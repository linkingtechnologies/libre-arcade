// SPDX-License-Identifier: GPL-3.0-only
import {
  createDeck,
  getCardPoints,
  getCardStrength,
  trickPoints,
  trickWinner
} from "../../core/BriscolaRules.js";

// The 2015 demo encodes suits as hearts, diamonds, clubs, spades.  BriscoLab
// uses Italian suit names, so this mapping preserves the upstream suit order
// only for otherwise-equal leading-card tie breaks:
// hearts -> coppe, diamonds -> denari, clubs -> bastoni, spades -> spade.
const LEGACY_SUIT_ORDER = Object.freeze({ coppe: 0, denari: 1, bastoni: 2, spade: 3 });

function legacyRankOrder(card) {
  // Upstream rank order is 2,4,5,6,7,J,Q,K,3,A, which is exactly the
  // ascending Briscola strength order used by BriscoLab.
  return getCardStrength(card) - 1;
}

function leadingBucket(card, trumpSuit) {
  const points = getCardPoints(card);
  const trump = card.suit === trumpSuit ? 1 : 0;
  if (points === 0) return trump;          // 0 non-trump, 1 trump
  if (points < 10) return 2 + trump;      // 2 low-points non-trump, 3 trump
  return 4 + trump;                       // 4 A/3 non-trump, 5 trump
}

function compareLeadingCards(a, b, trumpSuit) {
  const bucket = leadingBucket(a, trumpSuit) - leadingBucket(b, trumpSuit);
  if (bucket) return bucket;
  const rank = legacyRankOrder(a) - legacyRankOrder(b);
  if (rank) return rank;
  return (LEGACY_SUIT_ORDER[a.suit] ?? 99) - (LEGACY_SUIT_ORDER[b.suit] ?? 99);
}

/** Faithful behavioral reconstruction of the demo's S0 heuristic. */
export function chooseS0Card(observation) {
  if (observation.table.length === 0) {
    return [...observation.hand].sort((a, b) => compareLeadingCards(a, b, observation.trumpSuit))[0];
  }

  const leadPlay = observation.table[0];
  let best = observation.hand[0];
  let bestUtility = -Infinity;
  const scoreDiff = observation.scores.mine - observation.scores.opponent;

  // Upstream argmax keeps the first action on equal values.  Iterating the
  // observation hand in slot/deal order preserves that tie-break.
  for (const card of observation.hand) {
    const replyPlay = { playerId: observation.playerId, card };
    const winner = trickWinner(leadPlay, replyPlay, observation.trumpSuit);
    const points = trickPoints([leadPlay, replyPlay]);
    const utility = scoreDiff + (winner === observation.playerId ? points : -points);
    if (utility > bestUtility) {
      bestUtility = utility;
      best = card;
    }
  }
  return best;
}

function inferOpponentHand(observation) {
  if (observation.stockCount !== 0 || observation.visibleTrump !== null) return null;

  const knownIds = new Set([
    ...observation.hand.map((card) => card.id),
    ...observation.playedCards.map((card) => card.id),
    ...observation.table.map((play) => play.card.id)
  ]);
  const inferred = createDeck().filter((card) => !knownIds.has(card.id));
  return inferred.length === observation.opponentHandCount ? inferred : null;
}

function cloneSearchState(state) {
  return {
    turn: state.turn,
    hands: [state.hands[0].slice(), state.hands[1].slice()],
    scores: state.scores.slice(),
    table: state.table.map((play) => ({ playerId: play.playerId, card: play.card })),
    trumpSuit: state.trumpSuit
  };
}

function terminal(state) {
  return state.hands[0].length === 0 && state.hands[1].length === 0 && state.table.length === 0;
}

function utility(state, maximizingPlayer) {
  return state.scores[maximizingPlayer] - state.scores[1 - maximizingPlayer];
}

function result(state, card) {
  const next = cloneSearchState(state);
  const hand = next.hands[next.turn];
  const index = hand.findIndex((candidate) => candidate.id === card.id);
  if (index < 0) throw new Error(`Briscola.js search: illegal card ${card.id}`);

  const playerId = next.turn;
  hand.splice(index, 1);
  next.table.push({ playerId, card });

  if (next.table.length === 1) {
    next.turn = 1 - playerId;
    return next;
  }

  const winner = trickWinner(next.table[0], next.table[1], next.trumpSuit);
  next.scores[winner] += trickPoints(next.table);
  next.table = [];
  next.turn = winner;
  return next;
}

function alphaBetaValue(state, maximizingPlayer, alpha, beta) {
  if (terminal(state)) return utility(state, maximizingPlayer);

  if (state.turn === maximizingPlayer) {
    let value = -Infinity;
    for (const card of state.hands[state.turn]) {
      value = Math.max(value, alphaBetaValue(result(state, card), maximizingPlayer, alpha, beta));
      if (value >= beta) return value;
      alpha = Math.max(alpha, value);
    }
    return value;
  }

  let value = Infinity;
  for (const card of state.hands[state.turn]) {
    value = Math.min(value, alphaBetaValue(result(state, card), maximizingPlayer, alpha, beta));
    if (value <= alpha) return value;
    beta = Math.min(beta, value);
  }
  return value;
}

/**
 * Upstream alpha-beta endgame search, reconstructed over public information.
 * It becomes applicable at trick 18, when the stock and exposed trump are both
 * exhausted and the opponent's remaining cards are exactly inferable.
 */
export function chooseAlphaBetaEndgameCard(observation) {
  const opponentHand = inferOpponentHand(observation);
  if (!opponentHand) return null;

  const me = observation.playerId;
  const state = {
    turn: me,
    hands: [[], []],
    scores: [0, 0],
    table: observation.table.map((play) => ({ playerId: play.playerId, card: play.card })),
    trumpSuit: observation.trumpSuit
  };
  state.hands[me] = observation.hand.slice();
  state.hands[1 - me] = opponentHand;
  state.scores[me] = observation.scores.mine;
  state.scores[1 - me] = observation.scores.opponent;

  let bestCard = observation.hand[0];
  let bestValue = -Infinity;
  let alpha = -Infinity;
  const beta = Infinity;

  for (const card of observation.hand) {
    const value = alphaBetaValue(result(state, card), me, alpha, beta);
    if (value > bestValue) {
      bestValue = value;
      bestCard = card;
    }
    alpha = Math.max(alpha, bestValue);
  }

  return bestCard;
}

export class BriscolaJsAI {
  constructor({ strategy = "S1" } = {}) {
    this.strategy = String(strategy).toUpperCase();
    if (!new Set(["S0", "S1"]).has(this.strategy)) {
      throw new Error(`Unknown Briscola.js strategy '${strategy}'`);
    }
  }

  chooseCard(observation) {
    // The demo's S1 switches when n_round >= 18.  BriscoLab trickNumber has
    // the same 1..20 semantics.  Fall back to S0 if inference is unexpectedly
    // incomplete rather than reading hidden engine state.
    if (this.strategy === "S1" && observation.trickNumber >= 18) {
      return chooseAlphaBetaEndgameCard(observation) ?? chooseS0Card(observation);
    }
    return chooseS0Card(observation);
  }
}
