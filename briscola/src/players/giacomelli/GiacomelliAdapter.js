// SPDX-License-Identifier: GPL-3.0-only
import { GiacomelliPolicy } from "./GiacomelliPolicy.js";

const META = Object.freeze({
  G: { id: "giacomelli-pig", name: "πG Greedy" },
  H: { id: "giacomelli-pih", name: "πH Hoarder" },
  C: { id: "giacomelli-pic", name: "πC Counter" }
});

/** Adapter for Giacomelli's deterministic πG/πH/πC policies. */
export class GiacomelliAdapter {
  constructor({ policy = "G", name = null } = {}) {
    this.policyCode = String(policy).toUpperCase();
    const meta = META[this.policyCode];
    if (!meta) throw new Error(`Unknown Giacomelli policy '${policy}'`);
    this.id = meta.id;
    this.name = name ?? meta.name;
    this.policy = new GiacomelliPolicy({ policy: this.policyCode });
    this.reset();
  }

  reset() {
    // πC's public memory contains the initially exposed briscola even after
    // that card is eventually drawn from the stock.
    this.initialVisibleTrump = null;
  }

  async chooseAction(observation) {
    if (!observation?.isMyTurn) {
      throw new Error(`${this.name} received an observation outside its turn`);
    }
    if (!Array.isArray(observation.hand) || observation.hand.length === 0) {
      throw new Error(`${this.name} received an empty hand`);
    }

    if (!this.initialVisibleTrump && observation.visibleTrump) {
      this.initialVisibleTrump = { ...observation.visibleTrump };
    }

    const lead = observation.table[0]?.card ?? null;
    const memoryById = new Map();
    if (this.initialVisibleTrump) memoryById.set(this.initialVisibleTrump.id, this.initialVisibleTrump);
    for (const card of observation.playedCards ?? []) memoryById.set(card.id, card);

    const chosenCard = this.policy.chooseCard({
      hand: observation.hand,
      lead,
      trumpSuit: observation.trumpSuit,
      memory: [...memoryById.values()]
    });

    return {
      type: "PLAY_CARD",
      cardId: chosenCard.id,
      debug: {
        source: "pgiacome/BriscolaPaperSourceCode",
        policy: `π${this.policyCode}`,
        algorithm: META[this.policyCode].name
      }
    };
  }
}

export class PiGAdapter extends GiacomelliAdapter {
  constructor(options = {}) { super({ ...options, policy: "G" }); }
}
export class PiHAdapter extends GiacomelliAdapter {
  constructor(options = {}) { super({ ...options, policy: "H" }); }
}
export class PiCAdapter extends GiacomelliAdapter {
  constructor(options = {}) { super({ ...options, policy: "C" }); }
}
