// SPDX-License-Identifier: GPL-3.0-only
import test from "node:test";
import assert from "node:assert/strict";
import {
  BENCHMARK_WIN_RATES,
  DIFFICULTY_TIERS,
  getDifficultyForPlayer,
  getDifficultyForWinRate,
  pickOpponentForDifficulty
} from "../src/ui/DifficultyRegistry.js";

test("the final global benchmark contains all 39 integrated players", () => {
  assert.equal(Object.keys(BENCHMARK_WIN_RATES).length, 39);
});

test("difficulty bands follow the published BriscoLab thresholds", () => {
  assert.equal(getDifficultyForWinRate(44.99).id, "easy");
  assert.equal(getDifficultyForWinRate(45).id, "medium");
  assert.equal(getDifficultyForWinRate(51.99).id, "medium");
  assert.equal(getDifficultyForWinRate(52).id, "hard");
  assert.equal(getDifficultyForWinRate(58).id, "expert");
  assert.equal(getDifficultyForWinRate(62).id, "champion");
});

test("known engines land in the intended player-facing bands", () => {
  assert.equal(getDifficultyForPlayer("random").name, "Facile");
  assert.equal(getDifficultyForPlayer("cardframework-cpu1").name, "Medio");
  assert.equal(getDifficultyForPlayer("briscolajs-s1").name, "Medio");
  assert.equal(getDifficultyForPlayer("briscolajs-s0").name, "Facile");
  assert.equal(getDifficultyForPlayer("cardframework-cpu2").name, "Difficile");
  assert.equal(getDifficultyForPlayer("cuperativa").name, "Esperto");
  assert.equal(getDifficultyForPlayer("briscolabot-v3").name, "Campione");
});

test("tier selection is deterministic for a seed", () => {
  const players = Object.keys(BENCHMARK_WIN_RATES).map((id) => ({ id }));
  const a = pickOpponentForDifficulty(players, "hard", 123456);
  const b = pickOpponentForDifficulty(players, "hard", 123456);
  assert.ok(a);
  assert.equal(a.id, b.id);
  assert.equal(getDifficultyForPlayer(a).id, "hard");
});

test("all five bands have at least one integrated player", () => {
  const counts = Object.fromEntries(DIFFICULTY_TIERS.map((tier) => [tier.id, 0]));
  for (const id of Object.keys(BENCHMARK_WIN_RATES)) counts[getDifficultyForPlayer(id).id] += 1;
  for (const tier of DIFFICULTY_TIERS) assert.ok(counts[tier.id] > 0, tier.name);
});
