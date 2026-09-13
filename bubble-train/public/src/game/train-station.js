// SPDX-License-Identifier: GPL-3.0-or-later
import { Train } from './train.js';
import { SPECIAL } from './bubble.js';

export class TrainStation {
  constructor({ track, speed, factory }) {
    this.track = track;
    this.speed = speed;
    this.factory = factory;
    this.train = new Train(track);
  }

  get empty() { return this.factory.empty && this.train.carriages.length === 0; }

  spawnIfPossible() {
    if (this.factory.empty || !this.train.canSpawn()) return null;
    const bubble = this.factory.nextBubble();
    if (!bubble) return null;
    this.train.addAtStation(bubble);
    return bubble;
  }

  returnOneToStation() {
    const carriage = this.train.takeReturnedAtStation();
    if (!carriage) return null;
    const bubble = carriage.bubble.clone();
    if (bubble.special === SPECIAL.SPEED) bubble.resetToNormal();
    this.factory.prepend(bubble);
    return bubble;
  }

  tick({ nowMs = 0, rng } = {}) {
    // Original ordering: animate train -> spawn if cleared -> return one carriage.
    const result = this.train.animateFrame(this.speed, { nowMs, rng });
    const spawned = this.spawnIfPossible();
    const returnedBubble = this.returnOneToStation();
    return { ...result, spawned, returnedBubble };
  }
}
