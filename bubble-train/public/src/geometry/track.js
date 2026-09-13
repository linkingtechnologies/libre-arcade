// SPDX-License-Identifier: GPL-3.0-or-later
import { EPSILON, sub, dot } from '../core/vector.js';

export class Track {
  constructor(sections = []) {
    if (!sections.length) throw new Error('Track requires at least one section');
    this.sections = sections;
  }
  startCursor() { return { sectionIndex: 0, progress: 0 }; }
  endCursor() { const i = this.sections.length - 1; return { sectionIndex: i, progress: this.sections[i].maxProgress }; }
  cloneCursor(c) { return { sectionIndex: c.sectionIndex, progress: c.progress }; }
  section(cursor) { return this.sections[cursor.sectionIndex]; }
  position(cursor) { return this.section(cursor).position(cursor.progress); }
  tangent(cursor) { return this.section(cursor).tangent(cursor.progress); }

  move(cursor, amount) {
    let c = this.cloneCursor(cursor); let remaining = amount; let guard = 0;
    while (Math.abs(remaining) > EPSILON) {
      if (++guard > this.sections.length * 4 + 16) throw new Error('Track move guard tripped');
      const section = this.sections[c.sectionIndex];
      const result = section.move(c.progress, remaining);
      c.progress = result.progress;
      if (!result.boundary) return { cursor: c, status: 'ok', leftover: 0 };
      remaining = result.leftover;
      if (result.boundary === 'end') {
        if (c.sectionIndex === this.sections.length - 1) return { cursor: c, status: 'crashed', leftover: remaining };
        c.sectionIndex += 1; c.progress = 0;
      } else {
        if (c.sectionIndex === 0) return { cursor: c, status: 'returned', leftover: remaining };
        c.sectionIndex -= 1; c.progress = this.sections[c.sectionIndex].maxProgress;
      }
    }
    return { cursor: c, status: 'ok', leftover: 0 };
  }

  insertionSide(targetCursor, projectilePosition) {
    const p = this.position(targetCursor); const t = this.tangent(targetCursor);
    // Project onto local track direction: path-forward side => AFTER.
    return dot(sub(projectilePosition, p), t) >= 0 ? 'after' : 'before';
  }
}
