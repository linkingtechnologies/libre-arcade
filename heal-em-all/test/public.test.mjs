// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
// SPDX-License-Identifier: GPL-3.0-or-later
// Static checks of the restored package. The browser checks (real Chrome, parity with the original) live in tools/browser-gate.mjs.
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import vm from "node:vm";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = fileURLToPath(new URL("..", import.meta.url));
const pub = join(root, "public");
const walk = async d => (await Promise.all((await readdir(d, { withFileTypes: true })).map(e => e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]))).flat();
const files = (await walk(pub)).map(f => f.slice(pub.length + 1).split("\\").join("/"));
const text = async rel => readFile(join(pub, rel), "utf8");

test("public/index.html is the game itself, at the root; its only remote references are the arcade link and GoatCounter", async () => {
  const html = await text("index.html");
  assert.match(html, /<script src="compat\.js">/);
  const urls = [...new Set([...html.matchAll(/(?:https?:)?\/\/[\w.-]+(?:\/[\w./-]*)?/g)].map(m => m[0]))].filter(u => !u.includes("w3.org"));
  assert.deepEqual(urls.sort(), ["//gc.zgo.at/count.js", "https://grugnetto.goatcounter.com/count", "https://linkingtechnologies.github.io/libre-arcade/"]);
  assert.doesNotMatch(html, /googleapis|google-analytics|gstatic/i);
});

test("no runtime file talks to a remote host, except the original's own documented strings", async () => {
  const remote = /https?:\/\/(?!www\.w3\.org|creativecommons|html5quintus|github\.com|ejohn\.org|underscorejs)[\w.-]+/g;
  for (const f of files.filter(f => /\.(html|js|css)$/.test(f) && !f.endsWith("quintus-all.js"))) {
    const hits = (await text(f)).match(remote) ?? [];
    assert.deepEqual(hits.filter(h => /google|gstatic|analytics|dropbox|myviews/.test(h)), [], `${f} references a remote service`);
  }
});

test("the 14 quarantined original audio files are not in public/, only the seven WAV replacements", () => {
  assert.deepEqual(files.filter(f => /\.(mp3|ogg)$/.test(f)), []);
  assert.deepEqual(files.filter(f => f.startsWith("audio/")).sort(), ["collected", "gun_shot", "human_created", "player_bg", "player_hit", "zombie_mode", "zombie_notice"].map(n => `audio/${n}.wav`));
});

test("promo images and the unattributed favicon are not shipped", () => {
  assert.ok(!files.some(f => /promo|favicon|bg-blured/.test(f)));
});

test("public/ equals the derivation from the frozen upstream snapshot plus the named patches", () => {
  const r = spawnSync(process.execPath, [join(root, "scripts/derive-public.mjs"), "--check"], { encoding: "utf8" });
  assert.equal(r.status, 0, r.stdout + r.stderr);
});

test("the frozen upstream snapshot still matches SOURCE-MANIFEST.json", () => {
  const r = spawnSync(process.execPath, [join(root, "tools/make-manifest.mjs"), "--verify"], { encoding: "utf8" });
  assert.equal(r.status, 0, r.stdout + r.stderr);
});

test("licence and credits travel with the game", async () => {
  assert.match(await text("LICENSE"), /GNU GENERAL PUBLIC LICENSE\s+Version 3/);
  const credits = await text("CREDITS.md");
  for (const who of ["Krzysztof Urbas", "Pawe", "Quintus", "Kenney", "CC BY 4.0"]) assert.match(credits, new RegExp(who));
});

test("game.js differs from upstream only by the named patches", async () => {
  const up = (await readFile(join(root, "reference/upstream-master/app/scripts/game.js"), "utf8")).replace(/\r/g, "").split("\n");
  const mine = (await text("scripts/game.js")).replace(/\r/g, "").split("\n");
  assert.equal(mine.length - up.length, 4 - 1, "net +3 lines: -1 (development) +4 (errorCallback)");
  assert.ok(mine.includes("        audioSupported: ['wav']"));
  assert.ok(!mine.some(l => /development: true|'mp3'/.test(l)));
});

test("the two fonts are local with their OFL texts, and no font is requested remotely", async () => {
  for (const f of ["Boogaloo-Regular.ttf", "JollyLodger-Regular.ttf", "Boogaloo-OFL.txt", "JollyLodger-OFL.txt"]) assert.ok(files.includes(`fonts/${f}`), f);
  const css = await text("styles/fonts.css");
  assert.doesNotMatch(css, /https?:/);
  assert.match(await text("index.html"), /styles\/fonts\.css/);
});

test("Italian: the string table covers the game's labels and translates built labels", async () => {
  const load = lang => {
    const window = { location: { search: lang ? "?lang=" + lang : "" } };
    const nodes = [];
    vm.runInNewContext(src, { window, navigator: { language: "en-US" }, document: { documentElement: {}, title: "x", querySelector: () => null, querySelectorAll: () => nodes } });
    return window.HealI18n;
  };
  const src = await text("i18n.js");
  const it = load("it"), en = load("en"), auto = load("");
  assert.equal(it.lang, "it"); assert.equal(en.lang, "en"); assert.equal(auto.lang, "en", "English is the default");
  assert.ok(Object.keys(it.strings).length >= 35);
  const game = await text("scripts/game.js");
  for (const label of ["I need the key", "That hurts!", "Well done!", "Game Over", "Everything begins here!", "Play next", "Paused", "Continue"]) {
    assert.ok(game.includes('"' + label + '"'), label + " is in game.js");
    assert.notEqual(it.t(label), label, "Italian for " + label);
    assert.equal(en.t(label), label);
  }
  assert.equal(it.t("Zombies healed: 3/4"), "Zombie curati: 3/4");
  assert.equal(it.t("Something unknown"), "Something unknown");
});
