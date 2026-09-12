// SPDX-License-Identifier: MIT
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

test("the standalone page loads the vendored game and carries its license/credits", async () => {
  const [html, credits, license] = await Promise.all([
    readFile(new URL("../public/index.html", import.meta.url), "utf8"),
    readFile(new URL("../public/CREDITS.md", import.meta.url), "utf8"),
    readFile(new URL("../public/LICENSE", import.meta.url), "utf8"),
  ]);
  assert.match(html, /<title>HTML5 Space Invaders<\/title>/);
  assert.match(html, /game\.js/);
  assert.match(credits, /toivjon/);
  assert.match(license, /MIT License/);
});

test("the sprite sheet asset ships alongside the game", async () => {
  const info = await stat(new URL("../public/space_invaders_spritesheet.png", import.meta.url));
  assert.ok(info.size > 100, "sprite sheet is missing or empty");
});
