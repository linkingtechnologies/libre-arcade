// SPDX-License-Identifier: MIT
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("the page loads the game, credits and license", async () => {
  const [html, credits, license] = await Promise.all([
    read("../public/index.html"),
    read("../public/CREDITS.md"),
    read("../public/LICENSE"),
  ]);
  assert.match(html, /<title>The Lost Path<\/title>/);
  assert.match(html, /src\/script\.js/);
  assert.match(credits, /Ghazi/);
  assert.match(license, /MIT License/);
});

test("no Google tracking and no remote dependency other than GoatCounter", async () => {
  const html = await read("../public/index.html");
  assert.doesNotMatch(html, /googletagmanager|gtag|google-analytics/i);
  const scripts = [...html.matchAll(/<script[^>]*\ssrc="([^"]+)"/g)].map((m) => m[1]);
  for (const src of scripts) {
    if (/^(https?:)?\/\//.test(src)) assert.equal(src, "//gc.zgo.at/count.js");
  }
  assert.match(html, /data-goatcounter="https:\/\/grugnetto\.goatcounter\.com\/count"/);
  const js = await read("../public/src/script.js");
  assert.doesNotMatch(js, /https?:\/\/|fetch\(|XMLHttpRequest/);
});

// The only edits made to upstream's script.js (specs/design.md). Undoing
// exactly these must give back upstream's file, byte for byte.
const SCRIPT_EDITS = [
  [
    "// Libre Arcade: rows, cols and the two timer settings are `let` so that\n// menu.js can change them for the difficulty levels (specs/design.md).\n// The defaults reproduce upstream exactly.\nlet rows = 20;\nlet cols = 20;\nlet timeBase = 0;\nlet timePerTile = 5;\n",
    "const rows = 20;\nconst cols = 20;\n",
  ],
  [
    "totalTime = Math.max(timeBase + path.length * timePerTile, 5);",
    "totalTime = Math.max(path.length * 5, 5);",
  ],
];

test("script.js is upstream's file plus only the two documented edits", async () => {
  const { createHash } = await import("node:crypto");
  let normalised = (await read("../public/src/script.js")).replaceAll("\r\n", "\n");
  for (const [edited, original] of SCRIPT_EDITS) {
    assert.ok(normalised.includes(edited), "documented edit missing from script.js");
    normalised = normalised.replace(edited, original);
  }
  assert.equal(
    createHash("sha256").update(normalised).digest("hex"),
    await expectedHash(),
  );
});

async function expectedHash() {
  return (await read("../specs/script.js.sha256")).trim();
}

test("touch.js turns a drag into arrow-key events", async () => {
  const src = await read("../public/src/touch.js");
  for (const key of ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]) {
    assert.match(src, new RegExp(key));
  }
});

test("torch.js is loaded, read-only and offline", async () => {
  const [html, src] = await Promise.all([read("../public/index.html"), read("../public/src/torch.js")]);
  assert.match(html, /src\/torch\.js/);
  assert.doesNotMatch(src, /https?:\/\/|fetch\(|XMLHttpRequest/);
  // It must only read the game state, never assign to it.
  assert.doesNotMatch(src, /\b(maze|player|trail|finish)\s*=[^=]/);
});

test("the manifest names the app", async () => {
  const manifest = JSON.parse(await read("../public/src/app.webmanifest"));
  assert.equal(manifest.name, "The Lost Path");
});

test("English and Italian strings have the same keys, none empty", async () => {
  const { runInNewContext } = await import("node:vm");
  const sandbox = { globalThis: {} };
  runInNewContext(await read("../public/src/i18n.js"), sandbox);
  const { en, it } = sandbox.globalThis.LPI18N;
  assert.deepEqual(Object.keys(it).sort(), Object.keys(en).sort());
  for (const [code, strings] of Object.entries({ en, it })) {
    for (const [key, value] of Object.entries(strings)) assert.ok(value.trim(), `${code}.${key} is empty`);
  }
});

test("every data-i18n key used by the page exists, and New maze is the first button", async () => {
  const { runInNewContext } = await import("node:vm");
  const sandbox = { globalThis: {} };
  runInNewContext(await read("../public/src/i18n.js"), sandbox);
  const { en } = sandbox.globalThis.LPI18N;
  const html = await read("../public/index.html");
  for (const [, key] of html.matchAll(/data-i18n(?:-aria)?="([^"]+)"/g)) {
    assert.ok(key in en, `missing string: ${key}`);
  }
  // script.js wires document.querySelector('button') to restart.
  assert.match(html, /<button id="newBtn"/);
  const markup = html.replace(/<!--[\s\S]*?-->/g, "");
  assert.equal(markup.indexOf("<button"), markup.indexOf('<button id="newBtn"'));
});

test("difficulty levels are ordered from easy to hard and defaults match upstream", async () => {
  const { runInNewContext } = await import("node:vm");
  const sandbox = { globalThis: {} };
  runInNewContext(await read("../public/src/difficulty.js"), sandbox);
  const { easy, normal, hard } = sandbox.globalThis.LPDifficulty;
  assert.ok(easy.size < normal.size && normal.size < hard.size);
  assert.ok(easy.torch > normal.torch && normal.torch > hard.torch);
  assert.ok(easy.perTile >= normal.perTile && normal.perTile >= hard.perTile);
  for (const level of [easy, normal, hard]) assert.equal(level.size % 2, 1, "odd sizes carve cleanly");
  const js = await read("../public/src/script.js");
  assert.match(js, /let timePerTile = 5;/);
  assert.match(js, /let timeBase = 0;/);
});
