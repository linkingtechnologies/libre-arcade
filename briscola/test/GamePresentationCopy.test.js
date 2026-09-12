// SPDX-License-Identifier: GPL-3.0-only
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("game presentation uses opponent labels beside the turn LEDs", () => {
  const ui = readFileSync("src/ui/WebUI.js", "utf8");
  assert.match(ui, /<span class="turn-label">Avversario<\/span>\s*<span class="turn-dot/);
  assert.match(ui, /<span class="turn-label">Tu<\/span>\s*<span class="turn-dot/);
  assert.doesNotMatch(ui, />🤖 CPU<\/span>/);
});

test("game notifications live below the deck cluster", () => {
  const ui = readFileSync("src/ui/WebUI.js", "utf8");
  assert.match(ui, /<div class="deck-side">[\s\S]*<div class="deck-cluster">[\s\S]*<p class="turn-message/);
  assert.match(ui, /this\.message = `\$\{this\.#playerName\(winner\)\} \+\$\{points\}`/);
  assert.match(ui, /Avversario gioca/);
});

test("JBriscola is dated to 2009", () => {
  const ui = readFileSync("src/ui/WebUI.js", "utf8");
  assert.match(ui, /jbriscola: "2009"/);
});
