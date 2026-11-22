#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Umberto Bresciani
// SPDX-License-Identifier: GPL-3.0-or-later

// node tools/oracle/diff.mjs <name>
// Compares tools/oracle/out/<name>.json (the original) with the port, frame by frame,
// and prints the first frame where they differ.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { replay, initialOf } from "../shared/replay.mjs";

const name = process.argv[2];
const rec = JSON.parse(readFileSync(fileURLToPath(new URL(`./out/${name}.json`, import.meta.url)), "utf8"));
const init = initialOf(rec);
console.log("layout equal:", JSON.stringify(init.layout) === JSON.stringify(rec.initial.layout), "player equal:", JSON.stringify(init.player) === JSON.stringify(rec.initial.player));
let n = 0;
for (const r of replay(rec)) {
  if (r.over) { console.log(`port over at frame ${r.frame} (original ${rec.overAt}), score ${r.score} (original ${rec.finalScore})`); break; }
  if (r.text !== rec.frameTexts[r.frame]) {
    console.log(`FIRST DIFFERENCE at frame ${r.frame}`);
    console.log("original:", rec.frameTexts[r.frame]);
    console.log("port:    ", r.text);
    if (r.frame > 0) console.log("previous:", rec.frameTexts[r.frame - 1]);
    process.exit(1);
  }
  n++;
}
console.log(`${n} frames identical`);
