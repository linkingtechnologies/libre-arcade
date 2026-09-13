// SPDX-License-Identifier: GPL-3.0-or-later
import { LevelModel } from './level-model.js';
import { LevelTimer } from './level-timer.js';
import { SeededRng } from '../core/rng.js';

const UINT32_MAX = 0xffffffff;

/**
 * Campaign/game-flow layer corresponding to the original Game role.
 */
export class GameSession {
  constructor({
    manifest = [],
    levelDefinitions = new Map(),
    credits = 5,
    seed = 0x4254524e,
    frameMs = 40,
    fastestTimes = null,
    game = 'Unknown'
  } = {}) {
    this.manifest = [...manifest];
    this.levelDefinitions = levelDefinitions;
    this.initialCredits = normalizeCredits(credits);
    this.seed = Number(seed) >>> 0;
    this.frameMs = frameMs;
    this.fastestTimes = fastestTimes;
    this.game = String(game);
    this.timer = new LevelTimer();
    this.resetRunState();
  }

  resetRunState() {
    this.state = 'idle';
    this.levelIndex = -1;
    this.level = null;
    this.credits = this.initialCredits;
    this.totalTenths = 0;
    this.completedLevels = 0;
    this.paused = false;
    this.lastTransition = null;
    this.record = null;
    this.attemptSerial = 0;
  }

  start(nowMs = 0) {
    this.resetRunState();
    if (!this.manifest.length) {
      this.state = 'campaign-won';
      this.finalizeRun(nowMs, true);
      return this.state;
    }
    this.loadLevel(0, nowMs);
    return this.state;
  }

  loadLevel(index, nowMs = 0) {
    const entry = this.manifest[index];
    if (!entry) throw new RangeError(`No campaign level at index ${index}`);
    const definition = resolveDefinition(this.levelDefinitions, entry.src, index);
    if (!definition) throw new Error(`Missing level definition for ${entry.src}`);
    this.levelIndex = index;
    // Derive independent deterministic per-attempt streams while preserving a
    // stable overall run seed. This is a web-port adaptation for replay/tests.
    const attemptSeed = mixSeed(this.seed, index, this.completedLevels, this.credits, this.attemptSerial++);
    this.level = new LevelModel(definition, new SeededRng(attemptSeed), { frameMs: this.frameMs });
    this.level.theme = entry.theme ?? 'default';
    this.state = 'playing';
    this.paused = false;
    this.timer.start(nowMs);
    this.lastTransition = { type: 'level-start', index, src: entry.src, theme: entry.theme ?? null };
  }

  tick(nowMs = 0) {
    if (this.state !== 'playing' || this.paused || !this.level) return this.state;
    const levelState = this.level.tick();
    if (levelState === 'won') this.handleLevelWon(nowMs);
    else if (levelState === 'gameover') this.handleLevelLost(nowMs);
    return this.state;
  }

  handleLevelWon(nowMs) {
    const levelTenths = this.timer.stop(nowMs);
    this.totalTenths += levelTenths;
    this.completedLevels = Math.max(this.completedLevels, this.levelIndex + 1);
    const completedIndex = this.levelIndex;
    if (completedIndex + 1 < this.manifest.length) {
      this.lastTransition = { type: 'level-won', index: completedIndex, levelTenths, totalTenths: this.totalTenths };
      this.loadLevel(completedIndex + 1, nowMs);
    } else {
      this.state = 'campaign-won';
      this.lastTransition = { type: 'campaign-won', index: completedIndex, levelTenths, totalTenths: this.totalTenths };
      this.finalizeRun(nowMs, true);
    }
  }

  handleLevelLost(nowMs) {
    this.timer.stop(nowMs);
    this.state = 'level-lost';
    this.lastTransition = { type: 'level-lost', index: this.levelIndex, canRetry: this.canRetry };
    if (!this.canRetry) {
      this.state = 'campaign-over';
      this.finalizeRun(nowMs, false);
    }
  }

  retry(nowMs = 0) {
    if (this.state !== 'level-lost') return false;
    if (!this.canRetry) {
      this.state = 'campaign-over';
      this.finalizeRun(nowMs, false);
      return false;
    }
    if (this.credits !== -1) this.credits -= 1;
    const index = this.levelIndex;
    this.loadLevel(index, nowMs);
    this.lastTransition = { type: 'retry', index, credits: this.credits };
    return true;
  }

  pause(nowMs = 0) {
    if (this.state !== 'playing' || this.paused) return false;
    this.paused = true;
    this.timer.pause(nowMs);
    this.lastTransition = { type: 'pause', index: this.levelIndex };
    return true;
  }

  resume(nowMs = 0) {
    if (this.state !== 'playing' || !this.paused) return false;
    this.paused = false;
    this.timer.resume(nowMs);
    this.lastTransition = { type: 'resume', index: this.levelIndex };
    return true;
  }

  togglePause(nowMs = 0) { return this.paused ? this.resume(nowMs) : this.pause(nowMs); }

  fireCannon(index = 0) {
    if (this.state !== 'playing' || this.paused || !this.level) return null;
    return this.level.fireCannon(index);
  }

  finalizeRun(nowMs, completedCampaign = false) {
    if (this.record) return this.record;
    this.record = {
      game: this.game,
      completedLevels: this.completedLevels,
      totalTenths: this.totalTenths,
      totalLevels: this.manifest.length,
      completedCampaign: Boolean(completedCampaign),
      seed: this.seed,
      finishedAt: Date.now()
    };
    this.fastestTimes?.add?.(this.record);
    return this.record;
  }

  get canRetry() { return this.credits === -1 || this.credits > 1; }
  get currentEntry() { return this.levelIndex >= 0 ? this.manifest[this.levelIndex] : null; }
  get levelNumber() { return this.levelIndex + 1; }
  get totalLevels() { return this.manifest.length; }
  getLevelTenths(nowMs = 0) { return this.timer.getTenths(nowMs); }
}

function normalizeCredits(value) {
  const n = Number(value);
  if (n === -1) return -1;
  return Math.max(1, Math.trunc(Number.isFinite(n) ? n : 5));
}

function resolveDefinition(store, src, index) {
  if (store instanceof Map) return store.get(src) ?? store.get(index);
  if (Array.isArray(store)) return store[index];
  if (store && typeof store === 'object') return store[src] ?? store[index];
  return null;
}

function mixSeed(seed, ...parts) {
  let x = seed >>> 0;
  for (const part of parts) {
    x ^= (Number(part) + 0x9e3779b9 + ((x << 6) >>> 0) + (x >>> 2)) >>> 0;
    x >>>= 0;
  }
  return (x & UINT32_MAX) >>> 0;
}
