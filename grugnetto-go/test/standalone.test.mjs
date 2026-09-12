// SPDX-License-Identifier: MIT
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("the standalone page is genuinely self-contained", async () => {
  const [html, license] = await Promise.all([
    readFile(new URL("../public/index.html", import.meta.url), "utf8"),
    readFile(new URL("../public/LICENSE.txt", import.meta.url), "utf8"),
  ]);
  assert.match(html, /<title>Grugnetto Go!<\/title>/);
  assert.match(html, /self-contained/);
  assert.doesNotMatch(html, /cdn\.jsdelivr|unpkg\.com|cdnjs\.cloudflare/i);
  assert.match(license, /Copyright \(c\) 2026 Umberto Bresciani/);
  assert.match(license, /GNU General Public License/);
});

test("the game's own specs travel inside public/, the documented exception", async () => {
  const [design, useCase] = await Promise.all([
    readFile(new URL("../public/specs/design.md", import.meta.url), "utf8"),
    readFile(new URL("../public/specs/use-case.md", import.meta.url), "utf8"),
  ]);
  assert.ok(design.length > 0);
  assert.ok(useCase.length > 0);
});
