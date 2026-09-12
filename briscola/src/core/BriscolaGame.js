// SPDX-License-Identifier: GPL-3.0-only
import { SeededRandom } from "./SeededRandom.js";
import {
  createDeck,
  resultFromScores,
  trickPoints,
  trickWinner
} from "./BriscolaRules.js";

function cloneCard(card) {
  return card ? { ...card } : null;
}

function shuffle(deck, rng) {
  const out = [...deck];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = rng.int(i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export class BriscolaGame extends EventTarget {
  constructor({ seed = Date.now(), firstPlayer = 0 } = {}) {
    super();
    if (![0, 1].includes(firstPlayer)) {
      throw new RangeError("firstPlayer must be 0 or 1");
    }

    this.seed = Number(seed) >>> 0;
    this.initialFirstPlayer = firstPlayer;
    this.reset();
  }

  reset({ seed = this.seed, firstPlayer = this.initialFirstPlayer } = {}) {
    this.seed = Number(seed) >>> 0;
    this.rng = new SeededRandom(this.seed);

    const shuffled = shuffle(createDeck(), this.rng);

    this.state = {
      phase: "playing",
      turn: firstPlayer,
      leader: firstPlayer,
      hands: [[], []],
      scores: [0, 0],
      captured: [[], []],
      table: [],
      playedCards: [],
      stock: shuffled,
      visibleTrump: null,
      trumpSuit: null,
      trickNumber: 1,
      result: null
    };

    // Deal first, then expose the next card as trump. This mirrors the
    // conventional two-player Briscola setup and makes seeded deals explicit.
    for (let round = 0; round < 3; round += 1) {
      this.state.hands[firstPlayer].push(this.#drawFromStockOnly());
      this.state.hands[1 - firstPlayer].push(this.#drawFromStockOnly());
    }

    this.state.visibleTrump = this.#drawFromStockOnly();
    this.state.trumpSuit = this.state.visibleTrump.suit;

    this.#emit("reset", { seed: this.seed });
    return this.getPublicState();
  }

  getPublicState() {
    const s = this.state;
    return {
      seed: this.seed,
      phase: s.phase,
      turn: s.turn,
      leader: s.leader,
      hands: s.hands.map((hand) => hand.map(cloneCard)),
      handCounts: s.hands.map((hand) => hand.length),
      scores: [...s.scores],
      table: s.table.map((play) => ({ playerId: play.playerId, card: cloneCard(play.card) })),
      playedCards: s.playedCards.map(cloneCard),
      stockCount: s.stock.length,
      visibleTrump: cloneCard(s.visibleTrump),
      trumpSuit: s.trumpSuit,
      trickNumber: s.trickNumber,
      result: s.result ? { ...s.result } : null
    };
  }

  // This will be the natural boundary for the future Player/AI layer.
  // It deliberately exposes only information legally available to playerId.
  getObservation(playerId) {
    this.#assertPlayer(playerId);
    const s = this.state;
    return {
      playerId,
      phase: s.phase,
      isMyTurn: s.turn === playerId,
      isLeading: s.table.length === 0,
      hand: s.hands[playerId].map(cloneCard),
      opponentHandCount: s.hands[1 - playerId].length,
      scores: {
        mine: s.scores[playerId],
        opponent: s.scores[1 - playerId]
      },
      table: s.table.map((play) => ({ playerId: play.playerId, card: cloneCard(play.card) })),
      playedCards: s.playedCards.map(cloneCard),
      stockCount: s.stock.length,
      visibleTrump: cloneCard(s.visibleTrump),
      trumpSuit: s.trumpSuit,
      trickNumber: s.trickNumber
    };
  }

  legalActions(playerId) {
    this.#assertPlayer(playerId);
    if (this.state.phase !== "playing" || this.state.turn !== playerId) return [];
    return this.state.hands[playerId].map((card) => ({
      type: "PLAY_CARD",
      cardId: card.id
    }));
  }

  playCard(playerId, cardId) {
    this.#assertPlayer(playerId);
    const s = this.state;

    if (s.phase !== "playing") throw new Error("The game is not in playing phase");
    if (s.turn !== playerId) throw new Error(`It is not player ${playerId}'s turn`);

    const hand = s.hands[playerId];
    const cardIndex = hand.findIndex((card) => card.id === cardId);
    if (cardIndex < 0) throw new Error(`Card ${cardId} is not in player ${playerId}'s hand`);

    const [card] = hand.splice(cardIndex, 1);
    s.table.push({ playerId, card });
    this.#emit("cardplayed", { playerId, card: cloneCard(card) });

    if (s.table.length === 1) {
      s.turn = 1 - playerId;
      this.#emit("turnchanged", { playerId: s.turn });
      return this.getPublicState();
    }

    this.#resolveTrick();
    return this.getPublicState();
  }

  #resolveTrick() {
    const s = this.state;
    const [leadPlay, replyPlay] = s.table;
    const winner = trickWinner(leadPlay, replyPlay, s.trumpSuit);
    const points = trickPoints(s.table);

    s.scores[winner] += points;
    const trickCards = s.table.map((play) => play.card);
    s.captured[winner].push(...trickCards);
    s.playedCards.push(...trickCards);

    this.#emit("trickwon", {
      winner,
      points,
      cards: trickCards.map(cloneCard),
      trickNumber: s.trickNumber
    });

    s.table = [];

    // Winner of the trick draws first and leads next.
    this.#refillHand(winner);
    this.#refillHand(1 - winner);

    s.leader = winner;
    s.turn = winner;

    if (s.hands[0].length === 0 && s.hands[1].length === 0) {
      this.#finish();
      return;
    }

    s.trickNumber += 1;
    this.#emit("turnchanged", { playerId: winner });
  }

  #refillHand(playerId) {
    if (this.state.stock.length > 0) {
      this.state.hands[playerId].push(this.#drawFromStockOnly());
      return;
    }

    // The exposed trump is the final drawable card.
    if (this.state.visibleTrump) {
      this.state.hands[playerId].push(this.state.visibleTrump);
      this.state.visibleTrump = null;
    }
  }

  #drawFromStockOnly() {
    const card = this.state?.stock?.pop?.();
    if (!card) throw new Error("No card available in stock");
    return card;
  }

  #finish() {
    const [score0, score1] = this.state.scores;
    const outcome = resultFromScores([score0, score1]);
    this.state.phase = "finished";
    this.state.result = {
      ...outcome,
      scores: [score0, score1]
    };
    this.state.turn = null;
    this.#emit("gameover", { ...this.state.result });
  }

  #assertPlayer(playerId) {
    if (![0, 1].includes(playerId)) {
      throw new RangeError("playerId must be 0 or 1");
    }
  }

  #emit(type, detail) {
    this.dispatchEvent(new CustomEvent(type, { detail }));
    this.dispatchEvent(new CustomEvent("statechange", { detail: this.getPublicState() }));
  }
}
