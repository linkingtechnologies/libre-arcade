// SPDX-License-Identifier: GPL-3.0-or-later
export const SETTINGS_KEY = 'bubble-train.settings.v1';
export const DEFAULT_SETTINGS = Object.freeze({ language: 'en', credits: 5, sound: true, campaign: 'easy' });
const CAMPAIGNS = new Set(['easy', 'normal', 'hard', 'bubbletrain', 'everything']);

export class SettingsStore {
  constructor({ storage = globalThis.localStorage, key = SETTINGS_KEY } = {}) {
    this.storage = storage ?? null;
    this.key = key;
    this.value = this.load();
  }

  load() {
    try {
      const parsed = JSON.parse(this.storage?.getItem?.(this.key) ?? '{}');
      return sanitizeSettings({ ...DEFAULT_SETTINGS, ...parsed });
    } catch { return { ...DEFAULT_SETTINGS }; }
  }

  update(patch) {
    this.value = sanitizeSettings({ ...this.value, ...patch });
    try { this.storage?.setItem?.(this.key, JSON.stringify(this.value)); } catch { /* optional */ }
    return { ...this.value };
  }

  reset() {
    this.value = { ...DEFAULT_SETTINGS };
    try { this.storage?.removeItem?.(this.key); } catch { /* optional */ }
    return { ...this.value };
  }
}

function sanitizeSettings(v) {
  let credits = Number(v.credits);
  if (credits !== -1) credits = Math.max(1, Math.min(99, Math.trunc(Number.isFinite(credits) ? credits : 5)));
  return {
    language: v.language === 'it' ? 'it' : 'en',
    credits,
    sound: v.sound !== false,
    campaign: CAMPAIGNS.has(v.campaign) ? v.campaign : 'easy'
  };
}
