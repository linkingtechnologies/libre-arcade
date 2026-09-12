// SPDX-License-Identifier: GPL-3.0-only
import {
  CardFrameworkAI,
  appendAndBubbleRefill,
  insertInitialCard
} from "./CardFrameworkAI.js";

const META = Object.freeze([
  { id: "cardframework-cpu0", name: "CardFramework Cpu0", level: 0 },
  { id: "cardframework-cpu1", name: "CardFramework Cpu1", level: 1 },
  { id: "cardframework-cpu2", name: "CardFramework Cpu2", level: 2 }
]);

/** Adapter for CardFramework.Maui 1.6.20 GiocatoreHelperCpu0/1/2. */
export class CardFrameworkAdapter {
  constructor({ level = 0, name = null, randomSeed = 0x4346524d } = {}) {
    const meta = META[level];
    if (!meta) throw new RangeError("CardFramework level must be 0, 1 or 2");
    this.level = level;
    this.id = meta.id;
    this.name = name ?? meta.name;
    this.randomSeed = randomSeed >>> 0;
    this.reset();
  }

  reset() {
    this.ai = null;
    this.trumpSuit = null;
    this.legacyHand = [];
    this.initializedHand = false;
  }

  ensureAI(observation) {
    if (this.ai) return;
    this.trumpSuit = observation.trumpSuit;
    this.ai = new CardFrameworkAI({
      level: this.level,
      trumpSuit: this.trumpSuit,
      randomSeed: this.randomSeed
    });
  }

  syncLegacyHand(observation) {
    const visibleById = new Map(observation.hand.map((card) => [card.id, card]));

    if (!this.initializedHand) {
      this.legacyHand = [];
      for (const card of observation.hand) {
        insertInitialCard(this.legacyHand, card, this.trumpSuit);
      }
      this.initializedHand = true;
      return;
    }

    // Remove cards played since the previous decision while retaining the
    // upstream hand ordering of survivors.
    this.legacyHand = this.legacyHand.filter((card) => visibleById.has(card.id));
    const known = new Set(this.legacyHand.map((card) => card.id));

    // BriscoLab appends newly drawn cards to the observation hand. CardFramework
    // appends each refill and then bubbles it left through the sorted hand.
    for (const card of observation.hand) {
      if (!known.has(card.id)) {
        appendAndBubbleRefill(this.legacyHand, card, this.trumpSuit);
        known.add(card.id);
      }
    }

    // Refresh card objects from the current observation without changing order.
    this.legacyHand = this.legacyHand.map((card) => visibleById.get(card.id) ?? card);
  }

  async chooseAction(observation) {
    if (!observation?.isMyTurn) {
      throw new Error(`${this.name} received an observation outside its turn`);
    }
    if (!Array.isArray(observation.hand) || observation.hand.length === 0) {
      throw new Error(`${this.name} received an empty hand`);
    }

    this.ensureAI(observation);
    this.syncLegacyHand(observation);

    const lead = observation.table[0]?.card ?? null;
    const chosenIndex = this.ai.chooseIndex({ hand: this.legacyHand, lead });
    const chosenCard = this.legacyHand[chosenIndex];
    if (!chosenCard || !observation.hand.some((card) => card.id === chosenCard.id)) {
      throw new Error(`${this.name} returned invalid hand index ${chosenIndex}`);
    }

    return {
      type: "PLAY_CARD",
      cardId: chosenCard.id,
      debug: {
        source: "CardFramework.Maui 1.6.20",
        upstreamClass: `GiocatoreHelperCpu${this.level}`,
        level: this.level + 1,
        chosenIndex,
        legacyHand: this.legacyHand.map((card) => card.id)
      }
    };
  }
}

export class CardFrameworkCpu0Adapter extends CardFrameworkAdapter {
  constructor(options = {}) { super({ ...options, level: 0 }); }
}
export class CardFrameworkCpu1Adapter extends CardFrameworkAdapter {
  constructor(options = {}) { super({ ...options, level: 1 }); }
}
export class CardFrameworkCpu2Adapter extends CardFrameworkAdapter {
  constructor(options = {}) { super({ ...options, level: 2 }); }
}
