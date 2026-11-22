// SPDX-License-Identifier: GPL-3.0-only
// Derived from QBriscola 1.1 (GPL-2.0-or-later); see THIRD_PARTY_NOTICES.md.
/*
 * Faithful JavaScript port of the CPU decision logic from QBriscola 1.1.
 *
 * Original project: QBriscola
 * Copyright (C) 2008 Betti Sorbelli Francesco - Ciotti Roberto
 * Original license: GNU GPL v2 or later (GPL-2.0-or-later)
 * Source reference:
 *   https://sourceforge.net/p/qbriscola/code/HEAD/tree/trunk/src/finestra.cpp
 *
 * This file intentionally preserves the original Italian method names,
 * decision ordering and several implementation quirks. It does not depend on
 * BriscoLab's engine; an adapter will be added separately.
 */

function assertCard(card, label) {
  if (card == null) return;
  for (const key of ["seme", "numero", "priorita", "punteggio"]) {
    if (!(key in card)) {
      throw new TypeError(`${label} is missing '${key}'`);
    }
  }
}

function normalizeHand(mano) {
  if (!Array.isArray(mano) || mano.length > 3) {
    throw new TypeError("mano must be an array with at most 3 slots");
  }
  const normalized = [mano[0] ?? null, mano[1] ?? null, mano[2] ?? null];
  normalized.forEach((card, i) => assertCard(card, `mano[${i}]`));
  return normalized;
}

export class QBriscolaAI {
  constructor() {
    this.mano = [null, null, null];
    this.br = null;
    this.uscite = [];
    this.brUscite = [];
    this.cartaAvversario = null;
    this.mazzoMax = 0;
  }

  /**
   * Minimal API for the pure port. Returns the 0..2 index of the selected card.
   *
   * Expected state (intentionally close to the original C++):
   * {
   *   mano: [Carta|null, Carta|null, Carta|null],
   *   briscola: Carta,
   *   uscite: Carta[],
   *   brUscite: Carta[],
   *   cartaAvversario: Carta|null,
   *   mazzoMax: number
   * }
   */
  scegliCarta(state) {
    this.setState(state);
    return this.cartaAvversario == null
      ? this.giocaComputer()
      : this.rispostaComputer();
  }

  setState({
    mano,
    briscola,
    uscite = [],
    brUscite = [],
    cartaAvversario = null,
    mazzoMax = 0
  }) {
    this.mano = normalizeHand(mano);
    assertCard(briscola, "briscola");
    if (!briscola) throw new TypeError("briscola is required");
    this.br = briscola;

    if (!Array.isArray(uscite) || !Array.isArray(brUscite)) {
      throw new TypeError("uscite and brUscite must be arrays");
    }
    uscite.forEach((card, i) => assertCard(card, `uscite[${i}]`));
    brUscite.forEach((card, i) => assertCard(card, `brUscite[${i}]`));
    assertCard(cartaAvversario, "cartaAvversario");

    this.uscite = uscite;
    this.brUscite = brUscite;
    this.cartaAvversario = cartaAvversario;
    this.mazzoMax = Number(mazzoMax);
  }

  // Port of Finestra::giocaComputer().
  giocaComputer() {
    if (this.mano.every((card) => card == null)) return -1;

    const minBr = this.cercaMinBriscola();
    const minPr = this.cercaMinPriorita();
    const numBr = this.contaBriscole();
    const maxPr = this.cercaMaxPriorita();
    const cartaBuona = this.cercaCartaBuona();
    const cartaLibera = this.cercaCartaLibera();
    const cartaSemiLibera = this.cercaCartaSemiLibera();
    const caricoLibero = this.cercaCaricoLibero();

    // Last hand before the exposed trump is drawn.
    if (this.mazzoMax === 1 && this.br.punteggio >= 10) {
      if (numBr < 3) {
        // Play a high-point card because a strong trump is exposed.
        return maxPr;
      }
      return minBr;
    }

    if (
      maxPr !== -1 &&
      this.brUscite.length + numBr === 9 &&
      this.mazzoMax >= 1 &&
      this.mano[maxPr].punteggio === 11
    ) {
      // Play an Ace because the opponent cannot hold any trump cards.
      return maxPr;
    }

    if (
      this.brUscite.length + numBr === 9 &&
      this.mazzoMax >= 1 &&
      caricoLibero !== -1
    ) {
      // Play a free Three because the opponent cannot hold any trump cards.
      return caricoLibero;
    }

    if (
      maxPr !== -1 &&
      this.brUscite.length + numBr === 10 &&
      this.mazzoMax === 0 &&
      this.mano[maxPr].punteggio === 11
    ) {
      // Final phase: play an Ace because the opponent has no trump cards.
      return maxPr;
    }

    if (
      this.brUscite.length + numBr === 10 &&
      this.mazzoMax === 0 &&
      caricoLibero !== -1
    ) {
      // Final phase: play a free Three because the opponent has no trump cards.
      return caricoLibero;
    }

    if (cartaBuona !== -1) {
      // A good card exists: it is the highest remaining card of that suit.
      return cartaBuona;
    }

    if (cartaLibera !== -1) {
      // Both the Three and Ace of that suit are already accounted for.
      return cartaLibera;
    }

    if (cartaSemiLibera !== -1) {
      // One high-point card of that suit is already accounted for.
      return cartaSemiLibera;
    }

    if (minPr === -1) {
      // If every card in hand is trump, play the weakest trump.
      return minBr;
    }

    if (this.mano[minPr].punteggio <= 4) {
      return minPr;
    }

    // If a high-point card must be played, consider how many trumps are held.
    if (numBr > 1) {
      return minBr;
    }

    if (numBr === 1 && this.mano[minBr].punteggio < 10) {
      return minBr;
    }

    // With no trumps available, a high-point card must be played carefully.
    if (caricoLibero === -1) {
      if (this.mano[maxPr].punteggio === 10) {
        // Only Threes are available among the high-point cards; play one.
        return minPr;
      }
      // An Ace is available; play it.
      return maxPr;
    }

    // Play a Three whose Ace is already out or held in the same hand.
    return caricoLibero;
  }

  // Port of Finestra::rispostaComputer().
  rispostaComputer() {
    const minBr = this.cercaMinBriscola();
    const minPr = this.cercaMinPriorita();
    const maxSeme = this.cercaMaxCartaStessoSeme();
    const numBr = this.contaBriscole();
    const ammBr = this.ammazzaBriscola();
    let cons = -1;
    if (minBr !== -1) cons = this.cercaBriscolaConsecutive(minBr);

    if (this.mazzoMax === 1 && this.br.punteggio >= 10) {
      // Last hand before the exposed trump is drawn.
      if (numBr < 3) {
        if (maxSeme !== -1 && this.mano[maxSeme].punteggio >= 10) {
          return maxSeme;
        }
        if (this.mano[minPr].punteggio < 10) {
          return minPr;
        }
        if (minBr !== -1) return cons;
        return minPr;
      }
      return cons;
    }

    if (this.isBriscola()) {
      // The opponent played a trump: try to discard cheaply.
      if (minPr === -1) {
        // Every card in hand is a trump.
        if (ammBr === -1) return minBr;
        return ammBr;
      }

      // The computer also has at least one non-trump card.
      if (this.mano[minPr].punteggio >= 10) {
        // A high-point card would otherwise be given away.
        if (numBr >= 2) {
          if (this.mano[minBr].priorita > this.cartaAvversario.priorita) {
            return cons;
          }
          return minBr;
        }

        if (numBr === 1 && this.mano[minBr].punteggio < 10) {
          return minBr;
        }

        // With one trump or only high-point cards left, give away a high-point card.
        if (minBr !== -1) {
          if (this.mano[minBr].punteggio <= 4) return minBr;
          return minPr;
        }
        return minPr;
      }

      // If only 0, 2, 3, or 4 points are at risk, discard them.
      return minPr;
    }

    // The opponent did not play a trump.
    if (maxSeme !== -1) {
      // The computer can beat the opponent with a higher card of the same suit.
      if (this.mano[maxSeme].punteggio > 0) return maxSeme;
      return minPr;
    }

    // The computer cannot beat the opponent with a higher card of the same suit.
    if (this.cartaAvversario.punteggio >= 10) {
      // The opponent played a high-point card.
      if (minBr !== -1) return cons;
      return minPr;
    }

    if (
      this.cartaAvversario.punteggio === 4 ||
      this.cartaAvversario.punteggio === 3
    ) {
      // The opponent played either a King or a Knight.
      if (minPr === -1) return cons;

      if (this.mano[minPr].punteggio >= 10) {
        if (minBr !== -1) return cons;
        return minPr;
      }

      if (this.mano[minPr].punteggio >= 3) {
        if (numBr >= 2) return cons;
        return minPr;
      }

      if (this.mano[minPr].punteggio <= 2) return minPr;
    }

    if (this.cartaAvversario.punteggio <= 2) {
      // The opponent played either a Jack or a low-value discard.
      if (minPr === -1) return cons;

      if (this.mano[minPr].punteggio <= 4) return minPr;

      // If a high-point card would be lost instead, consider using a trump.
      if (minBr === -1) return minPr;
      if (this.mano[cons].punteggio >= 10) return minPr;
      return cons;
    }

    // The original C++ covers every possible point value; this guard prevents
    // undefined when the supplied state is malformed.
    return minPr !== -1 ? minPr : minBr;
  }

  // Helper methods used by the computer response logic.

  cercaBriscolaConsecutive(minBr) {
    let cons = minBr;
    const nBr = this.contaBriscole();

    if (nBr === 1) return minBr;

    for (let i = 0; i < 3; i += 1) {
      const card = this.mano[i];
      if (card == null) continue;
      if (card.seme !== this.br.seme) continue;
      if (card.priorita <= this.mano[cons].priorita) continue;

      let count = 0;
      const min = this.mano[cons].priorita;
      const succ = card.priorita;

      // Check every trump card already played.
      for (const uscita of this.brUscite) {
        if (uscita.priorita > min && uscita.priorita < succ) count += 1;
      }

      // Also check the cards currently held.
      for (const propria of this.mano) {
        if (
          propria != null &&
          propria.seme === this.br.seme &&
          propria.priorita > min &&
          propria.priorita < succ
        ) {
          count += 1;
        }
      }

      if (count === succ - min - 1) cons = i;
    }

    return cons;
  }

  cercaCaricoLibero() {
    for (let i = 0; i < 3; i += 1) {
      const card = this.mano[i];
      if (card == null) continue;
      const pr = card.priorita;

      if (card.seme !== this.br.seme && pr === 9) {
        let count = 0;

        for (const uscita of this.uscite) {
          if (uscita.priorita >= 9 && uscita.seme === card.seme) count += 1;
        }

        for (const propria of this.mano) {
          if (
            propria != null &&
            propria.priorita >= 9 &&
            propria.seme === card.seme
          ) {
            count += 1;
          }
        }

        if (count === 2) return i;
      }
    }

    return -1;
  }

  cercaCartaLibera() {
    for (let i = 0; i < 3; i += 1) {
      const card = this.mano[i];
      if (card == null) continue;
      const pr = card.priorita;

      if (card.seme !== this.br.seme && pr < 9) {
        let count = 0;

        for (const uscita of this.uscite) {
          if (uscita.priorita >= 9 && uscita.seme === card.seme) count += 1;
        }

        for (const propria of this.mano) {
          if (
            propria != null &&
            propria.priorita >= 9 &&
            propria.seme === card.seme
          ) {
            count += 1;
          }
        }

        if (2 - count === 0) return i;
      }
    }

    return -1;
  }

  cercaCartaSemiLibera() {
    for (let i = 0; i < 3; i += 1) {
      const card = this.mano[i];
      if (card == null) continue;
      const pr = card.priorita;

      if (card.seme !== this.br.seme && pr < 9) {
        let count = 0;

        for (const uscita of this.uscite) {
          if (uscita.priorita >= 9 && uscita.seme === card.seme) count += 1;
        }

        for (const propria of this.mano) {
          if (
            propria != null &&
            propria.priorita >= 9 &&
            propria.seme === card.seme
          ) {
            count += 1;
          }
        }

        if (1 - count === 0) return i;
      }
    }

    return -1;
  }

  cercaCartaBuona() {
    for (let i = 0; i < 3; i += 1) {
      const card = this.mano[i];
      if (card == null) continue;
      const pr = card.priorita;

      if (card.seme !== this.br.seme && pr < 9) {
        let count = 0;

        // Check every card already played.
        for (const uscita of this.uscite) {
          if (uscita.priorita > pr && uscita.seme === card.seme) count += 1;
        }

        // Also check the cards currently held.
        for (const propria of this.mano) {
          if (
            propria != null &&
            propria.priorita > pr &&
            propria.seme === card.seme
          ) {
            count += 1;
          }
        }

        if (10 - count === pr) return i;
      }
    }

    return -1;
  }

  // Beat the opponent's trump with the cheapest possible higher trump.
  ammazzaBriscola() {
    let carta = -1;
    let pr = 12;

    for (let i = 0; i < 3; i += 1) {
      const card = this.mano[i];
      if (card == null) continue;
      if (
        card.seme === this.br.seme &&
        card.priorita < pr &&
        card.priorita > this.cartaAvversario.priorita
      ) {
        pr = card.priorita;
        carta = i;
      }
    }

    return carta;
  }

  // Return the index of the strongest trump, or -1 if none exists.
  cercaMaxBriscola() {
    let carta = -1;
    let pr = -1;

    for (let i = 0; i < 3; i += 1) {
      const card = this.mano[i];
      if (card != null && card.seme === this.br.seme && card.priorita > pr) {
        pr = card.priorita;
        carta = i;
      }
    }

    return carta;
  }

  contaBriscole() {
    let n = 0;
    for (const card of this.mano) {
      if (card != null && card.seme === this.br.seme) n += 1;
    }
    return n;
  }

  // Return the weakest non-trump card.
  cercaMinPriorita() {
    let pr = 12;
    let carta = -1;

    for (let i = 0; i < 3; i += 1) {
      const card = this.mano[i];
      if (card != null && card.priorita < pr && card.seme !== this.br.seme) {
        pr = card.priorita;
        carta = i;
      }
    }

    return carta;
  }

  cercaMaxPriorita() {
    let pr = -1;
    let carta = -1;

    for (let i = 0; i < 3; i += 1) {
      const card = this.mano[i];
      if (card != null && card.priorita > pr && card.seme !== this.br.seme) {
        pr = card.priorita;
        carta = i;
      }
    }

    return carta;
  }

  // Return the index of the weakest trump, or -1 if none exists.
  cercaMinBriscola() {
    let min = 12;
    let carta = -1;

    for (let i = 0; i < 3; i += 1) {
      const card = this.mano[i];
      if (card != null && card.seme === this.br.seme && card.priorita < min) {
        min = card.priorita;
        carta = i;
      }
    }

    return carta;
  }

  isBriscola() {
    return this.cartaAvversario.seme === this.br.seme;
  }

  // Return a higher card of the same suit than the opponent's card, if available.
  cercaMaxCartaStessoSeme() {
    let max = this.cartaAvversario.priorita;
    let carta = -1;

    for (let i = 0; i < 3; i += 1) {
      const card = this.mano[i];
      if (
        card != null &&
        card.seme === this.cartaAvversario.seme &&
        card.priorita > max
      ) {
        max = card.priorita;
        carta = i;
      }
    }

    return carta;
  }
}
