// SPDX-License-Identifier: MIT
// Oracle test: the original upstream page (reference/, `index.dev.html` with
// upstream's build/all.js and Phaser) and the restored page (public/) are
// driven by the same input scripts under a virtual clock and must produce the
// same scene on every frame (see GAMEPLAY-PARITY.md). Slow (minutes).
// E1_SKIP_BROWSER=1 skips it; E1_FAST=1 runs only the four level scenarios.

import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { findChrome } from "../tools/cdp.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
let chromeOk = true;
try { findChrome(); } catch { chromeOk = false; }
const skip = !chromeOk || process.env.E1_SKIP_BROWSER ? "Chrome not available" : false;

const servers = [];
async function serve(dir, port) {
  const child = spawn(process.execPath, [`${root}scripts/serve.mjs`, dir, String(port)], { stdio: "ignore" });
  servers.push(child);
  for (let i = 0; i < 40; i++) {
    try { if ((await fetch(`http://localhost:${port}/`)).status < 500) return; } catch { /* retry */ }
    await new Promise((r) => setTimeout(r, 150));
  }
  throw new Error("server did not start");
}

test("original and restored builds agree frame by frame on every level scenario", { skip, timeout: 40 * 60 * 1000 }, async () => {
  const base = 8700 + Math.floor(Math.random() * 200);
  await serve(`${root}reference/elemental-one-609636d`, base);
  await serve(`${root}public`, base + 1);
  process.env.E1_ORIGINAL_URL = `http://localhost:${base}/index.dev.html`;
  process.env.E1_RESTORED_URL = `http://localhost:${base + 1}/#play`;
  try {
    const { runParity } = await import("../tools/parity.mjs");
    const { LEVEL_NAMES, FUZZ_NAMES } = await import("../tools/scenarios.mjs");
    const res = await runParity(process.env.E1_FAST ? LEVEL_NAMES : [...LEVEL_NAMES, ...FUZZ_NAMES], () => {});
    for (const r of res) {
      assert.ok(r.identical, `${r.level}: traces differ at frame ${r.firstDiff} ${JSON.stringify(r.diffDetail)}`);
      for (const c of r.checks) assert.ok(c.restored && c.original, `${c.desc} (restored=${c.restored}, original=${c.original})`);
      if (r.level.startsWith("fuzz-")) assert.ok(r.playerRange.x[1] - r.playerRange.x[0] > 150, `${r.level}: scenario moved the player`);
    }
  } finally {
    for (const s of servers) s.kill();
  }
});
