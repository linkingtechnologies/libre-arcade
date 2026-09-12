// SPDX-License-Identifier: GPL-3.0-only
// Derived from JBriscola 0.3.1 (GPL-3.0); see THIRD_PARTY_NOTICES.md.
import {
  JBRISCOLA_COMPARISON,
  compareJBriscolaCards,
  getJBriscolaPoints,
  getJBriscolaSuit
} from "./JBriscolaCard.js";
import { JavaRandom } from "./JavaRandom.js";

/**
 * Faithful JavaScript port of JBriscola 0.3.1 GiocatoreHelperCpu.
 *
 * Original Italian method names are intentionally preserved where practical
 * so this file can be compared directly with the upstream Java source.
 */
export class JBriscolaAI {
  constructor({ briscola, random = new JavaRandom() } = {}) {
    if (!Number.isInteger(briscola) || briscola < 0 || briscola > 39) {
      throw new RangeError("briscola must be a JBriscola card number from 0 to 39");
    }
    this.briscola = briscola;
    this.rand = random;
  }

  getBriscola(mano) {
    let i = 0;
    while (i < mano.length && !this.stessoSeme(this.briscola, mano[i])) i += 1;
    return i;
  }

  GetSoprataglio(mano, carta, maggiore) {
    let found = false;
    let i;

    if (maggiore) {
      for (i = mano.length - 1; i > -1; i -= 1) {
        if (
          this.stessoSeme(carta, mano[i]) &&
          compareJBriscolaCards(carta, mano[i], this.briscola) ===
            JBRISCOLA_COMPARISON.SECOND_GREATER
        ) {
          found = true;
          break;
        } else if (
          this.stessoSeme(carta, mano[i]) &&
          compareJBriscolaCards(carta, mano[i], this.briscola) ===
            JBRISCOLA_COMPARISON.FIRST_GREATER
        ) {
          break;
        }
      }
    } else {
      for (i = 0; i < mano.length; i += 1) {
        if (
          this.stessoSeme(carta, mano[i]) &&
          compareJBriscolaCards(carta, mano[i], this.briscola) ===
            JBRISCOLA_COMPARISON.SECOND_GREATER
        ) {
          found = true;
          break;
        }
      }
    }

    return found ? i : mano.length;
  }

  /** Faithful equivalent of Gioca(Vector<Carta> mano, int iCarta). */
  GiocaPrimo(mano) {
    let i;
    for (
      i = mano.length - 1;
      i > -1 && (getJBriscolaPoints(mano[i]) > 5 || this.stessoSeme(this.briscola, mano[i]));
      i -= 1
    );

    if (i < 0 || i > mano.length) i = 0;
    return i;
  }

  /** Faithful equivalent of Gioca(Vector<Carta> mano, Carta c, int i). */
  GiocaRisposta(mano, cartaAvversario) {
    let i = this.rand.nextInt();

    if (!this.stessoSeme(this.briscola, cartaAvversario)) {
      i = this.GetSoprataglio(mano, cartaAvversario, true);
      if (i < mano.length) return i;

      i = this.getBriscola(mano);
      if (getJBriscolaPoints(cartaAvversario) > 0 && i < mano.length) {
        if (getJBriscolaPoints(cartaAvversario) > 4) return i;
        if (getJBriscolaPoints(mano[i]) > 0) {
          // This intentionally uses the hand index, just like the Java source.
          // The initial random integer has already been overwritten here.
          if (i % 10 < 5) return i;
        }
      }
    } else {
      // Java and JavaScript both keep the dividend sign for integer remainder,
      // so this preserves the original nextInt() % 10 < 5 quirk.
      if (i % 10 < 5) {
        i = this.GetSoprataglio(mano, cartaAvversario, false);
        if (i < mano.length) return i;
      }
    }

    return 0;
  }

  scegliCarta({ mano, cartaAvversario = null } = {}) {
    if (!Array.isArray(mano) || mano.length < 1 || mano.length > 3) {
      throw new TypeError("mano must contain 1 to 3 JBriscola card numbers");
    }
    if (cartaAvversario === null) return this.GiocaPrimo(mano);
    return this.GiocaRisposta(mano, cartaAvversario);
  }

  stessoSeme(first, second) {
    return getJBriscolaSuit(first) === getJBriscolaSuit(second);
  }
}
