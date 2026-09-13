// SPDX-License-Identifier: GPL-3.0-or-later
import { BUBBLE_RADIUS } from './train.js';

export class Bullet {
  constructor({ position, velocity, bubble }) {
    this.position = { ...position };
    this.velocity = { ...velocity };
    this.bubble = bubble;
    this.alive = true;
  }

  tick({ nowMs = 0, rng } = {}) {
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
    this.bubble.animate({ nowMs, rng });
  }

  intersectsScreen(width = 800, height = 600) {
    const r = BUBBLE_RADIUS;
    return this.position.x + r >= 0 && this.position.x - r <= width && this.position.y + r >= 0 && this.position.y - r <= height;
  }
}
