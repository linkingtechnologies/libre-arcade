// SPDX-License-Identifier: MIT
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("the standalone page loads the vendored game and carries its license/credits", async () => {
  const [html, credits, license] = await Promise.all([
    readFile(new URL("../public/index.html", import.meta.url), "utf8"),
    readFile(new URL("../public/CREDITS.md", import.meta.url), "utf8"),
    readFile(new URL("../public/LICENSE", import.meta.url), "utf8"),
  ]);
  assert.match(html, /<title>HTML5 Snake<\/title>/);
  assert.match(html, /game\.js/);
  // The dead IE/html5shiv <script> tag itself is gone; only a comment
  // documenting its removal remains (see specs/design.md).
  assert.doesNotMatch(html, /<script[^>]*html5shiv/i);
  assert.match(credits, /Jason D\. Straughan/);
  assert.match(license, /MIT License/);
});
