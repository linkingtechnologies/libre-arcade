// SPDX-License-Identifier: GPL-3.0-or-later

export const FASTEST_TIMES_KEY = 'bubble-train.fastest-times.v1';

/**
 * Browser mapping of the original global fastest-times table: farther level
 * first, then lower cumulative time. The historical table also recorded the
 * selected .gms game; M4 preserves that field. Storage format remains new JSON.
 */
export class FastestTimesStore {
  constructor({ storage = globalThis.localStorage, key = FASTEST_TIMES_KEY, limit = 10 } = {}) {
    this.storage = storage ?? null;
    this.key = key;
    this.limit = limit;
    this.records = this.load();
  }

  load() {
    if (!this.storage) return [];
    try {
      const raw = this.storage.getItem(this.key);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter(validRecord).map(normalizeRecord).sort(compareFastest).slice(0, this.limit) : [];
    } catch { return []; }
  }

  add(record) {
    const normalized = normalizeRecord(record);
    this.records.push(normalized);
    this.records.sort(compareFastest);
    this.records = this.records.slice(0, this.limit);
    this.save();
    return this.records.indexOf(normalized);
  }

  save() {
    if (!this.storage) return;
    try { this.storage.setItem(this.key, JSON.stringify(this.records)); } catch { /* persistence is optional */ }
  }

  clear() {
    this.records = [];
    try { this.storage?.removeItem?.(this.key); } catch { /* optional */ }
  }

  list() { return this.records.map(r => ({ ...r })); }
}

export function compareFastest(a, b) {
  if (b.completedLevels !== a.completedLevels) return b.completedLevels - a.completedLevels;
  if (a.totalTenths !== b.totalTenths) return a.totalTenths - b.totalTenths;
  return (a.finishedAt ?? 0) - (b.finishedAt ?? 0);
}

function validRecord(r) {
  return r && Number.isFinite(Number(r.completedLevels)) && Number.isFinite(Number(r.totalTenths));
}

function normalizeRecord(r) {
  return {
    game: String(r.game ?? 'Unknown').slice(0, 80),
    completedLevels: Math.max(0, Math.trunc(Number(r.completedLevels) || 0)),
    totalTenths: Math.max(0, Math.trunc(Number(r.totalTenths) || 0)),
    totalLevels: Math.max(0, Math.trunc(Number(r.totalLevels) || 0)),
    completedCampaign: Boolean(r.completedCampaign),
    seed: Number(r.seed ?? 0) >>> 0,
    finishedAt: Math.trunc(Number(r.finishedAt) || Date.now())
  };
}
