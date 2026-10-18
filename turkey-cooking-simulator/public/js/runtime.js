/*
 * Turkey Cooking Simulator - Runtime preservation layer
 * SPDX-License-Identifier: GPL-3.0-only
 *
 * Separates wall-clock scheduling from the preserved 1 Hz thermal model.
 * Two timing policies exist by design:
 *   - legacy: reproduces the 2013 browser-stall behavior exactly;
 *   - fixed-step: Libre Arcade runtime policy, catches up whole thermal seconds.
 */

export const TimingMode = Object.freeze({
  LEGACY: 'legacy',
  FIXED_STEP: 'fixed-step',
});

export const DoorState = Object.freeze({
  CLOSED: 'closed',
  PEEK: 'peek',
  OPEN: 'open',
});

export class RuntimeClock {
  constructor({ ovenModel, startTimeMs = 0, timingMode = TimingMode.FIXED_STEP } = {}) {
    if (!ovenModel) throw new TypeError('ovenModel is required');
    if (!Object.values(TimingMode).includes(timingMode)) throw new RangeError(`Unknown timing mode: ${timingMode}`);

    this.ovenModel = ovenModel;
    this.currentTimeMs = startTimeMs;
    this.lastWallTimeMs = startTimeMs;
    this.timingMode = timingMode;
    this.pendingMs = 0;
    this.thermalTicks = 0;
  }

  // One thermal second. As in the original's OvenUI.secondTick, a fully open door first cools the oven's air by 1 C (never below 20 C).
  tick() {
    if (this.isDoorOpen?.()) this.ovenModel.setRawTemp(Math.max(20, this.ovenModel.getRawTemp() - 1));
    this.ovenModel.secondTick();
    this.thermalTicks += 1;
  }

  setTimingMode(mode) {
    if (!Object.values(TimingMode).includes(mode)) throw new RangeError(`Unknown timing mode: ${mode}`);
    this.timingMode = mode;
    this.pendingMs = 0;
  }

  advanceWallClock(nowMs) {
    const diffMs = nowMs - this.lastWallTimeMs;
    if (diffMs < 0) throw new RangeError('Wall clock cannot move backwards');
    this.lastWallTimeMs = nowMs;

    if (this.timingMode === TimingMode.LEGACY) {
      // Historical UI semantics: one thermal second if diff > 1000 ms,
      // while game time advances by the full wall-clock delta.
      if (diffMs > 1000) {
        this.tick();
        this.currentTimeMs += diffMs;
      }
      return this.snapshot(diffMs);
    }

    // Libre Arcade policy: accumulate elapsed milliseconds and execute one
    // preserved thermal tick for every complete logical second.
    this.pendingMs += diffMs;
    const ticks = Math.floor(this.pendingMs / 1000);
    for (let i = 0; i < ticks; i++) {
      this.tick();
    }
    if (ticks > 0) {
      const advanced = ticks * 1000;
      this.pendingMs -= advanced;
      this.currentTimeMs += advanced;
    }
    return this.snapshot(diffMs);
  }

  skipSeconds(seconds) {
    if (!Number.isInteger(seconds) || seconds < 0) throw new RangeError('skipSeconds requires a non-negative integer');
    for (let i = 0; i < seconds; i++) this.tick();
    this.currentTimeMs += seconds * 1000;
    return this.snapshot(seconds * 1000);
  }

  importState(state) {
    if (!state) throw new TypeError('runtime state is required');
    this.timingMode=state.timingMode;
    this.currentTimeMs=Number(state.currentTimeMs);
    this.lastWallTimeMs=Number(state.lastWallTimeMs);
    this.pendingMs=Number(state.pendingMs);
    this.thermalTicks=Number(state.thermalTicks);
    return this;
  }

  static fromState({ovenModel,state}) {
    const clock=new RuntimeClock({ovenModel,startTimeMs:Number(state.currentTimeMs),timingMode:state.timingMode});
    return clock.importState(state);
  }

  snapshot(lastDiffMs = 0) {
    return {
      timingMode: this.timingMode,
      currentTimeMs: this.currentTimeMs,
      lastWallTimeMs: this.lastWallTimeMs,
      pendingMs: this.pendingMs,
      thermalTicks: this.thermalTicks,
      lastDiffMs,
    };
  }
}

export class AlarmClock {
  constructor() {
    this.remainingSeconds = 0;
    this.active = false;
    this.rang = false;
  }

  clear() {
    this.remainingSeconds = 0;
    this.active = false;
    this.rang = false;
  }

  addSeconds(seconds) {
    if (!Number.isInteger(seconds) || seconds < 0) throw new RangeError('addSeconds requires a non-negative integer');
    this.remainingSeconds += seconds;
    this.active = true;
    this.rang = false;
  }

  tick(seconds = 1) {
    if (!this.active) return false;
    this.remainingSeconds -= seconds;
    if (this.remainingSeconds <= 0) {
      this.remainingSeconds = 0;
      this.rang = true;
      return true;
    }
    return false;
  }

  // Historical skip subtracts 1200 directly, so allow a compatible path.
  legacySkip(seconds) {
    if (this.active) this.remainingSeconds -= seconds;
    return this.remainingSeconds;
  }

  snapshot() { return {remainingSeconds:this.remainingSeconds,active:this.active,rang:this.rang}; }
  importState(state) { this.remainingSeconds=Number(state.remainingSeconds); this.active=Boolean(state.active); this.rang=Boolean(state.rang); return this; }
  static fromState(state) { return new AlarmClock().importState(state); }
}

export class OvenInteractionController {
  constructor({ ovenModel, runtimeClock, alarm = null } = {}) {
    if (!ovenModel) throw new TypeError('ovenModel is required');
    if (!runtimeClock) throw new TypeError('runtimeClock is required');
    this.ovenModel = ovenModel;
    this.runtimeClock = runtimeClock;
    this.alarm = alarm;
    this.doorState = DoorState.CLOSED;
    this.ovenOpened = 0;
    this.runtimeClock.isDoorOpen = () => this.doorState === DoorState.OPEN;
  }

  peek() {
    if (this.doorState === DoorState.OPEN) return this.doorState;
    this.doorState = this.doorState === DoorState.CLOSED ? DoorState.PEEK : DoorState.CLOSED;
    return this.doorState;
  }

  fullOpenOrClose() {
    if (this.doorState !== DoorState.OPEN) {
      this.doorState = DoorState.OPEN;
      this.ovenOpened += 1;
      this.ovenModel.setRawTemp(Math.max(20, this.ovenModel.getRawTemp() - 3));
      // Opening the door fully takes 3 C off the oven's air at once (never below 20 C), as the original's handlePress does;
      // each second it then stays open takes 1 C more (RuntimeClock.tick).
    } else {
      // Historical drag-close lands in PEEK, not CLOSED.
      this.doorState = DoorState.PEEK;
    }
    return this.doorState;
  }

  readCoreTemperatureC() {
    if (this.doorState !== DoorState.OPEN) return null;
    return this.ovenModel.getTurkeyState().core.tempC;
  }

  casualSkip20Minutes({ legacyAlarm = true } = {}) {
    this.runtimeClock.skipSeconds(1200);
    if (this.alarm) {
      if (legacyAlarm) this.alarm.legacySkip(1200);
      else this.alarm.tick(1200);
    }
    return this.snapshot();
  }

  importState(state) {
    if (!state) throw new TypeError('interaction state is required');
    this.doorState=state.doorState;
    this.ovenOpened=Number(state.ovenOpened ?? 0);
    return this;
  }

  snapshot() {
    return {
      doorState: this.doorState,
      ovenOpened: this.ovenOpened,
      clock: this.runtimeClock.snapshot(),
      turkey: this.ovenModel.getTurkeyState(),
      alarm: this.alarm ? {
        remainingSeconds: this.alarm.remainingSeconds,
        active: this.alarm.active,
        rang: this.alarm.rang,
      } : null,
    };
  }
}
