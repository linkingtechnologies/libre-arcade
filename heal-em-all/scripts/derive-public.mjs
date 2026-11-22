#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
// SPDX-License-Identifier: GPL-3.0-or-later
//
// Derives the upstream-owned part of public/ from the frozen snapshot in reference/, applying the
// listed patches and nothing else, so every difference from upstream is named here and in specs/design.md.
// Files written by hand (public/index.html, compat.js, CREDITS.md, LICENSE, fonts) are not touched.
//   node scripts/derive-public.mjs            writes public/
//   node scripts/derive-public.mjs --check    fails if public/ differs from what this would write
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const app = join(root, "reference/upstream-master/app");
const check = process.argv.includes("--check");
let bad = 0;

async function put(rel, bytes) {
  const out = join(root, "public", rel);
  if (check) {
    let have = null; try { have = await readFile(out); } catch { /* missing */ }
    if (!have || !have.equals(bytes)) { console.error("DIFFERS:", rel); bad++; }
    return;
  }
  await mkdir(dirname(out), { recursive: true }); await writeFile(out, bytes);
}
const replaceOnce = (text, from, to, label) => {
  const n = text.split(from).length - 1;
  if (n !== 1) throw new Error(`patch "${label}" matched ${n} times, expected 1`);
  return text.replace(from, to);
};

// ---- game.js: three patches, CRLF preserved (upstream committed the file with CRLF) -------------------------------
let game = (await readFile(join(app, "scripts/game.js"), "utf8"));
game = replaceOnce(game,
  "        development: true,\r\n        audioSupported: ['ogg', 'mp3']\r\n",
  "        audioSupported: ['wav']\r\n", "P1 audio format, no cache-busting");
game = replaceOnce(game,
  "        return container.parentNode.removeChild(container);\r\n      }\r\n    }\r\n  });\r\n",
  "        return container.parentNode.removeChild(container);\r\n      }\r\n    },\r\n    errorCallback: function(item) {\r\n      var text = document.querySelector(\"#loading .loading-text\");\r\n      if (text) { text.textContent = \"Error loading \" + item; }\r\n    }\r\n  });\r\n", "P2 visible load error");
await put("scripts/game.js", Buffer.from(game, "utf8"));

// ---- verbatim copies ---------------------------------------------------------------------------------------------
const verbatim = [
  ["scripts/lib/quintus-all.js", "scripts/lib/quintus-all.js"],
  ["scripts/lib/stats.min.js", "scripts/lib/stats.min.js"],
  ["styles/main.css", "@gh-pages/styles/ae2f2a90.main.css"], // the author's own deployed CSS (master has only the SCSS)
  ...["bg.gif", "bullet.png", "characters.png", "gradient-top.png", "hud.png", "items.png", "map_tiles.png", "others.png"].map(f => [`images/${f}`, `images/${f}`]),
  ...["bullet", "characters", "hud", "items", "others"].map(f => [`data/${f}.json`, `data/${f}.json`]),
  ...[1, 2, 3, 4, 5, 6].map(n => [`data/level${n}.tmx`, `data/level${n}.tmx`]),
  // Replacement sounds (the 14 original audio files are quarantined: see LICENSE-AUDIT.md)
  ...["collected", "gun_shot", "human_created", "player_bg", "player_hit", "zombie_mode", "zombie_notice"].map(f => [`audio/${f}.wav`, `@repl/${f}.wav`]),
];
for (const [dest, src] of verbatim) {
  const path = src.startsWith("@gh-pages/") ? join(root, "reference/upstream-gh-pages", src.slice(10)) : src.startsWith("@repl/") ? join(root, "replacement-audio", src.slice(6)) : join(app, src);
  await put(dest, await readFile(path));
}
console.log(check ? (bad ? `${bad} file(s) differ` : "public/ matches the derivation") : "public/ derived");
process.exit(bad ? 1 : 0);
