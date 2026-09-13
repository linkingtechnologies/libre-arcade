// SPDX-License-Identifier: GPL-3.0-or-later
import { EPSILON, normalize, distance, normalizePositiveAngle } from '../core/vector.js';

/** Bubble Train's spiral uses the source-derived discrete law
 * r(phi) = startRadius * exp(-abs(phi)/10).
 * Each move converts the requested linear distance using the radius at the
 * beginning of that move. This intentionally is not an exact arc-length integral. */
export class SpiralSection {
  constructor(start, end, centre, rotation = 'clockwise') {
    this.type = 'spiral'; this.start = { ...start }; this.end = { ...end }; this.centre = { ...centre };
    this.rotation = rotation; this.sign = rotation === 'anticlockwise' ? -1 : 1;
    this.startRadius = distance(start, centre); this.endRadius = distance(end, centre);
    if (this.startRadius <= EPSILON || this.endRadius <= EPSILON) throw new Error('Spiral radii must be non-zero');
    this.startAngle = Math.atan2(start.y - centre.y, start.x - centre.x);
    this.endAngle = Math.atan2(end.y - centre.y, end.x - centre.x);
    // Shipped/source behavior is an inward exponential spiral. The radius ratio
    // reveals the number of radians even when the path wraps multiple turns.
    if (this.endRadius <= this.startRadius + EPSILON) {
      this.radialSign = -1;
      this.sweep = Math.max(0, -10 * Math.log(this.endRadius / this.startRadius));
    } else {
      // Defensive support for clean-room/editor data traversed in the opposite radial sense.
      this.radialSign = 1;
      this.sweep = Math.max(0, 10 * Math.log(this.endRadius / this.startRadius));
    }
    if (this.sweep <= EPSILON) {
      this.sweep = this.sign > 0
        ? normalizePositiveAngle(this.endAngle - this.startAngle)
        : normalizePositiveAngle(this.startAngle - this.endAngle);
    }
    this.maxProgress = this.sweep;
  }
  radiusAt(progress) { return this.startRadius * Math.exp(this.radialSign * progress / 10); }
  position(progress) {
    const phi = Math.max(0, Math.min(this.sweep, progress));
    const r = this.radiusAt(phi); const a = this.startAngle + this.sign * phi;
    return { x: this.centre.x + Math.cos(a) * r, y: this.centre.y + Math.sin(a) * r };
  }
  tangent(progress) {
    const phi = Math.max(0, Math.min(this.sweep, progress)); const r = this.radiusAt(phi);
    const a = this.startAngle + this.sign * phi; const dr = this.radialSign * r / 10;
    return normalize({
      x: dr * Math.cos(a) - this.sign * r * Math.sin(a),
      y: dr * Math.sin(a) + this.sign * r * Math.cos(a)
    });
  }
  move(progress, amount) {
    const r = this.radiusAt(Math.max(0, Math.min(this.sweep, progress)));
    const delta = amount / r; // source-derived discrete approximation
    const next = progress + delta;
    if (next > this.sweep + EPSILON) return { progress: this.sweep, leftover: (next - this.sweep) * r, boundary: 'end' };
    if (next < -EPSILON) return { progress: 0, leftover: next * r, boundary: 'start' };
    return { progress: Math.max(0, Math.min(this.sweep, next)), leftover: 0, boundary: null };
  }
}
