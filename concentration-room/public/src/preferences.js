const STORAGE_KEY = 'libreArcade.concentrationRoom.preferences.v1';

export const DEFAULT_PREFERENCES = Object.freeze({
  language: 'en',
  difficulty: 0,
});

function sanitize(value = {}) {
  const language = value.language === 'it' ? 'it' : 'en';
  const d = Number.isInteger(value.difficulty) ? value.difficulty : Number(value.difficulty);
  const difficulty = Number.isFinite(d) ? Math.max(0, Math.min(4, d | 0)) : 0;
  return { language, difficulty };
}

export function loadPreferences(storage = globalThis.localStorage) {
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PREFERENCES };
    return sanitize(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

export function savePreferences(preferences, storage = globalThis.localStorage) {
  const clean = sanitize(preferences);
  try { storage?.setItem(STORAGE_KEY, JSON.stringify(clean)); } catch { /* storage can be unavailable */ }
  return clean;
}

export function resetPreferences(storage = globalThis.localStorage) {
  try { storage?.removeItem(STORAGE_KEY); } catch { /* storage can be unavailable */ }
  return { ...DEFAULT_PREFERENCES };
}

export { STORAGE_KEY };
