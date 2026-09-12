// SPDX-License-Identifier: GPL-3.0-only
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { allArenaPlayers, arenaPlayers, getArenaPlayer, poianaArenaPlayers } from "../arena/scripts/lib/players.mjs";
import { playBalancedPair } from "../arena/scripts/lib/simulate.mjs";

test("BriscoLab keeps the core Arena, adds Briscola.js S0/S1, and adds 23 PoIAna identities", () => {
  assert.equal(arenaPlayers.length, 16);
  assert.equal(poianaArenaPlayers.length, 23);
  assert.equal(allArenaPlayers.length, 39);
  assert.equal(new Set(allArenaPlayers.map((player) => player.id)).size, 39);
  assert.ok(arenaPlayers.some((player) => player.id === "random"));
  assert.ok(arenaPlayers.some((player) => player.id === "giacomelli-pig"));
  assert.ok(arenaPlayers.some((player) => player.id === "giacomelli-pih"));
  assert.ok(arenaPlayers.some((player) => player.id === "giacomelli-pic"));
  assert.ok(arenaPlayers.some((player) => player.id === "cardframework-cpu0"));
  assert.ok(arenaPlayers.some((player) => player.id === "cardframework-cpu1"));
  assert.ok(arenaPlayers.some((player) => player.id === "cardframework-cpu2"));
  assert.ok(arenaPlayers.some((player) => player.id === "briscolajs-s0"));
  assert.ok(arenaPlayers.some((player) => player.id === "briscolajs-s1"));
  assert.ok(poianaArenaPlayers.some((player) => player.id === "poiana-blooming-bird"));
});

test("all 23 PoIAna deterministic agents complete a legal game against Random", async () => {
  const random = getArenaPlayer("random");
  for (const model of poianaArenaPlayers) {
    const games = await playBalancedPair(23, model, random);
    assert.equal(games.length, 2, model.id);
    for (const game of games) {
      assert.equal(game.result.scores[0] + game.result.scores[1], 120, model.id);
    }
  }
});

test("Arena balanced simulation plays both seats and preserves 120 total points", async () => {
  const games = await playBalancedPair(
    17,
    getArenaPlayer("qbriscola"),
    getArenaPlayer("cuperativa")
  );

  assert.equal(games.length, 2);
  assert.deepEqual(games.map((game) => game.swapped), [false, true]);
  for (const game of games) {
    assert.equal(game.result.scores[0] + game.result.scores[1], 120);
  }
});

test("project structure keeps specs, Arena, and reference identities explicit", () => {
  const requiredSpecs = [
    "architecture.md",
    "game-engine.md",
    "card-model.md",
    "player-interface.md",
    "player-observation.md",
    "adapter-guidelines.md",
    "faithful-porting.md",
    "arena-benchmark.md",
    "reference-sources.md",
    "players.md"
  ];

  assert.ok(existsSync("AGENTS.md"));
  for (const file of requiredSpecs) assert.ok(existsSync(`specs/${file}`), file);
  assert.ok(existsSync("arena/scripts/round-robin.mjs"));
  assert.ok(existsSync("arena/scripts/head-to-head.mjs"));
  assert.ok(existsSync("arena/scripts/benchmark-player.mjs"));
  assert.ok(existsSync("arena/scripts/poiana-round-robin.mjs"));
  assert.ok(existsSync("arena/scripts/global-round-robin.mjs"));

  const referenceFolders = readdirSync("reference", { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
  assert.equal(referenceFolders.length, 11);
});

test("package metadata uses the BriscoLab identity", () => {
  const packageData = JSON.parse(readFileSync("package.json", "utf8"));
  assert.equal(packageData.name, "briscolab");
  assert.equal(packageData.version, "1.7.29");
  assert.equal(packageData.license, "GPL-3.0-only");
});
