// SPDX-License-Identifier: MIT
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const pub = (path) => new URL(`../public/${path}`, import.meta.url);
const read = (path) => readFile(pub(path), "utf8");
const exists = (path) => access(pub(path)).then(() => true, () => false);

test("the page loads Crafty and the game scripts in upstream's order, then fit.js", async () => {
  const html = await read("index.html");
  assert.match(html, /<title>Strider<\/title>/);
  const scripts = [...html.matchAll(/<script[^>]*\ssrc="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(scripts.slice(0, 6), [
    "lib/crafty.js",
    "js/traps.js",
    "js/loader.js",
    "js/menu.js",
    "js/game.js",
    "js/fit.js",
  ]);
  for (const src of scripts.slice(0, 6)) assert.ok(await exists(src), src);
});

test("every image and sound the loader names exists on disk", async () => {
  const loader = await read("js/loader.js");
  const images = [...loader.matchAll(/'([\w.-]+\.(?:png|jpg|gif))'/g)].map((m) => m[1]);
  // Each entry lists alternative formats for one sound; upstream ships no .m4a
  // for gun02/gun03 (Safari, the only .m4a user, runs with audio disabled), so
  // require the .ogg or .wav the other browsers play, not every alternative.
  const groups = [...loader.matchAll(/\w+: \[((?:'[\w.-]+\.(?:ogg|m4a|wav)',? ?)+)\]/g)].map((m) =>
    [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]),
  );
  assert.ok(images.length > 20 && groups.length > 25, "loader lists were not parsed");
  for (const g of groups) {
    const playable = g.filter((f) => !f.endsWith(".m4a"));
    assert.ok(playable.length > 0, g.join());
    for (const f of playable) assert.ok(await exists(`assets/sfx/${f}`), f);
  }
});

test("the menu, the stylesheet and the loader only reference files that exist", async () => {
  const menu = await read("js/menu.js");
  for (const m of menu.matchAll(/'(assets\/[\w./-]+)'/g)) assert.ok(await exists(m[1]), m[1]);
  const css = await read("css/main.css");
  for (const m of css.matchAll(/url\('\.\.\/([^']+)'\)/g)) assert.ok(await exists(m[1]), m[1]);
});

test("no Game Jolt client or other remote dependency is shipped", async () => {
  const html = await read("index.html");
  // Only the collection's GoatCounter beacon may point off-site.
  const remote = [...html.matchAll(/(?:src|href)="((?:https?:)?\/\/[^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(remote, ["//gc.zgo.at/count.js"]);
  assert.match(html, /data-goatcounter="https:\/\/grugnetto\.goatcounter\.com\/count"/);
  assert.equal(await exists("lib/gj-js-api.js"), false);
  assert.equal(await exists("lib/gj-js-api-min.js"), false);
  // GJAPI stays an empty stub, so every `GJAPI.bActive` check is false.
  assert.match(await read("js/traps.js"), /w\.GJAPI = \{\};/);
  for (const f of ["js/traps.js", "js/loader.js", "js/menu.js", "js/game.js"]) {
    const code = await read(f);
    assert.doesNotMatch(code, /XMLHttpRequest|fetch\(|https?:\/\/(?!www\.w3)/, f);
  }
});

test("assets that could not be cleared are gone, and their replacements exist", async () => {
  for (const f of [
    "doorshut.ogg", "doorshut.m4a", "liftoff.ogg", "liftoff.m4a",
    "deathsplat.ogg", "deathsplat.m4a", "landfeet.ogg", "landfeet.m4a",
  ]) {
    assert.equal(await exists(`assets/sfx/${f}`), false, f);
  }
  for (const f of ["doorshut.wav", "liftoff.wav", "deathsplat.wav", "landfeet.wav"]) {
    const buf = await readFile(pub(`assets/sfx/${f}`));
    assert.equal(buf.toString("latin1", 0, 4), "RIFF", f);
    assert.equal(buf.toString("latin1", 8, 12), "WAVE", f);
  }
  assert.equal(await exists("assets/fonts/bmspa.ttf"), false);
  assert.equal(await exists("assets/images/gameoff.jpg"), false);
  const png = await readFile(pub("assets/images/smoke_jump.png"));
  assert.equal(png.readUInt32BE(16), 640);
  assert.equal(png.readUInt32BE(20), 64);
});

test("the licenses and credits are present and name what was replaced", async () => {
  const [license, credits, ofl] = await Promise.all([
    read("LICENSE"),
    read("CREDITS.md"),
    read("assets/fonts/Jura.OFL.txt"),
  ]);
  assert.match(license, /MIT License/);
  assert.match(license, /KENAMICK/);
  assert.match(ofl, /SIL Open Font License/);
  for (const name of ["Petar Petrov", "Omer Goshen", "Master484", "Redshrike", "Robinhood76", "cydon", "Rock Savage", "Pow Studio", "Crafty"]) {
    assert.ok(credits.includes(name), name);
  }
  assert.match(credits, /carries no license at all/);
});
