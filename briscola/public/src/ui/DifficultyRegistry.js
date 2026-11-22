// SPDX-License-Identifier: GPL-3.0-only

/**
 * BriscoLab v1.7.0 global round-robin results.
 * 39 players, 100 paired seeds per matchup, 148,200 games total.
 * Values are percentages from the common Arena, not upstream project metrics.
 */
export const BENCHMARK_WIN_RATES = Object.freeze({
  "briscolabot-v3": 70.91,
  qbriscola: 62.49,
  cuperativa: 60.53,
  "poiana-blooming-bird": 59.45,
  "poiana-autumn-night": 59.03,
  "poiana-graceful-darkness": 58.91,
  "smbriscola-empirico2": 58.11,
  "smbriscola-empirico1": 58.04,
  "poiana-snowy-shape": 57.68,
  "poiana-laced-pond": 57.20,
  "poiana-true-star": 54.59,
  "cardframework-cpu2": 54.39,
  "poiana-toasty-pine": 54.21,
  "poiana-devout-paper": 53.32,
  "poiana-mild-aardvark": 52.51,
  "poiana-lively-cosmos": 51.91,
  "briscolajs-s1": 51.49,
  "poiana-bumbling-leaf": 50.70,
  "poiana-spring-snowflake": 50.11,
  "poiana-easy-shape": 49.57,
  "cardframework-cpu1": 49.26,
  "poiana-earnest-night": 48.61,
  "poiana-rich-mountain": 48.61,
  "poiana-warm-river": 48.34,
  "giacomelli-pig": 47.39,
  "poiana-selfplay-best": 47.34,
  "poiana-skilled-serenity": 47.18,
  "poiana-dark-salad": 46.28,
  "poiana-amber-lake": 45.08,
  "briscolajs-s0": 44.96,
  "giacomelli-pic": 44.33,
  "poiana-smart-dragon": 44.30,
  "giacomelli-pih": 43.78,
  pryscola: 43.17,
  "poiana-hardy-galaxy": 37.09,
  "poiana-cosmic-firebrand": 35.41,
  jbriscola: 25.20,
  "cardframework-cpu0": 21.18,
  random: 16.99
});

export const DIFFICULTY_TIERS = Object.freeze([
  Object.freeze({ id: "easy", name: "Facile", icon: "🌱", min: -Infinity, max: 45, description: "CPU permissiva, ideale per iniziare" }),
  Object.freeze({ id: "medium", name: "Medio", icon: "🎯", min: 45, max: 52, description: "Partita equilibrata" }),
  Object.freeze({ id: "hard", name: "Difficile", icon: "🔥", min: 52, max: 58, description: "CPU solida e difficile da sorprendere" }),
  Object.freeze({ id: "expert", name: "Esperto", icon: "🧠", min: 58, max: 62, description: "Tra i migliori motori del laboratorio" }),
  Object.freeze({ id: "champion", name: "Campione", icon: "🏆", min: 62, max: Infinity, description: "I campioni della nostra Arena" })
]);

export function getBenchmarkWinRate(playerOrId) {
  const id = typeof playerOrId === "string" ? playerOrId : playerOrId?.id;
  return BENCHMARK_WIN_RATES[id] ?? null;
}

export function getDifficultyForWinRate(winRate) {
  if (!Number.isFinite(winRate)) return null;
  return DIFFICULTY_TIERS.find((tier) => winRate >= tier.min && winRate < tier.max) ?? null;
}

export function getDifficultyForPlayer(playerOrId) {
  return getDifficultyForWinRate(getBenchmarkWinRate(playerOrId));
}

export function playersForDifficulty(players, difficultyId) {
  return players.filter((player) => getDifficultyForPlayer(player)?.id === difficultyId);
}

/** Pick a reproducible opponent from a tier for a given deal seed. */
export function pickOpponentForDifficulty(players, difficultyId, seed) {
  const candidates = playersForDifficulty(players, difficultyId);
  if (candidates.length === 0) return null;
  let x = Number(seed) >>> 0;
  x ^= x >>> 16;
  x = Math.imul(x, 0x45d9f3b);
  x ^= x >>> 16;
  x = Math.imul(x, 0x45d9f3b);
  x ^= x >>> 16;
  return candidates[(x >>> 0) % candidates.length];
}
