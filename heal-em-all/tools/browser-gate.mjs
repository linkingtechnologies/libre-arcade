#!/usr/bin/env node
// SPDX-License-Identifier: GPL-3.0-or-later
// M2 browser gate (Chrome via playwright-core, not a repo dependency):
//   1. loads the restored page: no console errors, no failed or non-local requests, title scene reached, audio decoded
//   2. runs the M1 fixed-step probe (tools/probe-original.js) on the ORIGINAL baseline and on the restored page at the same
//      viewport and compares every result (parity of P1-P3, P5-P8 as defined in PARITY-TEST-PLAN.md)
//   PLAYWRIGHT_CORE=<node_modules/playwright-core> node tools/browser-gate.mjs <restoredUrl> <baselineUrl>
//   (baselineUrl from `node tools/serve-baseline.mjs 8765`, restoredUrl from `npm run dev`)
import { createRequire } from "node:module";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const here = dirname(fileURLToPath(import.meta.url));
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_CORE ?? "playwright-core");
const [restored, baseline] = [process.argv[2] ?? "http://127.0.0.1:8080/", process.argv[3] ?? "http://127.0.0.1:8765/index.html"];
const probe = readFileSync(resolve(here, "probe-original.js"), "utf8");
const browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--autoplay-policy=no-user-gesture-required"] });
const report = { restored, baseline, load: {}, parity: {} };

async function open(url) {
  const page = await (await browser.newContext({ viewport: { width: 1024, height: 768 } })).newPage();
  const rec = { console: [], pageErrors: [], failed: [], nonLocal: [], requests: 0 };
  const origin = new URL(url).origin;
  page.on("console", m => { if (!/goatcounter: not counting because of: localhost/.test(m.text())) rec.console.push(`${m.type()}: ${m.text()}`); }); // GoatCounter says this on localhost by design
  page.on("pageerror", e => rec.pageErrors.push(String(e)));
  page.on("requestfailed", r => rec.failed.push(`${r.url()} ${r.failure()?.errorText}`));
  page.on("response", r => { rec.requests++; if (r.status() >= 400) rec.failed.push(`${r.status()} ${r.url()}`); });
  // GoatCounter is the collection's analytics (AGENTS.md) and is allowed; anything else off-origin is a failure
  page.on("request", r => { const u = r.url(); if (!u.startsWith(origin) && !u.startsWith("data:") && !/^https?:\/\/(gc\.zgo\.at|grugnetto\.goatcounter\.com)\//.test(u)) rec.nonLocal.push(u); });
  await page.goto(url); await page.waitForFunction(() => window.Game && Game.currentScreen === "start", null, { timeout: 30000 });
  return { page, rec };
}

{ // 1. load gate
  const { page, rec } = await open(restored);
  rec.screen = await page.evaluate(() => Game.currentScreen);
  rec.audio = await page.evaluate(() => Object.fromEntries(Object.entries(Game.audio).map(([k, v]) => [k, +(Game.Q.asset(v)?.duration ?? 0).toFixed(2)])));
  rec.canvas = await page.evaluate(() => ({ w: Game.Q.width, h: Game.Q.height }));
  rec.fonts = await page.evaluate(() => [...document.fonts].filter(f => f.status === "loaded").map(f => f.family));
  rec.gaStub = await page.evaluate(() => typeof window.ga);
  report.load = rec;
}
async function runProbe(url) {
  const { page } = await open(url);
  return page.evaluate(code => (0, eval)(code), probe);
}
{ // 2. parity gate
  const a = await runProbe(baseline), b = await runProbe(restored);
  for (const name of Object.keys(a.probes)) report.parity[name] = JSON.stringify(a.probes[name]) === JSON.stringify(b.probes[name]) ? "IDENTICAL" : { baseline: a.probes[name], restored: b.probes[name] };
  report.env = { baseline: a.env, restored: b.env };
}
await browser.close();
writeFileSync(resolve(here, "../evidence/m2-browser-gate.json"), JSON.stringify(report, null, 1));
const ok = !report.load.console.length && !report.load.pageErrors.length && !report.load.failed.length && !report.load.nonLocal.length && Object.values(report.parity).every(v => v === "IDENTICAL");
console.log(JSON.stringify({ ok, load: report.load, parity: report.parity }, null, 1).slice(0, 5000));
process.exit(ok ? 0 : 1);
