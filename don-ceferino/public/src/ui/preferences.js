export function readPreference(storage, key, fallback) {
  try {
    const value = storage?.getItem?.(key);
    return value === null || value === undefined ? fallback : value;
  } catch {
    return fallback;
  }
}

export function writePreference(storage, key, value) {
  try {
    storage?.setItem?.(key, String(value));
    return true;
  } catch {
    return false;
  }
}
