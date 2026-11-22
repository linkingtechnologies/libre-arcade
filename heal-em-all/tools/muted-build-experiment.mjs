#!/usr/bin/env node
// SPDX-License-Identifier: GPL-3.0-or-later
// M1 experiment: does the UNMODIFIED original survive with every /audio/* request answered 404?
//   node tools/serve-baseline.mjs 8766 --no-audio ; PLAYWRIGHT_CORE=... node tools/muted-build-experiment.mjs
import { createRequire } from "node:module";
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const here = dirname(fileURLToPath(import.meta.url));
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_CORE ?? "playwright-core");
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await (await browser.newContext({ viewport: { width: 1024, height: 768 } })).newPage();
const rec = { console: [], pageErrors: [], failed: [] };
page.on("console", m => rec.console.push(`${m.type()}: ${m.text()}`)); page.on("pageerror", e => rec.pageErrors.push(String(e)));
page.on("response", r => { if (r.status() >= 400) rec.failed.push(`${r.status()} ${r.url()}`); });
await page.goto(process.argv[2] ?? "http://127.0.0.1:8766/index.html");
await page.waitForTimeout(6000);
rec.screen = await page.evaluate(() => window.Game && Game.currentScreen);
rec.loadingDivStillThere = await page.evaluate(() => !!document.getElementById("loading"));
rec.progressWidth = await page.evaluate(() => document.getElementById("loading-progress")?.style.width);
writeFileSync(resolve(here, "../evidence/" + (process.argv[3] ?? "muted-build-experiment.json")), JSON.stringify(rec, null, 1)); console.log(JSON.stringify(rec, null, 1));
await browser.close();
