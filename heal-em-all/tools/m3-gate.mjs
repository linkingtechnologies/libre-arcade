#!/usr/bin/env node
// SPDX-License-Identifier: GPL-3.0-or-later
// M3 parity gate: runs tools/probe-m3.js (P4, P9-P12) on the ORIGINAL baseline and on the restored page at three viewports
// and compares every result. Writes evidence/m3-parity.json.
//   PLAYWRIGHT_CORE=<node_modules/playwright-core> node tools/m3-gate.mjs <restoredUrl> <baselineUrl>
import { createRequire } from "node:module";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const here = dirname(fileURLToPath(import.meta.url));
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_CORE ?? "playwright-core");
const [restored, baseline] = [process.argv[2] ?? "http://127.0.0.1:8768/", process.argv[3] ?? "http://127.0.0.1:8765/index.html"];
const probe = readFileSync(resolve(here, "probe-m3.js"), "utf8");
const browser = await chromium.launch({ channel: "chrome", headless: true });
const report = { viewports: {} };
async function run(url, vp) {
  const page = await (await browser.newContext({ viewport: vp, locale: "en-US" })).newPage();
  await page.goto(url); await page.waitForFunction(() => window.Game && Game.currentScreen === "start", null, { timeout: 30000 });
  const res = await page.evaluate(code => (0, eval)(code), probe); await page.context().close(); return res;
}
for (const vp of [{ width: 1024, height: 768 }, { width: 1280, height: 720 }, { width: 800, height: 600 }]) {
  const a = await run(baseline, vp), b = await run(restored, vp), cmp = {};
  for (const k of Object.keys(a.probes)) cmp[k] = JSON.stringify(a.probes[k]) === JSON.stringify(b.probes[k]) ? "IDENTICAL" : { baseline: a.probes[k], restored: b.probes[k] };
  report.viewports[`${vp.width}x${vp.height}`] = { qsize: a.viewport, result: cmp, original: a.probes };
}
await browser.close();
writeFileSync(resolve(here, "../evidence/m3-parity.json"), JSON.stringify(report, null, 1));
const ok = Object.values(report.viewports).every(v => Object.values(v.result).every(x => x === "IDENTICAL"));
console.log(JSON.stringify({ ok, summary: Object.fromEntries(Object.entries(report.viewports).map(([k, v]) => [k, v.result])) }, null, 1).slice(0, 4000));
process.exit(ok ? 0 : 1);
