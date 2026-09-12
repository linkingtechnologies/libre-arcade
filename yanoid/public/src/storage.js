/* Small defensive wrapper: storage can be unavailable in strict/private browser contexts. */
export function storageGet(key, fallback = null) {
  try {
    const value = globalThis.localStorage?.getItem(key);
    return value == null ? fallback : value;
  } catch {
    return fallback;
  }
}

export function storageSet(key, value) {
  try {
    globalThis.localStorage?.setItem(key, String(value));
    return true;
  } catch {
    return false;
  }
}

export function storageGetNumber(key, fallback = 0) {
  const parsed = Number(storageGet(key, fallback));
  return Number.isFinite(parsed) ? parsed : fallback;
}
