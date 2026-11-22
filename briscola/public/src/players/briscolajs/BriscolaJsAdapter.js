// SPDX-License-Identifier: GPL-3.0-only
import { BriscolaJsAI } from "./BriscolaJsAI.js";

const META = Object.freeze({
  S0: Object.freeze({ id: "briscolajs-s0", name: "Briscola.js S0" }),
  S1: Object.freeze({ id: "briscolajs-s1", name: "Briscola.js S1" })
});

/** Behavioral reconstruction of Calogero Miraglia's 2015 demo strategies. */
export class BriscolaJsAdapter {
  constructor({ strategy = "S1" } = {}) {
    this.strategy = String(strategy).toUpperCase();
    const meta = META[this.strategy];
    if (!meta) throw new Error(`Unknown Briscola.js strategy '${strategy}'`);
    this.id = meta.id;
    this.name = meta.name;
    this.ai = new BriscolaJsAI({ strategy: this.strategy });
  }

  reset() {}

  async chooseAction(observation) {
    if (!observation?.isMyTurn) throw new Error(`${this.name} received an observation outside its turn`);
    if (!observation.hand?.length) throw new Error(`${this.name} received an empty hand`);
    const card = this.ai.chooseCard(observation);
    return {
      type: "PLAY_CARD",
      cardId: card.id,
      debug: {
        source: "calogxro/briscola.js public demo bundle",
        strategy: this.strategy,
        algorithm: this.strategy === "S1" && observation.trickNumber >= 18
          ? "alpha-beta endgame"
          : "S0 heuristic"
      }
    };
  }
}

export class BriscolaJsS0Adapter extends BriscolaJsAdapter {
  constructor(options = {}) { super({ ...options, strategy: "S0" }); }
}

export class BriscolaJsS1Adapter extends BriscolaJsAdapter {
  constructor(options = {}) { super({ ...options, strategy: "S1" }); }
}
