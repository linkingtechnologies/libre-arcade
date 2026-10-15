/*
 * Zooming Secretary M9 reference-run harness
 * Copyright (C) 2026 Libre Arcade contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

export const STAGES = Object.freeze([
  "Day 1", "Day 2", "Day 3", "Day 4",
  "Dream", "Day 5", "Day 6", "Day 7", "Ending"
]);

export const TARGETS = Object.freeze([10, 15, 20, 25, 1, 30, 35, 40]);

export class Campaign {
  constructor() {
    this.stage = 0;
    this.missLimit = 3;
  }

  get name() {
    return STAGES[this.stage];
  }

  resolve({ won = false, caught = false } = {}) {
    if (this.stage >= 8) return { advanced: false, ending: true };

    if (this.stage === 4) {
      // Dream always advances. Only actual success grants the +2 allowance.
      if (won) this.missLimit += 2;
      if (won || caught) {
        this.stage++;
        return { advanced: true, dreamBonus: won, ending: false };
      }
      return { advanced: false, dreamBonus: false, ending: false };
    }

    if (won) {
      this.stage++;
      return { advanced: true, ending: this.stage === 8 };
    }

    // Normal failure means Game Over + retry the same stage.
    return { advanced: false, ending: false };
  }

  snapshot() {
    return { stage: this.stage, name: this.name, missLimit: this.missLimit };
  }
}
