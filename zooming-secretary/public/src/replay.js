/*
 * Zooming Secretary M9 reference-run harness
 * Copyright (C) 2026 Libre Arcade contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Rng8 } from "./rng.js";
import { PhoneSystem } from "./phone.js";

// Small deterministic reference scenario, intentionally not a game.
// Used to prove replay identity with the same seed + scripted tick inputs.
export function runReferenceReplay({ seed = 1, ticks = 900, attempts = [] } = {}) {
  const rng = new Rng8(seed);
  const phones = new PhoneSystem({
    rng,
    callDelay: 250,
    topicsActive: 2,
    phoneCount: 2,
    bonus: false
  });
  phones.initializeNormalPhones(2);

  const trace = [];
  for (let tick = 0; tick < ticks; tick++) {
    const tickAttempts = attempts
      .filter(a => a.tick === tick)
      .map(({ tick: _tick, ...rest }) => rest);

    const events = phones.tick({ attempts: tickAttempts });
    if (events.length || tick % 100 === 0) {
      trace.push({ tick, events, snapshot: phones.snapshot() });
    }
  }
  return trace;
}
