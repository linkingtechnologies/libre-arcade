// SPDX-License-Identifier: GPL-3.0-or-later
import { EPSILON, TAU, normalize, normalizePositiveAngle, distance } from '../core/vector.js';

export class ArcSection {
  constructor(start, end, centre, rotation = 'clockwise') {
    this.type = 'arc'; this.start = { ...start }; this.end = { ...end }; this.centre = { ...centre };
    this.rotation = rotation;
    this.sign = rotation === 'anticlockwise' ? -1 : 1; // screen coordinates: +angle is visually clockwise
    this.radius = distance(start, centre);
    if (this.radius <= EPSILON) throw new Error('Arc radius must be non-zero');
    this.startAngle = Math.atan2(start.y - centre.y, start.x - centre.x);
    this.endAngle = Math.atan2(end.y - centre.y, end.x - centre.x);
    this.sweep = this.sign > 0
      ? normalizePositiveAngle(this.endAngle - this.startAngle)
      : normalizePositiveAngle(this.startAngle - this.endAngle);
    if (this.sweep <= EPSILON) this.sweep = TAU;
    this.maxProgress = this.sweep; // radians along chosen direction
  }
  position(progress) {
    const phi = Math.max(0, Math.min(this.sweep, progress));
    const a = this.startAngle + this.sign * phi;
    return { x: this.centre.x + Math.cos(a) * this.radius, y: this.centre.y + Math.sin(a) * this.radius };
  }
  tangent(progress) {
    const phi = Math.max(0, Math.min(this.sweep, progress));
    const a = this.startAngle + this.sign * phi;
    return normalize({ x: -Math.sin(a) * this.sign, y: Math.cos(a) * this.sign });
  }
  move(progress, amount) {
    const delta = amount / this.radius;
    const next = progress + delta;
    if (next > this.sweep + EPSILON) return { progress: this.sweep, leftover: (next - this.sweep) * this.radius, boundary: 'end' };
    if (next < -EPSILON) return { progress: 0, leftover: next * this.radius, boundary: 'start' };
    return { progress: Math.max(0, Math.min(this.sweep, next)), leftover: 0, boundary: null };
  }
}
