// SPDX-License-Identifier: MIT
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("the standalone page loads the vendored component and carries its license/credits", async () => {
  const [html, credits, license] = await Promise.all([
    readFile(new URL("../public/index.html", import.meta.url), "utf8"),
    readFile(new URL("../public/CREDITS.md", import.meta.url), "utf8"),
    readFile(new URL("../public/LICENSE", import.meta.url), "utf8"),
  ]);
  assert.match(html, /<title>Snake<\/title>/);
  assert.match(html, /app\.js/);
  assert.match(credits, /Ma[eë]l Drapier/);
  assert.match(license, /MIT License/);
});

test("the entry point loads React from a local vendored file, not a CDN", async () => {
  const app = await readFile(new URL("../public/app.js", import.meta.url), "utf8");
  assert.doesNotMatch(app, /jsdelivr|unpkg|cdnjs/i);
  assert.match(app, /vendor\/react/);
});
