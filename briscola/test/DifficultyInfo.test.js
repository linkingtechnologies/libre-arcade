// SPDX-License-Identifier: GPL-3.0-only
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";


test("difficulty info dialog forces readable light-theme colors", () => {
  const css = readFileSync("styles.css", "utf8");
  assert.match(css, /\.difficulty-info-card \{[^}]*background:#fff;[^}]*color:#1f2937;/s);
  assert.match(css, /\.difficulty-info-card h2 \{[^}]*color:#111827;/s);
  assert.match(css, /\.difficulty-info-tier li \{[^}]*color:#374151;/s);
});
