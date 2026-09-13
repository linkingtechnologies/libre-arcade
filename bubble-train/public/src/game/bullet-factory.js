// SPDX-License-Identifier: GPL-3.0-or-later
import { Bubble, SPECIAL } from './bubble.js';

const MAX_COLOUR = 5;
const SLOT_NORMAL_SFX = 5;
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

/** Source-faithful availability-count semantics for cannon ammunition. */
export class BulletFactory {
  constructor({ colourCount = 3, explicit = [] } = {}, rng) {
    if (!rng) throw new Error('BulletFactory requires an RNG');
    this.rng = rng;
    this.colourCount = colourCount;
    this.slots = new Array(10).fill(0);
    for (let i = 0; i < MAX_COLOUR; i++) this.slots[i] = i < colourCount ? -1 : 0;
    this.slots[SLOT_NORMAL_SFX] = 0;

    for (const spec of explicit ?? []) this.addSpec(spec);
    this.slots[SLOT_NORMAL_SFX] = 0;
  }

  addSpec(spec) {
    const number = Number(spec.number ?? 1);
    const type = String(spec.type ?? '').toLowerCase();
    const isSpecial = isTruthy(spec.special);
    if (isSpecial) {
      const special = normalizeSpecial(type);
      const slot = SLOT_BY_SPECIAL[special];
      if (slot != null) this.slots[slot] += number;
      return;
    }
    const colour = normalizeColour(type, spec.colour);
    if (colour >= 0 && colour < MAX_COLOUR) this.slots[colour] += number;
  }

  nextBubble({ nowMs = 0 } = {}) {
    const available = this.slots.some(v => v !== 0);
    if (!available) return null;

    let slot;
    do slot = this.rng.nextInt(this.slots.length); while (this.slots[slot] === 0);
    this.slots[slot] -= 1;

    let bubble;
    if (slot >= MAX_COLOUR) {
      const special = SPECIAL_BY_SLOT[slot];
      if (!special) throw new Error(`Invalid source bullet slot ${slot}`);
      bubble = Bubble.special(special, this.rng, { nowMs });
    } else {
      bubble = Bubble.normal(slot);
    }
    bubble.setMaxColour(this.colourCount);
    return bubble;
  }
}

export function normalizeSpecial(value) {
  const type = String(value ?? '').toLowerCase();
  if (type.includes('rainbow')) return SPECIAL.RAINBOW;
  if (type.includes('speed')) return SPECIAL.SPEED;
  if (type.includes('colour') || type.includes('color')) return SPECIAL.COLOUR_BOMB;
  if (type.includes('bomb')) return SPECIAL.BOMB;
  return SPECIAL.NORMAL;
}

export function normalizeColour(value, fallback = 0) {
  const type = String(value ?? '').toLowerCase();
  if (/^\d+$/.test(type)) return Number(type);
  const names = { blue: 0, red: 1, green: 2, yellow: 3, orange: 4 };
  if (type in names) return names[type];
  const match = type.match(/col_(blue|red|green|yellow|orange)/);
  return match ? names[match[1]] : Number(fallback ?? 0);
}

export function isTruthy(value) {
  return value === true || value === 1 || value === '1' || String(value ?? '').toLowerCase() === 'true';
}
