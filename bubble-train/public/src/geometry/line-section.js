// SPDX-License-Identifier: GPL-3.0-or-later
import { EPSILON, add, scale, sub, normalize, distance } from '../core/vector.js';

export class LineSection {
  constructor(start, end) {
    this.type = 'line'; this.start = { ...start }; this.end = { ...end };
    this.length = distance(start, end);
    if (this.length <= EPSILON) throw new Error('Line section must have non-zero length');
    this.dir = normalize(sub(end, start));
    this.maxProgress = this.length; // progress = pixels from start
  }
  position(progress) { return add(this.start, scale(this.dir, Math.max(0, Math.min(this.length, progress)))); }
  tangent() { return { ...this.dir }; }
  move(progress, amount) {
    const next = progress + amount;
    if (next > this.length + EPSILON) return { progress: this.length, leftover: next - this.length, boundary: 'end' };
    if (next < -EPSILON) return { progress: 0, leftover: next, boundary: 'start' };
    return { progress: Math.max(0, Math.min(this.length, next)), leftover: 0, boundary: null };
  }
}
