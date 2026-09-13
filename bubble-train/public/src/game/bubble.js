// SPDX-License-Identifier: GPL-3.0-or-later

export const SPECIAL = Object.freeze({
  NORMAL: 'normal',
  RAINBOW: 'rainbow',
  SPEED: 'speed',
  BOMB: 'bomb',
  COLOUR_BOMB: 'colour-bomb'
});

export const SOURCE_MAX_COLOURS = 5;

/**
 * Clean-room model of the original Bubble class.
 * Timing deliberately follows the source quirks rather than the comments.
 */
export class Bubble {
  constructor({
    colour = 1,
    special = SPECIAL.NORMAL,
    speedAdjustment = 1,
    maxColours = 0,
    effectLife = 0,
    endTimeMs = 0,
    timerEnabled = false
  } = {}) {
    this.colour = colour;
    this.special = special;
    this.speedAdjustment = speedAdjustment;
    this.maxColours = maxColours;
    this.effectLife = effectLife;
    this.endTimeMs = endTimeMs;
    this.timerEnabled = timerEnabled;
  }

  static normal(colour = 0) {
    return new Bubble({ colour, special: SPECIAL.NORMAL, speedAdjustment: 1 });
  }

  static special(type, rng, { nowMs = 0, maxColours = null } = {}) {
    const bubble = new Bubble({ colour: 1, special: type, speedAdjustment: 1 });

    if (type === SPECIAL.RAINBOW) {
      bubble.maxColours = maxColours ?? SOURCE_MAX_COLOURS;
    } else if (type === SPECIAL.SPEED) {
      if (!rng) throw new Error('Speed bubbles require an RNG');
      // Source macro: #define random(a) ((a) * rand() / RAND_MAX)
      // All operands are integers there, so the pre-subtraction result is 0..3.
      const scaled = sourceIntegerScaledRandom(rng, 3);
      bubble.speedAdjustment = scaled - 1.5;
      bubble.effectLife = Math.trunc(5 / Math.abs(bubble.speedAdjustment));
      if (bubble.effectLife > 10) bubble.effectLife = 10;
      bubble.endTimeMs = nowMs + bubble.effectLife * 1000;
      // Carriage-created speed bubbles do not start their timer until they are
      // inserted from a projectile; station-generated ones therefore persist.
      bubble.timerEnabled = false;
      if (maxColours != null) bubble.maxColours = maxColours;
    } else if (maxColours != null) {
      bubble.maxColours = maxColours;
    }

    return bubble;
  }

  clone() {
    return new Bubble({
      colour: this.colour,
      special: this.special,
      speedAdjustment: this.speedAdjustment,
      maxColours: this.maxColours,
      effectLife: this.effectLife,
      endTimeMs: this.endTimeMs,
      timerEnabled: this.timerEnabled
    });
  }

  setMaxColour(maxColours) {
    this.maxColours = Number(maxColours) || 0;
  }

  resetToNormal() {
    this.special = SPECIAL.NORMAL;
    this.speedAdjustment = 1;
  }

  startTimer(nowMs = 0) {
    this.timerEnabled = true;
    this.endTimeMs = nowMs + this.effectLife * 1000;
  }

  animate({ nowMs = 0, rng } = {}) {
    if (this.special === SPECIAL.RAINBOW) {
      // Exact source behavior: effectLife starts at 0, the post-decrement test
      // resets it to 15, so subsequent colour changes occur every 16 calls.
      const before = this.effectLife;
      this.effectLife -= 1;
      if (before <= 0) {
        if (!rng) throw new Error('Rainbow animation requires an RNG');
        const colours = this.maxColours || SOURCE_MAX_COLOURS;
        this.colour = rng.nextInt(colours);
        this.effectLife = 15;
        return { changedColour: true, expired: false };
      }
      return { changedColour: false, expired: false };
    }

    if (this.special === SPECIAL.SPEED && this.timerEnabled) {
      this.effectLife = Math.trunc((this.endTimeMs - nowMs) / 1000);
      if (this.effectLife <= 0) {
        if (!rng) throw new Error('Speed expiry requires an RNG');
        const colours = this.maxColours || SOURCE_MAX_COLOURS;
        this.resetToNormal();
        this.colour = rng.nextInt(colours);
        return { changedColour: true, expired: true };
      }
    }

    return { changedColour: false, expired: false };
  }
}

function sourceIntegerScaledRandom(rng, scale) {
  if (typeof rng.nextUint32 === 'function') {
    const raw = rng.nextUint32();
    return Math.floor((scale * raw) / 0xffffffff);
  }
  return Math.floor(scale * rng.nextFloat());
}
