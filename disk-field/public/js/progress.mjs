export const TOTAL_LEVELS = 17;

export function clampUnlocked(value, total = TOTAL_LEVELS) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 1;
  return Math.max(1, Math.min(total, Math.trunc(n)));
}

export function unlockAfterCompletion(unlocked, completedLevel, total = TOTAL_LEVELS) {
  const current = clampUnlocked(unlocked, total);
  const candidate = Math.max(1, Math.min(total, Math.trunc(completedLevel) + 2));
  return Math.max(current, candidate);
}

export function clampPlayableLevel(value, unlocked, archaeology = false, total = TOTAL_LEVELS) {
  const raw = Number(value);
  let level = Number.isFinite(raw) ? Math.trunc(raw) : 0;
  level = Math.max(0, Math.min(total - 1, level));
  if (!archaeology) level = Math.min(level, clampUnlocked(unlocked, total) - 1);
  return level;
}
