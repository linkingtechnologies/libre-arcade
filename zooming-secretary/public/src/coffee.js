/*
 * Zooming Secretary M9 reference-run harness
 * Copyright (C) 2026 Libre Arcade contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

export class CoffeeState {
  constructor() {
    this.wait = 150;
    this.strength = 0;
    this.speedFp = 16;
  }

  tick(frameCnt, { overlap = false, slowdown = false } = {}) {
    const events = [];

    if (this.wait) {
      this.wait--;
      if (this.wait === 16) events.push("COFFEE_READY_SFX");
    } else if (overlap) {
      this.strength = 20;
      this.wait = 1000;
      events.push("COFFEE_PICKUP");
    }

    let targetFp = 24 + (this.strength >> 1);
    if (slowdown) targetFp = Math.trunc(targetFp * 4 / 6);

    // Source computes target first, then decrements strength.
    if ((frameCnt & 63) === 0 && this.strength) this.strength--;

    if (this.speedFp < targetFp) this.speedFp++;
    if (this.speedFp > targetFp) this.speedFp--;

    return { targetFp, events };
  }

  snapshot() {
    return { wait: this.wait, strength: this.strength, speedFp: this.speedFp };
  }
}
