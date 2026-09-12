// SPDX-License-Identifier: GPL-3.0-only
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("Grugnetto branding is used in browser and setup screen", () => {
  const html = readFileSync("index.html", "utf8");
  const ui = readFileSync("src/ui/WebUI.js", "utf8");
  assert.match(html, /<title>Grugnetto's Briscola<\/title>/);
  assert.match(ui, /setup-mark[^>]*>🐽's<\/div>/);
  assert.match(ui, /<h1 class="title is-2 mb-1">Briscola<\/h1>/);
  assert.match(ui, /title="Grugnetto's Briscola"/);
  assert.match(ui, /<span class="brand-mobile">Briscola<\/span>/);
  assert.match(readFileSync("styles.css", "utf8"), /\.brand-mobile\s*{\s*display:\s*inline;/);
});


test("BriscoLab payoff is rendered in the footer, not under the setup title", () => {
  const ui = readFileSync("src/ui/WebUI.js", "utf8");
  const css = readFileSync("styles.css", "utf8");
  assert.doesNotMatch(ui, /<p class="subtitle is-7">Preserving, porting and benchmarking Briscola AIs<\/p>/);
  assert.match(ui, /<footer class="app-footer"><span class="footer-powered">Powered by <strong>BriscoLab<\/strong><\/span>/);
  assert.match(ui, /<footer class="app-footer app-footer-game"><span class="footer-powered">Powered by <strong>BriscoLab<\/strong><\/span>/);
  assert.match(ui, /<span class="footer-payoff">Preserving, porting and benchmarking Briscola AIs<\/span>/);
  assert.match(css, /@media \(max-width: 600px\)\s*{\s*\.app-footer\s*{\s*display:\s*none;/);
});
