#!/usr/bin/env node
// SPDX-License-Identifier: MIT
// Dev tooling. Runs every level scenario on the ORIGINAL (reference/) and the
// RESTORED (public/) build under the virtual clock and compares the scene
// digest frame by frame. Needs the two static servers (see test/parity.test.mjs).
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { open, replay } from "./trace.mjs";
import { build, FUZZ_NAMES, LEVEL_NAMES } from "./scenarios.mjs";

// Frames are equal only when every object matches exactly (after __align in
// trace.mjs both builds share the same sub-frame clock phase, so no tolerance is needed).
export function sameFrame(sa, sb) {
  return sa === sb;
}

export async function runParity(levels = [...LEVEL_NAMES, ...FUZZ_NAMES], log = console.log) {
  const results = [];
  for (const level of levels) {
    const sc = build(level);
    const traces = {}, logs = {};
    for (const kind of ["original", "restored"]) {
      const api = await open(kind, { level: level.replace(/^fuzz-/, "") });
      traces[kind] = await replay(api, sc.script, sc.frames);
      logs[kind] = api.log;
      await api.close();
    }
    let firstDiff = -1;
    for (let i = 0; i < sc.frames; i++) if (!sameFrame(traces.original[i], traces.restored[i])) { firstDiff = i; break; }
    let diffDetail = null;
    if (firstDiff >= 0) {
      const a = JSON.parse(traces.original[firstDiff]), b = JSON.parse(traces.restored[firstDiff]);
      diffDetail = { frame: firstDiff, state: [a.state, b.state], cam: [a.cam, b.cam], objects: [] };
      for (let i = 0; i < Math.max(a.objs.length, b.objs.length); i++) if (JSON.stringify(a.objs[i]) !== JSON.stringify(b.objs[i])) diffDetail.objects.push([i, a.objs[i], b.objs[i]]);
      diffDetail.objects = diffDetail.objects.slice(0, 8);
    }
    const ps = traces.restored.map((t) => JSON.parse(t).objs.find((o) => o[0] === "p1")).filter(Boolean);
    const range = ps.length ? { x: [Math.min(...ps.map((q) => q[1])), Math.max(...ps.map((q) => q[1]))], y: [Math.min(...ps.map((q) => q[2])), Math.max(...ps.map((q) => q[2]))] } : null;
    const checks = sc.checks.map((c) => {
      const d = JSON.parse(traces.restored[Math.min(c.frame, sc.frames - 1)]);
      const dOrig = JSON.parse(traces.original[Math.min(c.frame, sc.frames - 1)]);
      return { desc: c.desc, restored: !!c.test(d), original: !!c.test(dOrig), frame: c.frame };
    });
    results.push({ level, frames: sc.frames, identical: firstDiff === -1, firstDiff, diffDetail, playerRange: range, checks, errors: logs.restored.errors, failed: logs.restored.failed });
    log(`${level}: ${sc.frames} frames, traces (player x ${range ? Math.round(range.x[0]) + ".." + Math.round(range.x[1]) : "-"}, y ${range ? Math.round(range.y[0]) + ".." + Math.round(range.y[1]) : "-"}) ${firstDiff === -1 ? "IDENTICAL" : "DIFFER at frame " + firstDiff + " " + JSON.stringify(diffDetail).slice(0, 700)}`);
    for (const c of checks) log(`   ${c.restored && c.original ? "ok  " : "FAIL"} ${c.desc} (restored=${c.restored}, original=${c.original})`);
  }
  return results;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const res = await runParity(process.argv[2] ? [process.argv[2]] : undefined);
  if (process.argv[3]) writeFileSync(process.argv[3], JSON.stringify(res, null, 2));
  process.exit(res.every((r) => r.identical && r.checks.every((c) => c.restored && c.original)) ? 0 : 1);
}
