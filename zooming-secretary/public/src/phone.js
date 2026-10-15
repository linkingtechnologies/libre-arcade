/*
 * Zooming Secretary M9 reference-run harness
 * Copyright (C) 2026 Libre Arcade contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

export const PHONE = Object.freeze({
  IDLE: 0,
  HEAT_1: 1,
  HEAT_2: 2,
  HEAT_3: 3,
  ANSWERED: 255
});

export class PhoneSystem {
  constructor({ rng, callDelay, topicsActive, phoneCount = 0, bonus = false }) {
    this.rng = rng;
    this.callDelay = callDelay;
    this.topicsActive = topicsActive;
    this.bonus = bonus;
    this.callsCount = 0;
    this.callsMissed = 0;
    this.phones = Array.from({ length: phoneCount }, () => ({
      level: PHONE.IDLE,
      counter: 0,
      topic: null
    }));
  }

  ensurePhone(id) {
    while (this.phones.length <= id) {
      this.phones.push({ level: PHONE.IDLE, counter: 0, topic: null });
    }
    return this.phones[id];
  }

  // Mirrors phone_reset() ordering from v1.02:
  // state/counter -> RNG topic -> (answer return) -> callDelay decay.
  resetPhone(id, delay = 0, answer = false) {
    const p = this.ensurePhone(id);

    if (answer) {
      p.level = PHONE.ANSWERED;
      p.counter = 25;
    } else {
      p.level = PHONE.IDLE;
      p.counter = this.callDelay + delay + (this.rng.rand8() & 63);
    }

    const rawTopic = this.rng.rand8();
    // Dream's topics_active == 0 is an original unsafe C edge case.
    // JS must not manufacture NaN into game state. We still consume exactly
    // the RNG call and expose null as a documented safety representation.
    p.topic = this.topicsActive ? rawTopic % this.topicsActive : null;

    if (answer) return p;
    if (this.callDelay > 125) this.callDelay -= 10;
    return p;
  }

  initializeNormalPhones(phoneCount) {
    this.phones = Array.from({ length: phoneCount }, () => ({
      level: PHONE.IDLE, counter: 0, topic: null
    }));
    for (let id = 0; id < phoneCount; id++) {
      this.resetPhone(id, id << 8, false);
    }
  }

  initializeDreamPhone() {
    this.phones = [{ level: PHONE.IDLE, counter: 0, topic: null }];
    this.resetPhone(0, 25, false);
  }

  canAnswer(id, playerTopic, wisdom = 0) {
    const p = this.phones[id];
    return !!p && p.level !== PHONE.IDLE &&
      p.level !== PHONE.ANSWERED &&
      (wisdom > 0 || playerTopic === p.topic);
  }

  // Geometry is deliberately outside M9. "overlap" is supplied by the caller.
  attemptAnswer(id, { playerTopic = 255, wisdom = 0, overlap = true } = {}) {
    const p = this.phones[id];
    if (!p || !overlap || !this.canAnswer(id, playerTopic, wisdom)) return false;

    if (!this.bonus) this.resetPhone(id, 0, true);
    this.callsCount++;
    return true;
  }

  // One source-order phone-processing tick. The answer attempt is evaluated
  // before counter decrement/phase transition, as in game.c.
  tick({ attempts = [], onAnswer = null } = {}) {
    const events = [];

    for (let id = 0; id < this.phones.length; id++) {
      const p = this.phones[id];

      if (p.level === PHONE.ANSWERED) {
        p.counter--;
        if (p.counter === 0) {
          this.resetPhone(id, 0, false);
          events.push({ type: "PHONE_REARMED", id });
        }
        continue;
      }

      const req = attempts.find(a => a.id === id);
      if (req && this.attemptAnswer(id, req)) {
        // game.c advances the factoid/message RNG immediately after phone_reset(answer=1),
        // before the common phone counter block and before the next phone is processed.
        if (onAnswer) onAnswer({ id, phone: p, bonus: this.bonus });
        events.push({ type: "ANSWER", id });
        // In the original non-bonus loop, resetPhone(answer=1) set counter=25,
        // then the common counter block decrements it in the same tick.
      }

      if (p.counter) {
        p.counter--;
      } else {
        if (p.level === PHONE.IDLE) {
          events.push({ type: "RING_START", id, topic: p.topic });
        }

        if (!this.bonus) {
          p.level++;
          if (p.level < 4) {
            p.counter = 200;
            events.push({ type: "HEAT", id, level: p.level });
          } else {
            this.resetPhone(id, 0, false);
            this.callsMissed++;
            events.push({ type: "MISS", id, callsMissed: this.callsMissed });
          }
        } else {
          p.level = PHONE.HEAT_2;
        }
      }
    }

    return events;
  }

  snapshot() {
    return {
      callDelay: this.callDelay,
      callsCount: this.callsCount,
      callsMissed: this.callsMissed,
      rng: this.rng.snapshot(),
      phones: this.phones.map(p => ({ ...p }))
    };
  }
}
