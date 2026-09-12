import { coordKey, inBounds } from '../core/rules.js';

/**
 * Reconstruction of billux13/HunoPPC Bataille Navale 2009 targeting behaviour,
 * based on binary/debug archaeology rather than original source code.
 *
 * Behaviour intentionally kept elementary: random hunt; after a hit on a ship
 * that is not yet sunk, try random orthogonal neighbours around the latest hit.
 * This module does NOT claim source-level parity yet.
 */
export class Os4ReconstructedPlayer {
  constructor(rng, name = 'Bataille Navale OS4 2009 (reconstructed)') {
    this.rng = rng;
    this.name = name;
    this.tried = new Set();
    this.anchor = null;
  }

  observe(event) {
    if (event.hit && !event.sunk) this.anchor = { ...event.coord };
    if (event.sunk) this.anchor = null;
  }

  nextShot(state) {
    if (this.anchor) {
      const candidates = [
        { x: this.anchor.x + 1, y: this.anchor.y },
        { x: this.anchor.x - 1, y: this.anchor.y },
        { x: this.anchor.x, y: this.anchor.y + 1 },
        { x: this.anchor.x, y: this.anchor.y - 1 }
      ].filter(c => inBounds(c, state.boardSize) && !this.tried.has(coordKey(c)));
      if (candidates.length) {
        const shot = this.rng.pick(candidates);
        this.tried.add(coordKey(shot));
        return shot;
      }
      this.anchor = null;
    }

    const candidates = [];
    for (let y = 0; y < state.boardSize; y += 1) {
      for (let x = 0; x < state.boardSize; x += 1) {
        const c = { x, y };
        if (!this.tried.has(coordKey(c))) candidates.push(c);
      }
    }
    const shot = this.rng.pick(candidates);
    this.tried.add(coordKey(shot));
    return shot;
  }
}
