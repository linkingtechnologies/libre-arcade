import { coordKey } from '../core/rules.js';

export class RandomPlayer {
  constructor(rng, name = 'Random') {
    this.rng = rng;
    this.name = name;
    this.tried = new Set();
  }

  nextShot(state) {
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
