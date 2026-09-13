// SPDX-License-Identifier: GPL-3.0-or-later

/**
 * Pause-aware wall-clock level timer.
 * The original stores/displays elapsed time in 1/10 second units by dividing
 * elapsed milliseconds by 100. We expose the same integer unit.
 */
export class LevelTimer {
  constructor() { this.reset(); }

  reset() {
    this.startedAtMs = null;
    this.pausedAtMs = null;
    this.pausedTotalMs = 0;
    this.endedAtMs = null;
  }

  start(nowMs = 0) {
    this.startedAtMs = nowMs;
    this.pausedAtMs = null;
    this.pausedTotalMs = 0;
    this.endedAtMs = null;
    return this;
  }

  pause(nowMs = 0) {
    if (this.startedAtMs == null || this.endedAtMs != null || this.pausedAtMs != null) return;
    this.pausedAtMs = nowMs;
  }

  resume(nowMs = 0) {
    if (this.pausedAtMs == null) return;
    this.pausedTotalMs += Math.max(0, nowMs - this.pausedAtMs);
    this.pausedAtMs = null;
  }

  stop(nowMs = 0) {
    if (this.startedAtMs == null) return 0;
    if (this.endedAtMs == null) {
      if (this.pausedAtMs != null) this.resume(nowMs);
      this.endedAtMs = nowMs;
    }
    return this.getTenths(nowMs);
  }

  get elapsedMs() { return this.getElapsedMs(); }

  getElapsedMs(nowMs = this.endedAtMs ?? this.pausedAtMs ?? this.startedAtMs ?? 0) {
    if (this.startedAtMs == null) return 0;
    const end = this.endedAtMs ?? this.pausedAtMs ?? nowMs;
    return Math.max(0, end - this.startedAtMs - this.pausedTotalMs);
  }

  getTenths(nowMs = this.endedAtMs ?? this.pausedAtMs ?? this.startedAtMs ?? 0) {
    return Math.trunc(this.getElapsedMs(nowMs) / 100);
  }

  get running() { return this.startedAtMs != null && this.endedAtMs == null && this.pausedAtMs == null; }
  get paused() { return this.pausedAtMs != null; }
}
