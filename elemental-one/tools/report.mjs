#!/usr/bin/env node
// SPDX-License-Identifier: MIT
// Dev tooling. Turns test/results/parity.json (written by `npm run parity`
// with a file argument) into the tables inside GAMEPLAY-PARITY.md.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const res = JSON.parse(readFileSync(`${root}test/results/parity.json`, "utf8"));
let t = "| Scenario | Frames | Player x range | Player y range | Original vs restored | Checks |\n|---|---|---|---|---|---|\n";
for (const r of res) {
  const pr = r.playerRange;
  const ok = r.checks.filter((c) => c.restored && c.original).length;
  t += `| \`${r.level}\` | ${r.frames} | ${pr ? Math.round(pr.x[0]) + " to " + Math.round(pr.x[1]) : "-"} | ${pr ? Math.round(pr.y[0]) + " to " + Math.round(pr.y[1]) : "-"} | ${r.identical ? "identical" : "DIFFERENT at frame " + r.firstDiff} | ${r.checks.length ? ok + "/" + r.checks.length + " pass" : "n/a"} |\n`;
}
let c = "| Level | Check | Frame | Original | Restored |\n|---|---|---|---|---|\n";
for (const r of res) for (const k of r.checks) c += `| \`${r.level}\` | ${k.desc.replace(/^level\d: /, "")} | ${k.frame} | ${k.original ? "pass" : "FAIL"} | ${k.restored ? "pass" : "FAIL"} |\n`;
writeFileSync(`${root}test/results/parity-tables.md`, `## Scenario runs\n\n${t}\n## Checks\n\n${c}`);
console.log(t + "\n" + c);
