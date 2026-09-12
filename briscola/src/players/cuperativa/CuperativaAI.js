// SPDX-License-Identifier: GPL-3.0-only
// Derived from CuperativaSoloRuby; Copyright (c) 2018-2019 Invido.it.
// Upstream MIT notice is preserved in THIRD_PARTY/Cuperativa-MIT.LICENSE.
/*
 * Faithful JavaScript port of CuperativaSoloRuby's Briscola CPU "master".
 *
 * Original source:
 *   src/games/briscola/alg_cpu_briscola.rb
 *   CuperativaSoloRuby master, snapshot 2021-04-03
 * Original project: Cuperativa / CuperativaSoloRuby by aaaasmile
 * Original license: MIT
 *
 * The method names, decision order, weights and known quirks are intentionally
 * kept close to the Ruby source. This module knows nothing about BriscoLab's
 * engine; CuperativaAdapter is the only bridge between the two models.
 */

import {
  assertCuperativaLabel,
  cuperativaCardInfo
} from "./CuperativaCard.js";

function firstMinimum(weightedCards) {
  if (weightedCards.length === 0) return null;
  let best = weightedCards[0];
  for (let i = 1; i < weightedCards.length; i += 1) {
    if (weightedCards[i][1] < best[1]) best = weightedCards[i];
  }
  return best;
}

export class CuperativaAI {
  constructor({ targetPoints = 61 } = {}) {
    this.target_points = targetPoints;
    this.cards_on_hand = [];
    this.card_played = [];
    this.briscola = null;
    this.num_cards_on_deck = 0;
    this.points_me = 0;
    this.points_opp = 0;
    this.strozzi_on_suite = { b: 2, d: 2, s: 2, c: 2 };
    this.lastRule = null;
    this.lastWeights = null;
  }

  /**
   * Minimal API of the faithful port. Returns a Cuperativa card label such as
   * "_3d" or "_Fs".
   */
  scegliCarta(state) {
    this.setState(state);
    return this.play_like_a_master();
  }

  setState({
    cardsOnHand,
    briscola,
    cardPlayed = [],
    pointsMine = 0,
    pointsOpponent = 0,
    targetPoints = this.target_points,
    strozziOnSuite = { b: 2, d: 2, s: 2, c: 2 },
    numCardsOnDeck = 0
  }) {
    if (!Array.isArray(cardsOnHand) || cardsOnHand.length < 1 || cardsOnHand.length > 3) {
      throw new TypeError("cardsOnHand must contain 1 to 3 Cuperativa cards");
    }
    cardsOnHand.forEach(assertCuperativaLabel);
    assertCuperativaLabel(briscola);
    if (!Array.isArray(cardPlayed) || cardPlayed.length > 1) {
      throw new TypeError("cardPlayed must contain at most the opponent lead card");
    }
    cardPlayed.forEach(assertCuperativaLabel);

    this.cards_on_hand = [...cardsOnHand];
    this.card_played = [...cardPlayed];
    this.briscola = briscola;
    this.num_cards_on_deck = Number(numCardsOnDeck);
    this.points_me = Number(pointsMine);
    this.points_opp = Number(pointsOpponent);
    this.target_points = Number(targetPoints);
    this.strozzi_on_suite = {
      b: Number(strozziOnSuite.b ?? 2),
      d: Number(strozziOnSuite.d ?? 2),
      s: Number(strozziOnSuite.s ?? 2),
      c: Number(strozziOnSuite.c ?? 2)
    };
    this.lastRule = null;
    this.lastWeights = null;
  }

  play_like_a_master() {
    switch (this.card_played.length) {
      case 0:
        return this.play_as_master_first();
      case 1:
        return this.play_as_master_second();
      default:
        return this.play_like_a_dummy();
    }
  }

  play_like_a_dummy() {
    this.lastRule = "DUMMY";
    return this.cards_on_hand.pop() ?? null;
  }

  play_as_master_second() {
    const card_avv_s = this.card_played[0];
    const card_avv_info = cuperativaCardInfo(this.card_played[0]);
    let max_points_take = 0;
    let max_card_take = this.cards_on_hand[0];
    let min_card_leave = this.cards_on_hand[0];
    let min_points_leave = 120;
    const take_it = [];
    const leave_it = [];

    for (const card_lbl of this.cards_on_hand) {
      const card_s = card_lbl;
      let bcurr_card_take = false;
      const card_curr_info = cuperativaCardInfo(card_lbl);

      if (card_s[2] === card_avv_s[2]) {
        if (card_curr_info.rank > card_avv_info.rank) {
          bcurr_card_take = true;
          take_it.push(card_lbl);
        } else {
          leave_it.push(card_lbl);
        }
      } else if (card_s[2] === this.briscola[2]) {
        bcurr_card_take = true;
        take_it.push(card_lbl);
      } else {
        leave_it.push(card_lbl);
      }

      const points = card_curr_info.points + card_avv_info.points;
      if (bcurr_card_take) {
        // Preserve the Ruby quirk: ties do not replace max_card_take, and a
        // zero-point capture does not replace the initial hand[0] at all.
        if (points > max_points_take) {
          max_card_take = card_lbl;
          max_points_take = points;
        }
      } else if (points < min_points_leave) {
        min_card_leave = card_lbl;
        min_points_leave = points;
      }
    }

    const tot_points_if_take = this.points_me + max_points_take;

    if (take_it.length === 0) {
      return this.#choose("R1", min_card_leave);
    }

    const max_card_take_s = max_card_take;
    if (tot_points_if_take >= this.target_points) {
      return this.#choose("R2", max_card_take);
    }

    if (max_card_take_s[2] === this.briscola[2]) {
      if (max_points_take >= 20) {
        return this.#choose("R3", max_card_take);
      }
    } else if (max_points_take >= 10 && this.num_cards_on_deck > 1) {
      return this.#choose("R4", max_card_take);
    }

    if (min_points_leave === 0) {
      return this.#choose("R10", min_card_leave);
    }

    if (this.num_cards_on_deck === 1) {
      const lit_brisc = this.briscola[1];
      if (lit_brisc === "A" || lit_brisc === "3") {
        return this.#choose("R9", min_card_leave);
      } else if (lit_brisc === "R" || lit_brisc === "C" || lit_brisc === "F") {
        if (min_points_leave <= 4) {
          return this.#choose("R8", min_card_leave);
        }
      }
    }

    if (take_it.length > 0) {
      if (this.points_opp > 40 && max_points_take > 0) {
        return this.#choose("R5", this.best_taken_card(take_it));
      }

      if (min_points_leave > 3 && take_it.length > 1) {
        return this.#choose("R6", this.best_taken_card(take_it));
      }

      if (min_points_leave > 5) {
        const card_best_taken = this.best_taken_card(take_it);
        const card_best_taken_s = card_best_taken;
        if (card_best_taken_s[2] === this.briscola[2]) {
          if (
            min_points_leave <= 8 &&
            (card_best_taken_s[1] === "A" || card_best_taken_s[1] === "3")
          ) {
            return this.#choose("R12", min_card_leave);
          }
        }
        return this.#choose("R11", card_best_taken);
      }
    }

    return this.#choose("R7", min_card_leave);
  }

  best_taken_card(take_it) {
    const w_cards = [];

    for (const card_lbl of take_it) {
      const card_s = card_lbl;
      let curr_w = 0;

      if (card_s[1] === "A") {
        curr_w += 9;
        if (card_s[2] === this.briscola[2]) curr_w += 200;
      }

      if (card_s[1] === "3") {
        curr_w += 7;
        if (card_s[2] === this.briscola[2]) curr_w += 170;
      }

      if (/[24567]/.test(card_s)) {
        const lisc_val = Number(card_s[1]);
        curr_w += 70 + lisc_val;
        if (card_s[2] === this.briscola[2]) curr_w += 80;
      }

      // Intentional duplicate Jack (`Fante`) contribution from the Ruby original.
      if (card_s[1] === "F") curr_w += 40;

      if (card_s[1] === "C") {
        curr_w += 30;
        if (card_s[2] === this.briscola[2]) curr_w += 140;
      }

      if (card_s[1] === "R") {
        curr_w += 20;
        if (card_s[2] === this.briscola[2]) curr_w += 150;
      }

      if (card_s[1] === "F") {
        curr_w += 40;
        if (card_s[2] === this.briscola[2]) curr_w += 130;
      }

      w_cards.push([card_lbl, curr_w]);
    }

    this.lastWeights = w_cards.map(([card, weight]) => ({ card, weight }));
    return firstMinimum(w_cards)?.[0] ?? null;
  }

  play_as_master_first() {
    const w_cards = [];

    for (const card_lbl of this.cards_on_hand) {
      const card_s = card_lbl;
      const segno = card_s.slice(2, 3);
      let curr_w = 0;

      if (card_s[2] === this.briscola[2]) curr_w += 70;
      if (card_s[1] === "A") curr_w += 220;
      if (card_s[1] === "3") curr_w += 200;

      if (/[24567]/.test(card_s)) {
        const lisc_val = Number(card_s[1]);
        curr_w += 50 + lisc_val;
      }

      if (card_s[1] === "F") curr_w += 60;
      if (card_s[1] === "C") curr_w += 30;
      if (card_s[1] === "R") curr_w += 20;

      curr_w += 25 * this.strozzi_on_suite[segno];

      if (this.num_cards_on_deck === 1) {
        const lit_brisc = this.briscola[1];
        if (card_s[2] === this.briscola[2]) curr_w += 60;

        if (lit_brisc === "A" || lit_brisc === "3") {
          if (card_s[1] === "A") curr_w -= 220;
          if (card_s[1] === "3") curr_w -= 200;
        } else if (lit_brisc === "R" || lit_brisc === "C" || lit_brisc === "F") {
          if (card_s[1] === "A") curr_w -= 180;
          if (card_s[1] === "3" && this.strozzi_on_suite[segno] === 1) curr_w -= 160;
        }
      }

      w_cards.push([card_lbl, curr_w]);
    }

    this.lastWeights = w_cards.map(([card, weight]) => ({ card, weight }));
    const min_list = firstMinimum(w_cards);
    if (min_list) return this.#choose("FIRST_MIN_WEIGHT", min_list[0]);
    return this.play_like_a_dummy();
  }

  #choose(rule, card) {
    this.lastRule = rule;
    return card;
  }
}
