// SPDX-License-Identifier: GPL-3.0-or-later
import { Bubble, SPECIAL } from './bubble.js';
import { isTruthy, normalizeColour, normalizeSpecial } from './bullet-factory.js';

const MAX_COLOUR = 5;
const SLOT_BY_SPECIAL = Object.freeze({
  [SPECIAL.RAINBOW]: 6,
  [SPECIAL.SPEED]: 7,
  [SPECIAL.BOMB]: 8,
  [SPECIAL.COLOUR_BOMB]: 9
});
const SPECIAL_BY_SLOT = Object.freeze({
  6: SPECIAL.RAINBOW,
  7: SPECIAL.SPEED,
  8: SPECIAL.BOMB,
  9: SPECIAL.COLOUR_BOMB
});

export class CarriageFactory {
  constructor({ colourCount = 3, count = 0, random = true, explicit = [] } = {}, rng) {
    if (!rng) throw new Error('CarriageFactory requires an RNG');
    this.colourCount = colourCount;
    this.random = random;
    this.rng = rng;
    this.returned = [];
    this.queue = [];

    if (random) this.buildRandom(count, explicit);
    else this.buildSetSequence(explicit);
  }

  get empty() { return this.returned.length === 0 && this.queue.length === 0; }

  prepend(bubble) {
    this.returned.unshift(bubble.clone ? bubble.clone() : bubble);
  }

  nextBubble() {
    if (this.returned.length) return this.returned.shift();
    return this.queue.shift() ?? null;
  }

  buildSetSequence(explicit) {
    for (const spec of explicit ?? []) {
      const number = Number(spec.number ?? 1);
      for (let i = 0; i < number; i++) {
        // The original non-random path only supports colours. We accept special
        // specs here for robustness but distributed levels use random mode.
        if (isTruthy(spec.special)) this.queue.push(Bubble.special(normalizeSpecial(spec.type), this.rng));
        else this.queue.push(Bubble.normal(normalizeColour(spec.type, spec.colour)));
      }
    }
  }

  buildRandom(requestedCount, explicit) {
    const slots = new Array(10).fill(0);
    for (let i = 0; i < slots.length; i++) slots[i] = i < this.colourCount ? -1 : 0;

    let totalNormal = 0;
    for (const spec of explicit ?? []) {
      const number = Number(spec.number ?? 1);
      if (isTruthy(spec.special)) {
        const slot = SLOT_BY_SPECIAL[normalizeSpecial(spec.type)];
        if (slot != null) slots[slot] += number;
      } else {
        const colour = normalizeColour(spec.type, spec.colour);
        if (colour >= 0 && colour < MAX_COLOUR) {
          slots[colour] += number;
          totalNormal += number;
        }
      }
    }

    let count = Number(requestedCount);
    if (!Number.isFinite(count) || count < 0) throw new Error('Random carriage count must be finite');
    if (count === 0) count = totalNormal;
    if (count === 0) return;

    for (let i = 0; i < count; i++) {
      let bubble;
      let slot;
      do {
        do slot = this.rng.nextInt(slots.length); while (slots[slot] === 0);
        if (slot > MAX_COLOUR) bubble = Bubble.special(SPECIAL_BY_SLOT[slot], this.rng);
        else bubble = Bubble.normal(slot);
      } while (!this.colourAllowed(bubble.colour));

      slots[slot] -= 1;
      this.queue.push(bubble);
    }
  }

  colourAllowed(colour) {
    if (this.queue.length < 2) return true;
    const a = this.queue[this.queue.length - 1].colour;
    const b = this.queue[this.queue.length - 2].colour;
    return a !== colour || b !== colour;
  }
}
