// SPDX-License-Identifier: MIT
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("the standalone page loads the vendored game and carries its license/credits", async () => {
  const [html, credits, license] = await Promise.all([
    readFile(new URL("../public/index.html", import.meta.url), "utf8"),
    readFile(new URL("../public/CREDITS.md", import.meta.url), "utf8"),
    readFile(new URL("../public/LICENSE.md", import.meta.url), "utf8"),
  ]);
  assert.match(html, /<title>Hextris<\/title>/);
  assert.match(html, /<!-- APP-CONTENT-START/);
  assert.match(html, /<!-- APP-CONTENT-END -->/);
  assert.match(credits, /Logan Engstrom/);
  assert.match(license, /GNU GENERAL PUBLIC LICENSE/);
  assert.match(license, /Version 3/);
});

test("no telemetry, ads, or remote script injection remain", async () => {
  const [html, main] = await Promise.all([
    readFile(new URL("../public/index.html", import.meta.url), "utf8"),
    readFile(new URL("../public/js/main.js", import.meta.url), "utf8"),
  ]);
  assert.doesNotMatch(html, /google-analytics|googlesyndication|adsbygoogle/i);
  assert.doesNotMatch(main, /hextris\.io\/a\.js|54\.183\.184\.126/);
});
