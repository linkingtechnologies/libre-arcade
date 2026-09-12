import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("the bilingual UI exposes keyboard and screen-reader contracts", async () => {
  const [html, ui, css] = await Promise.all([
    readFile(new URL("../public/index.html", import.meta.url), "utf8"),
    readFile(new URL("../public/src/ui.js", import.meta.url), "utf8"),
    readFile(new URL("../public/style.css", import.meta.url), "utf8"),
  ]);

  assert.match(html, /aria-live="polite"/);
  assert.match(html, /aria-controls="menu-panel"/);
  assert.match(ui, /event\.key !== "Enter" && event\.key !== " "/);
  assert.match(ui, /\["ArrowDown", "ArrowUp", "Home", "End"\]/);
  assert.match(ui, /Face-down card/);
  assert.match(ui, /Carta coperta/);
  assert.match(ui, /Ace.*Jack.*Queen.*King/);
  assert.match(ui, /Asso.*Fante.*Donna.*Re/);
  assert.match(ui, /document\.documentElement\.lang = language/);
  assert.match(css, /:focus-visible/);
});
