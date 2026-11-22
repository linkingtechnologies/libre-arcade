#!/usr/bin/env node
// SPDX-License-Identifier: MIT
// Dev tooling only. Regenerates public/js/game.js from the UNMODIFIED
// upstream modules in reference/. The six upstream files are embedded
// byte-for-byte inside a minimal CommonJS prelude (the same job Browserify
// did for upstream's build/all.js). Run it only after editing this script;
// the generated file is committed so the game needs no build step.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const ref = fileURLToPath(new URL("../reference/elemental-one-609636d/src/", import.meta.url));
const out = fileURLToPath(new URL("../public/js/game.js", import.meta.url));

const ORDER = ["config", "utils", "extensions", "overrides", "data", "main"];
let body = `/* Elemental One - module bundle.
 * Original code: Copyright (c) 2014 Zaven Muradyan, MIT License (see LICENSE).
 * The six src/*.js modules of upstream commit 609636d84f8abb20e49fdf00ab42428f4805d27b
 * are embedded unchanged between the BEGIN/END markers below; only the CommonJS
 * wrapper around them is generated (tools/bundle.mjs). */
(function () {
var defs = {}, cache = {};
function load(name) {
  if (cache[name]) return cache[name].exports;
  var module = cache[name] = { exports: {} };
  defs[name].call(module.exports, function (p) { return load(p.split('./').join('')); }, module, module.exports);
  return module.exports;
}
`;
for (const name of ORDER) {
  const src = readFileSync(ref + name + ".js", "utf8");
  body += `defs[${JSON.stringify(name)}] = function (require, module, exports) {\n/* BEGIN src/${name}.js */\n${src}\n/* END src/${name}.js */\n};\n`;
}
body += `window.ElementalOne = { start: function () { load('main'); } };\n})();\n`;
writeFileSync(out, body);
console.log("wrote", out, body.length, "bytes");
