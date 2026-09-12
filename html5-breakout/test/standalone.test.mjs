// SPDX-License-Identifier: MIT
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("the standalone page loads the vendored game and carries its license/credits", async () => {
  const [html, game, credits, license] = await Promise.all([
    readFile(new URL("../public/index.html", import.meta.url), "utf8"),
    readFile(new URL("../public/game.js", import.meta.url), "utf8"),
    readFile(new URL("../public/CREDITS.md", import.meta.url), "utf8"),
    readFile(new URL("../public/LICENSE", import.meta.url), "utf8"),
  ]);
  assert.match(html, /<title>HTML5 Breakout<\/title>/);
  assert.match(html, /game\.js/);
  assert.match(game, /GAME OVER/);
  assert.match(credits, /toivjon|html5-breakout/i);
  assert.match(license, /MIT License/);
});
