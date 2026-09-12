// SPDX-License-Identifier: GPL-3.0-only
// Derived from smBrisCola 2005-09-27, Copyright (C) 2005 Massimo Masson.
// Upstream license: GPL-2.0-or-later; see THIRD_PARTY_NOTICES.md.
/*
 * Faithful JavaScript port of smBrisCola 2005-09-27 player heuristics.
 *
 * Original source:
 *   briscola_player.py
 *
 * Original copyright:
 *   Copyright (C) 2005 Massimo Masson
 *
 * License:
 *   GNU GPL version 2 or (at your option) any later version.
 *
 * The original Italian method names are preserved to keep the port easy to
 * compare with the upstream Python source. Comments added in this port are in
 * English by project convention.
 */

export class SmBriscolaAI {
  constructor({ method = "Empirico1" } = {}) {
    if (!["Empirico1", "Empirico2"].includes(method)) {
      throw new RangeError(`Unsupported smBrisCola method: ${method}`);
    }
    this.method = method;
    this.lastDecision = null;
  }

  scegliCarta(state) {
    const fn = this[`ScegliCarta_${this.method}`];
    const card = fn.call(this, state);
    const index = state.carte.findIndex((candidate) => candidate === card);
    this.lastDecision = { method: this.method, index, card };
    return index;
  }

  /** Returns true when carta1 beats carta2 under the original rules. */
  Vince(briscola, carta1, carta2) {
    if (carta1.seme !== briscola.seme && carta2.seme === briscola.seme) {
      return true === false;
    }

    if (carta1.seme === carta2.seme) {
      if (carta2.punti > carta1.punti) return false;
      if (carta2.punti === carta1.punti && carta2.valore > carta1.valore) {
        return false;
      }
    }

    return true;
  }

  #weights(state) {
    return state.carte.map((card) => {
      let weight = card.punti * 10 + card.valore;
      if (card.seme === state.briscola.seme) weight += 1000;
      return weight;
    });
  }

  #firstIndex(weights, predicate, better) {
    let found = -1;
    for (let index = 0; index < weights.length; index += 1) {
      if (!predicate(weights[index], index)) continue;
      if (found < 0 || better(index, found)) found = index;
    }
    return found;
  }

  ScegliCarta_Empirico1(state) {
    const weights = this.#weights(state);
    const cards = state.carte;

    if (!state.cartaGiocata) {
      // 1) Point cards that are not trump: play the highest weighted one.
      let found = this.#firstIndex(
        weights,
        (weight) => weight > 10 && weight < 100,
        (index, current) => weights[index] > weights[current]
      );
      if (found >= 0) return cards[found];

      // 2) Zero-point non-trumps: play the highest nominal rank.
      found = this.#firstIndex(
        weights,
        (weight) => weight < 10,
        (index, current) => cards[index].valore > cards[current].valore
      );
      if (found >= 0) return cards[found];

      // 3) Zero-point trumps: play the lowest nominal rank.
      found = this.#firstIndex(
        weights,
        (weight) => weight > 1000 && weight < 1010,
        (index, current) => cards[index].valore < cards[current].valore
      );
      if (found >= 0) return cards[found];

      // 4) Point trumps: play the lowest weighted one.
      found = this.#firstIndex(
        weights,
        (weight) => weight > 1010 && weight < 1100,
        (index, current) => weights[index] < weights[current]
      );
      if (found >= 0) return cards[found];

      // 5) Non-trump loads (Three/Ace): play the highest weighted one.
      found = this.#firstIndex(
        weights,
        (weight) => weight > 100 && weight < 1000,
        (index, current) => weights[index] > weights[current]
      );
      if (found >= 0) return cards[found];

      // 6) Trump loads: play the lowest weighted one.
      found = this.#firstIndex(
        weights,
        (weight) => weight > 1100,
        (index, current) => weights[index] < weights[current]
      );
      if (found >= 0) return cards[found];

      // The upstream random fallback is effectively unreachable with a legal hand.
      return cards[0];
    }

    const played = state.cartaGiocata;

    // 1) Win without trumping, choosing the highest weighted winning card.
    if (played.seme !== state.briscola.seme) {
      const found = this.#firstIndex(
        weights,
        (weight, index) => !this.Vince(state.briscola, played, cards[index]) && weight < 1000,
        (index, current) => weights[index] > weights[current]
      );
      if (found >= 0) return cards[found];
    }

    // 2) Find the cheapest winning trump and use it whenever points are on table.
    let winningTrump = this.#firstIndex(
      weights,
      (weight, index) => !this.Vince(state.briscola, played, cards[index]) && weight > 1000,
      (index, current) => weights[index] < weights[current]
    );
    if (winningTrump >= 0 && played.punti > 0) return cards[winningTrump];

    // 3.1) Lose with the highest nominal zero-point non-trump.
    let found = this.#firstIndex(
      weights,
      (weight) => weight < 10,
      (index, current) => cards[index].valore > cards[current].valore
    );
    if (found >= 0) return cards[found];

    // 3.2) Lose with the lowest point non-trump.
    found = this.#firstIndex(
      weights,
      (weight) => weight > 10 && weight < 100,
      (index, current) => weights[index] < weights[current]
    );
    if (found >= 0) return cards[found];

    // 3.3) Lose with the lowest nominal zero-point trump.
    found = this.#firstIndex(
      weights,
      (weight) => weight > 1000 && weight < 1010,
      (index, current) => cards[index].valore < cards[current].valore
    );
    if (found >= 0) return cards[found];

    // 3.4) Lose with the lowest point trump.
    found = this.#firstIndex(
      weights,
      (weight) => weight > 1010 && weight < 1100,
      (index, current) => weights[index] < weights[current]
    );
    if (found >= 0) return cards[found];

    // 3.5) Lose with the lowest non-trump load.
    found = this.#firstIndex(
      weights,
      (weight) => weight > 100 && weight < 1000,
      (index, current) => weights[index] < weights[current]
    );
    if (found >= 0) return cards[found];

    // 3.6) Lose with the lowest trump load.
    found = this.#firstIndex(
      weights,
      (weight) => weight > 1100,
      (index, current) => weights[index] < weights[current]
    );
    if (found >= 0) return cards[found];

    return cards[0];
  }

  ScegliCarta_Empirico2(state) {
    const weights = this.#weights(state);
    const cards = state.carte;

    if (!state.cartaGiocata) {
      // 1) Zero-point non-trumps: play the highest one.
      let found = this.#firstIndex(
        weights,
        (weight) => weight > 1 && weight < 10,
        (index, current) => weights[index] > weights[current]
      );
      if (found >= 0) return cards[found];

      // 2) Point non-trumps: play the lowest nominal rank.
      found = this.#firstIndex(
        weights,
        (weight) => weight > 10 && weight < 100,
        (index, current) => cards[index].valore < cards[current].valore
      );
      if (found >= 0) return cards[found];

      // 3) Zero-point trumps: play the lowest nominal rank.
      found = this.#firstIndex(
        weights,
        (weight) => weight > 1000 && weight < 1010,
        (index, current) => cards[index].valore < cards[current].valore
      );
      if (found >= 0) return cards[found];

      // 4) Point trumps: play the lowest weighted one.
      found = this.#firstIndex(
        weights,
        (weight) => weight > 1010 && weight < 1100,
        (index, current) => weights[index] < weights[current]
      );
      if (found >= 0) return cards[found];

      // 5) Trump loads have special handling in the original algorithm.
      found = -1;
      let three = -1;
      let ace = -1;
      for (let index = 0; index < weights.length; index += 1) {
        if (weights[index] <= 1100) continue;
        if (found < 0 || weights[index] < weights[found]) found = index;
        if (weights[index] === 1103) three = index;
        else ace = index;
      }
      if (found >= 0) {
        if ((three > -1 && ace > -1) || (three > -1 && state.briscola.punti === 11)) {
          return cards[found];
        }
        if (ace > -1) return cards[ace];
      }

      // 6) Non-trump loads: play the highest weighted one.
      found = this.#firstIndex(
        weights,
        (weight) => weight > 100 && weight < 1000,
        (index, current) => weights[index] > weights[current]
      );
      if (found >= 0) return cards[found];

      return cards[0];
    }

    const played = state.cartaGiocata;
    let possibleNoTrumpWin = -1;
    let possibleTrumpWin = -1;

    // 1) Win without trumping. If the trick is worth zero, remember the move
    // but prefer discarding a zero-point card instead.
    if (played.seme !== state.briscola.seme) {
      const found = this.#firstIndex(
        weights,
        (weight, index) => !this.Vince(state.briscola, played, cards[index]) && weight < 1000,
        (index, current) => weights[index] > weights[current]
      );
      if (found >= 0) {
        if (cards[found].punti > 0 || played.punti > 0) return cards[found];
        possibleNoTrumpWin = found;
      }
    }

    // 2) Find the cheapest winning trump and decide whether the trick is worth it.
    const winningTrump = this.#firstIndex(
      weights,
      (weight, index) => !this.Vince(state.briscola, played, cards[index]) && weight > 1000,
      (index, current) => weights[index] < weights[current]
    );
    if (winningTrump >= 0) {
      if (played.punti >= 10) return cards[winningTrump];
      if (played.punti >= 2 && weights[winningTrump] < 1100) return cards[winningTrump];
      possibleTrumpWin = winningTrump;
    }

    // 3.1) Prefer losing a high nominal zero-point non-trump.
    let found = this.#firstIndex(
      weights,
      (weight) => weight < 10,
      (index, current) => cards[index].valore > cards[current].valore
    );
    if (found >= 0) return cards[found];

    // If discarding would cost points, take the zero-point trick instead.
    if (possibleNoTrumpWin >= 0) return cards[possibleNoTrumpWin];

    // 3.2) Lose the lowest point non-trump.
    found = this.#firstIndex(
      weights,
      (weight) => weight > 10 && weight < 100,
      (index, current) => weights[index] < weights[current]
    );
    if (found >= 0) return cards[found];

    // 3.3) Lose the lowest zero-point trump.
    found = this.#firstIndex(
      weights,
      (weight) => weight > 1000 && weight < 1010,
      (index, current) => cards[index].valore < cards[current].valore
    );
    if (found >= 0) return cards[found];

    // 3.4) Lose the lowest point trump.
    found = this.#firstIndex(
      weights,
      (weight) => weight > 1010 && weight < 1100,
      (index, current) => weights[index] < weights[current]
    );
    if (found >= 0) return cards[found];

    // Prefer spending a remembered winning trump before throwing away a load.
    if (possibleTrumpWin >= 0) return cards[possibleTrumpWin];

    // 3.5) Lose the lowest non-trump load.
    found = this.#firstIndex(
      weights,
      (weight) => weight > 100 && weight < 1000,
      (index, current) => weights[index] < weights[current]
    );
    if (found >= 0) return cards[found];

    // 3.6) Lose the lowest trump load.
    found = this.#firstIndex(
      weights,
      (weight) => weight > 1100,
      (index, current) => weights[index] < weights[current]
    );
    if (found >= 0) return cards[found];

    return cards[0];
  }
}
