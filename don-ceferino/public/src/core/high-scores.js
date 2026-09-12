export const DEFAULT_HIGH_SCORES = Object.freeze([
  { name: 'matar bros', points: 500 },
  { name: 'pepe', points: 450 },
  { name: 'kenny', points: 425 },
  { name: 'vaca', points: 413 },
  { name: 'martian', points: 411 },
  { name: 'raton', points: 300 },
  { name: 'toto', points: 299 }
]);

export function normalizeHighScores(entries) {
  const safe = Array.isArray(entries) ? entries : [];
  const clean = safe
    .map(entry => ({
      name: String(entry?.name ?? '').slice(0, 17),
      points: Number.isFinite(Number(entry?.points)) ? Math.trunc(Number(entry.points)) : 0
    }))
    .sort((a, b) => b.points - a.points)
    .slice(0, 7);
  while (clean.length < 7) clean.push({ ...DEFAULT_HIGH_SCORES[clean.length] });
  return clean;
}

export function isHighScore(points, entries) {
  return normalizeHighScores(entries).some(entry => entry.points < points);
}

export function insertHighScore(entries, name, points) {
  const score = { name: String(name || '').slice(0, 17), points: Math.trunc(points) };
  const list = normalizeHighScores(entries);
  let pos = 6;
  for (let i = 6; i >= 0; i--) if (score.points > list[i].points) pos = i;
  list.splice(pos, 0, score);
  return list.slice(0, 7);
}
