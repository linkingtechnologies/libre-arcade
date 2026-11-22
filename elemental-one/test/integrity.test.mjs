// SPDX-License-Identifier: MIT
// Proves how much of the historical JavaScript is preserved: the six upstream
// modules inside public/js/game.js are byte-identical to the reference
// snapshot, and (parsed) identical to the modules of upstream's own committed
// browserify bundle build/all.js.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { parse } from "acorn";

const root = fileURLToPath(new URL("..", import.meta.url));
const ref = `${root}reference/elemental-one-609636d/`;
const read = (p) => readFileSync(p, "utf8");
const MODULES = ["config", "utils", "extensions", "overrides", "data", "main"];

test("game.js embeds each upstream src/*.js module byte for byte", () => {
  const bundle = read(`${root}public/js/game.js`);
  for (const m of MODULES) {
    const src = read(`${ref}src/${m}.js`);
    const begin = bundle.indexOf(`/* BEGIN src/${m}.js */\n`);
    const end = bundle.indexOf(`\n/* END src/${m}.js */`);
    assert.ok(begin >= 0 && end > begin, `markers for ${m}`);
    assert.equal(bundle.slice(begin + `/* BEGIN src/${m}.js */\n`.length, end), src, `${m}.js was modified`);
  }
});

test("upstream's own build/all.js contains the same six modules (AST-equal)", () => {
  const strip = (n) => JSON.parse(JSON.stringify(n, (k, v) => (k === "start" || k === "end" || k === "raw" || k === "loc" ? undefined : v)));
  const bundle = parse(read(`${ref}build/all.js`), { ecmaVersion: 5 });
  const map = bundle.body[0].expression.arguments[0];
  const historical = map.properties.map((p) => JSON.stringify(strip({ body: p.value.elements[0].body.body })));
  for (const m of MODULES) {
    const mine = JSON.stringify(strip({ body: parse(read(`${ref}src/${m}.js`), { ecmaVersion: 5 }).body }));
    assert.ok(historical.includes(mine), `${m}.js is not what build/all.js contains`);
  }
  assert.equal(historical.length, MODULES.length);
});

test("phaser.js is upstream's deps/phaser.js, byte for byte (Phaser 1.1.3)", () => {
  assert.equal(read(`${root}public/js/phaser.js`), read(`${ref}deps/phaser.js`));
  assert.match(read(`${root}public/js/phaser.js`), /VERSION: '1\.1\.3'/);
});

test("level data and sprite atlases are upstream's, unchanged", () => {
  for (const f of ["tilemaps/level1.json", "tilemaps/level2.json", "tilemaps/level3.json", "tilemaps/level4.json", "sprites/p1_spritesheet.json", "sprites/items_spritesheet.xml", "sprites/particles.xml"]) {
    assert.equal(read(`${root}public/assets/${f}`), read(`${ref}assets/${f}`), f);
  }
});

test("exactly four level states exist in the preserved data", () => {
  const data = read(`${ref}src/data.js`);
  assert.deepEqual([...data.matchAll(/^ {8}(level[0-9]): \{/gm)].map((m) => m[1]), ["level1", "level2", "level3", "level4"]);
  assert.equal([...data.matchAll(/nextState: (null|'level\d')/g)].map((m) => m[1]).join(","), "'level2','level3','level4',null");
});
