export const SETTINGS_KEY = 'memonix-mosaic-settings';
export const DEFAULT_SETTINGS = Object.freeze({
  lang: 'en',
  size: 4,
  difficulty: 0,
  countdownOn: true,
  countdown: 30,
  sound: true
});

const SIZES = [2, 4, 6, 8];
const DIFFICULTIES = [0, 1, 2, 3, 4];

export function normalizeSettings(value = {}) {
  return {
    lang: value.lang === 'it' ? 'it' : DEFAULT_SETTINGS.lang,
    size: SIZES.includes(value.size) ? value.size : DEFAULT_SETTINGS.size,
    difficulty: Number.isInteger(value.difficulty) && DIFFICULTIES.includes(value.difficulty)
      ? value.difficulty : DEFAULT_SETTINGS.difficulty,
    countdownOn: value.countdownOn !== false,
    countdown: Number.isInteger(value.countdown) && value.countdown >= 1 && value.countdown <= 99
      ? value.countdown : DEFAULT_SETTINGS.countdown,
    sound: value.sound !== false
  };
}

export function loadSettings(storage) {
  try {
    const raw = storage.getItem(SETTINGS_KEY);
    return normalizeSettings(raw ? JSON.parse(raw) : {});
  } catch {
    return {...DEFAULT_SETTINGS};
  }
}

export function saveSettings(storage, settings) {
  storage.setItem(SETTINGS_KEY, JSON.stringify(normalizeSettings(settings)));
}

export function recordKey(difficulty, size) {
  return `memonix-mosaic-best-d${difficulty}-s${size}`;
}

export function readBest(storage, difficulty, size) {
  const raw = storage.getItem(recordKey(difficulty, size));
  if (raw === null) return null;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

export function writeBest(storage, difficulty, size, seconds) {
  storage.setItem(recordKey(difficulty, size), String(seconds));
}

export function clearRecords(storage) {
  for (const difficulty of DIFFICULTIES) {
    for (const size of SIZES) storage.removeItem(recordKey(difficulty, size));
  }
}

export function clearAllLocalData(storage) {
  storage.removeItem(SETTINGS_KEY);
  clearRecords(storage);
  return {...DEFAULT_SETTINGS};
}
