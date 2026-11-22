#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Umberto Bresciani
// SPDX-License-Identifier: GPL-3.0-or-later

// Runs oracle scenarios in a headless Chromium-family browser (Edge or Chrome,
// whichever is installed; set CHROME to force one) and leaves the results in
// tools/oracle/out/<name>.json.
//
//   node tools/oracle/run.mjs                  every scenario in scenarios.json
//   node tools/oracle/run.mjs greedy-1 full    one scenario (full = also keep readable states)
//
// Needs reference/.fetched/orig: run `node scripts/fetch-original.mjs` first.

import { spawn } from "node:child_process";
import { existsSync, readFileSync, mkdtempSync, rmSync, mkdirSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { startServer } from "./server.mjs";

const here = fileURLToPath(new URL(".", import.meta.url));
const outDir = join(here, "out");
mkdirSync(outDir, { recursive: true });

const candidates = [
  process.env.CHROME,
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].filter(Boolean);
const browser = candidates.find((p) => existsSync(p));
if (!browser) { console.error("no Chromium-family browser found; set CHROME"); process.exit(2); }
if (!existsSync(join(here, "../../reference/.fetched/orig/src"))) { console.error("run `node scripts/fetch-original.mjs` first"); process.exit(2); }

const scenarios = JSON.parse(readFileSync(join(here, "scenarios.json"), "utf8"));
const wanted = process.argv[2];
const full = process.argv[3] === "full";
const list = wanted ? scenarios.filter((s) => s.name === wanted) : scenarios;
if (!list.length) { console.error("no such scenario"); process.exit(2); }

const server = await startServer(0);
const port = server.address().port;

async function runOne(s) {
  const out = join(outDir, `${s.name}.json`);
  const err = join(outDir, "error.json");
  for (const f of [out, err]) if (existsSync(f)) unlinkSync(f);
  const profile = mkdtempSync(join(tmpdir(), "rg-oracle-"));
  const url = `http://127.0.0.1:${port}/?name=${s.name}&mode=${s.mode}&seed=${s.seed}${s.frames ? `&frames=${s.frames}` : ""}${s.carrots ? `&carrots=${s.carrots}` : ""}${full ? "&full=1" : ""}`;
  const child = spawn(browser, ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", `--user-data-dir=${profile}`, url], { stdio: "ignore" });
  const started = Date.now();
  while (Date.now() - started < 300000) {
    await new Promise((r) => setTimeout(r, 400));
    if (existsSync(err) || existsSync(out)) { await new Promise((r) => setTimeout(r, 600)); break; }
  }
  child.kill();
  await new Promise((r) => setTimeout(r, 400));
  try { rmSync(profile, { recursive: true, force: true }); } catch { /* the browser may still hold its profile for a moment */ }
  if (existsSync(err)) console.log(`FAIL ${s.name}: ${readFileSync(err, "utf8").slice(0, 400)}`);
  else console.log(existsSync(out) ? `ok   ${s.name}` : `FAIL ${s.name} (timeout)`);
}

for (const s of list) await runOne(s);
server.close();
process.exit(0);
