// SPDX-License-Identifier: GPL-3.0-only
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

const ui = readFileSync("src/ui/WebUI.js", "utf8");
const css = readFileSync("styles.css", "utf8");
const deckIndex = JSON.parse(readFileSync("assets/decks/index.json", "utf8"));
const main = readFileSync("src/main.js", "utf8");

test("restored laboratory and in-game controls stay present", () => {
  for (const marker of [
    "Engine specifico", "setup-seed", "menu-toggle", "Mostra carte avversario",
    "Nascondi carte avversario", "Debug AI", "gameover-rematch", "Rigioca",
    "gameover-settings", "Nuova partita"
  ]) assert.match(ui, new RegExp(marker));
});

test("restored presentation animations and responsive geometry stay present", () => {
  for (const marker of [
    "DEAL_ANIMATION_MS", "PLAY_ANIMATION_MS", "TRICK_HOLD_MS",
    "TRICK_COLLECT_DELAY_MS", "is-collecting", "is-dealt", "--card-height-factor"
  ]) assert.match(ui, new RegExp(marker));
  assert.match(css, /safe-area-inset-/);
  assert.match(css, /var\(--card-aspect\)/);
  assert.match(css, /@keyframes deal-to-human/);
  assert.match(css, /@keyframes collect-to-cpu/);
});

test("both restored historical decks remain indexed and bundled", () => {
  const manifests = deckIndex.decks.map((item) => item.manifest);
  assert.ok(manifests.some((item) => item.includes("viterbesi-murari-1900")));
  assert.ok(manifests.some((item) => item.includes("napoletane-pignalosa-1882")));
  assert.ok(existsSync("assets/decks/viterbesi-murari-1900/back.png"));
  assert.ok(existsSync("assets/decks/napoletane-pignalosa-1882/back.png"));
});

test("v1.7 archaeology engines stay wired into the application", () => {
  for (const marker of [
    "PiGAdapter", "PiHAdapter", "PiCAdapter",
    "BriscolaJsS0Adapter", "BriscolaJsS1Adapter",
    "CardFrameworkCpu0Adapter", "CardFrameworkCpu1Adapter", "CardFrameworkCpu2Adapter",
    "PoianaAdapter"
  ]) assert.match(main, new RegExp(marker));
});

test("empty table placeholder is visually empty", () => {
  assert.match(ui, /<span class=\"empty-table\" aria-hidden=\"true\"><\/span>/);
  assert.doesNotMatch(ui, /empty-table[^\n]*•/);
});
