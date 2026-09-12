// SPDX-License-Identifier: GPL-3.0-only
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync("src/ui/WebUI.js", "utf8");
const css = readFileSync("styles.css", "utf8");

test("WebUI starts on the full pre-game setup screen", () => {
  assert.match(source, /this\.screen = "setup"/);
  assert.match(source, /id="game-setup"/);
  assert.match(source, /id="setup-cpu-level"/);
  assert.match(source, /id="setup-deck"/);
  assert.match(source, /preloadDeckImages/);
  assert.match(source, /Caricamento carte/);
  assert.match(source, /Engine specifico/);
  assert.match(source, /id="setup-seed"/);
  assert.match(source, /id="setup-match-mode"/);
  assert.match(source, /Al meglio delle 3/);
});

test("game menu restores settings, reveal and AI debug controls", () => {
  assert.match(source, /id="menu-new-game"/);
  assert.match(source, /id="menu-reveal"/);
  assert.match(source, /id="menu-debug"/);
  assert.match(source, /id="debug-close"/);
  assert.match(source, /id="gameover-rematch"/);
  assert.match(source, /id="gameover-settings"/);
  assert.match(source, /gameover-rematch[\s\S]*freshGameSeed\(this\.game\.getPublicState\(\)\.seed\)/);
  assert.match(source, /menu-new-game[\s\S]*#openSetup\(\{ freshSeed: true \}\)/);
});

test("masked Maestro always selects BriscolaBot v3 and rematches alternate the opening player", () => {
  assert.match(source, /label: "Maestro",[\s\S]*?pool: \["briscolabot-v3"\]/);
  assert.match(source, /this\.currentFirstPlayer = nextStartingPlayer\(this\.currentFirstPlayer\)/);
  assert.match(source, /firstPlayer: this\.currentFirstPlayer/);
});

test("restored UI keeps responsive setup and game-shell styling", () => {
  assert.match(css, /\.setup-screen/);
  assert.match(css, /\.setup-card/);
  assert.match(css, /\.game-shell/);
  assert.match(css, /env\(safe-area-inset-top\)/);
});
