// SPDX-License-Identifier: GPL-3.0-or-later
import { distance } from '../core/vector.js';
import { Bubble, SPECIAL } from './bubble.js';

export const BUBBLE_RADIUS = 15;
export const BUBBLE_DIAMETER = 30;
export const TOUCH_THRESHOLD = 31;
export const BOMB_RADIUS = 60;

export class Train {
  constructor(track) {
    this.track = track;
    // Array order is rear/station -> front/path-end, the reverse of the
    // original linked-list head->tail order. Helpers account for that.
    this.carriages = [];
    this.status = 'empty';
  }

  positionOf(index) { return this.track.position(this.carriages[index].cursor); }

  areTouching(i, j, threshold = TOUCH_THRESHOLD) {
    return distance(this.positionOf(i), this.positionOf(j)) <= threshold;
  }

  addAtStation(bubble) {
    this.carriages.unshift({
      bubble: bubble.clone ? bubble.clone() : bubble,
      cursor: this.track.startCursor(),
      state: 'on-track'
    });
    this.status = 'active';
  }

  canSpawn() {
    if (!this.carriages.length) return true;
    return distance(this.positionOf(0), this.track.position(this.track.startCursor())) > BUBBLE_DIAMETER;
  }

  connectedDrivingEnd(threshold = TOUCH_THRESHOLD) {
    if (!this.carriages.length) return -1;
    let end = 0;
    while (end + 1 < this.carriages.length && this.areTouching(end, end + 1, threshold)) end += 1;
    return end;
  }

  effectiveSpeedMultiplier() {
    if (!this.carriages.length) return 1;
    const end = this.connectedDrivingEnd(TOUCH_THRESHOLD);
    let multiplier = 1;
    for (let i = 0; i <= end; i++) {
      const bubble = this.carriages[i].bubble;
      if (bubble.speedAdjustment !== 1) multiplier += Number(bubble.speedAdjustment || 0);
    }
    return multiplier;
  }

  /**
   * Source-faithful ripple propagation. The next carriage is tested after the
   * current one moves; if overlap was created, only the overlap is propagated.
   */
  rippleMove(startIndex, direction, distanceAmount) {
    if (startIndex < 0 || startIndex >= this.carriages.length || distanceAmount <= 0) {
      return { returned: [], crashed: false, moved: 0 };
    }

    const step = direction === 'forward' ? 1 : -1;
    const signed = direction === 'forward' ? 1 : -1;
    let index = startIndex;
    let dist = distanceAmount;
    let crashed = false;
    const returned = [];

    while (index >= 0 && index < this.carriages.length && dist > 0) {
      const carriage = this.carriages[index];
      const result = this.track.move(carriage.cursor, signed * dist);

      // Track::move in the original returns early at path overflow before it
      // writes the boundary position back into the carriage. Preserve the old
      // cursor in crash/return cases and only update it for ordinary movement.
      if (result.status === 'ok') {
        carriage.cursor = result.cursor;
      } else if (result.status === 'crashed') {
        carriage.state = 'on-track';
        crashed = true;
        this.status = 'crashed';
      } else if (result.status === 'returned') {
        carriage.state = 'in-station';
        returned.push(carriage);
      }

      const nextIndex = index + step;
      if (nextIndex < 0 || nextIndex >= this.carriages.length) break;

      const gap = distance(this.positionOf(index), this.positionOf(nextIndex));
      if (gap > BUBBLE_DIAMETER) break;
      const overlap = BUBBLE_DIAMETER - gap;
      dist = Math.min(dist, overlap);
      index = nextIndex;
    }

    return { returned, crashed, moved: distanceAmount };
  }

  advance(baseSpeed) {
    if (!this.carriages.length || this.status === 'crashed') {
      return { returned: [], crashed: this.status === 'crashed', moved: 0, multiplier: 1 };
    }

    const multiplier = this.effectiveSpeedMultiplier();
    const magnitude = Math.abs(baseSpeed * multiplier);
    const end = this.connectedDrivingEnd(TOUCH_THRESHOLD);
    const direction = multiplier < 0 ? 'backward' : 'forward';
    const start = direction === 'forward' ? 0 : end;
    const result = this.rippleMove(start, direction, magnitude);
    return { ...result, moved: baseSpeed * multiplier, multiplier };
  }

  takeReturnedAtStation() {
    if (!this.carriages.length || this.carriages[0].state !== 'in-station') return null;
    const carriage = this.carriages.shift();
    if (!this.carriages.length && this.status !== 'crashed') this.status = 'empty';
    return carriage;
  }

  insert(targetIndex, bubble, side, nowMs = 0) {
    if (targetIndex < 0 || targetIndex >= this.carriages.length) throw new RangeError('targetIndex');
    const targetCursor = this.track.cloneCursor(this.carriages[targetIndex].cursor);
    const insertIndex = side === 'before' ? targetIndex : targetIndex + 1;
    const insertedBubble = bubble.clone ? bubble.clone() : bubble;
    insertedBubble.startTimer?.(nowMs);
    this.carriages.splice(insertIndex, 0, { bubble: insertedBubble, cursor: targetCursor, state: 'on-track' });
    this.status = 'active';

    // Internal side names are in array order: "after" is the path-forward side
    // (the original C++ linked-list calls that BEFORE).
    if (side === 'after') {
      this.rippleMove(insertIndex, 'forward', BUBBLE_RADIUS);
      this.rippleMove(insertIndex - 1, 'backward', BUBBLE_RADIUS);
    } else {
      this.rippleMove(insertIndex + 1, 'forward', BUBBLE_RADIUS);
      this.rippleMove(insertIndex, 'backward', BUBBLE_RADIUS);
    }

    return { insertIndex, crashed: this.status === 'crashed' };
  }

  collisionIndex(projectilePosition, threshold = BUBBLE_DIAMETER) {
    // Original traversal is list head(front) -> tail(rear). Our array is the
    // reverse, so return the first colliding carriage from high index to zero.
    for (let i = this.carriages.length - 1; i >= 0; i--) {
      if (distance(projectilePosition, this.positionOf(i)) <= threshold) return i;
    }
    return -1;
  }

  insertFromProjectile(targetIndex, bubble, projectilePosition, nowMs = 0) {
    const side = this.track.insertionSide(this.carriages[targetIndex].cursor, projectilePosition);
    return { side, ...this.insert(targetIndex, bubble, side, nowMs) };
  }

  /** Match scan in source traversal order, including its speed-bubble asymmetry. */
  findMatchRuns() {
    const runs = [];
    if (this.carriages.length < 3) return runs;

    let count = 1;
    let previous = this.carriages[0];
    for (let i = 1; i < this.carriages.length; i++) {
      const current = this.carriages[i];
      if (
        current.bubble.special !== SPECIAL.SPEED &&
        current.bubble.colour === previous.bubble.colour &&
        this.areTouching(i, i - 1, TOUCH_THRESHOLD)
      ) {
        count += 1;
      } else {
        if (count >= 3) runs.push({ start: i - count, end: i - 1, length: count, colour: previous.bubble.colour });
        count = 1;
      }
      previous = current;
    }
    if (count >= 3) {
      const end = this.carriages.length - 1;
      runs.push({ start: this.carriages.length - count, end, length: count, colour: previous.bubble.colour });
    }
    return runs;
  }

  removeMatchRuns() {
    const runs = this.findMatchRuns();
    const removed = [];
    for (let r = runs.length - 1; r >= 0; r--) {
      const run = runs[r];
      removed.unshift(...this.carriages.splice(run.start, run.length));
    }
    this.updateStatus();
    return removed;
  }

  animateBubbles(nowMs, rng) {
    const changes = [];
    for (let i = 0; i < this.carriages.length; i++) {
      const before = this.carriages[i].bubble.special;
      const result = this.carriages[i].bubble.animate({ nowMs, rng });
      if (result.changedColour || result.expired) changes.push({ index: i, before, after: this.carriages[i].bubble.special, ...result });
    }
    return changes;
  }

  animateFrame(baseSpeed, { nowMs = 0, rng } = {}) {
    if (!this.carriages.length || this.status === 'crashed') {
      this.updateStatus();
      return { returned: [], crashed: this.status === 'crashed', moved: 0, multiplier: 1, removed: [], bubbleChanges: [] };
    }

    const movement = this.advance(baseSpeed);
    const bubbleChanges = this.animateBubbles(nowMs, rng);
    const removed = this.removeMatchRuns();
    return { ...movement, removed, bubbleChanges };
  }

  bombAt(position, radius = BOMB_RADIUS) {
    const removed = [];
    for (let i = this.carriages.length - 1; i >= 0; i--) {
      if (distance(position, this.positionOf(i)) < radius) removed.unshift(...this.carriages.splice(i, 1));
    }
    this.updateStatus();
    return removed;
  }

  colourBomb(targetIndex) {
    if (targetIndex < 0 || targetIndex >= this.carriages.length) return [];
    const colour = this.carriages[targetIndex].bubble.colour;
    const removed = [];
    for (let i = this.carriages.length - 1; i >= 0; i--) {
      if (this.carriages[i].bubble.colour === colour) removed.unshift(...this.carriages.splice(i, 1));
    }
    this.updateStatus();
    return removed;
  }

  resolveProjectile(projectilePosition, bubble, nowMs = 0) {
    const targetIndex = this.collisionIndex(projectilePosition);
    if (targetIndex < 0) return { hit: false, removed: [] };
    if (bubble.special === SPECIAL.BOMB) {
      return { hit: true, targetIndex, removed: this.bombAt(projectilePosition), kind: 'bomb' };
    }
    if (bubble.special === SPECIAL.COLOUR_BOMB) {
      return { hit: true, targetIndex, removed: this.colourBomb(targetIndex), kind: 'colour-bomb' };
    }
    // Ordinary/rainbow/speed insertion does NOT resolve groups immediately;
    // original Level checks collisions after Train::animate/removeGrouped.
    const insertion = this.insertFromProjectile(targetIndex, bubble, projectilePosition, nowMs);
    return { hit: true, targetIndex, insertion, removed: [], kind: 'insert' };
  }

  updateStatus() {
    if (this.carriages.length === 0 && this.status !== 'crashed') this.status = 'empty';
    else if (this.carriages.length && this.status !== 'crashed') this.status = 'active';
  }
}

export function carriage(colour = 0, special = SPECIAL.NORMAL, cursor = null, extras = {}) {
  return { bubble: new Bubble({ colour, special, ...extras }), cursor, state: 'on-track' };
}
