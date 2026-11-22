#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Umberto Bresciani
// SPDX-License-Identifier: GPL-3.0-or-later

// Recreates the complete upstream trees (including the files this repository
// deliberately does not carry: the artwork and sound effects whose licence is
// not demonstrated) under reference/.fetched/, checked out at the exact commits
// recorded in reference/SOURCES.json, and verifies the SHA-256 of every file.
//
//   node scripts/fetch-original.mjs          fetch (if needed) and verify
//   node scripts/fetch-original.mjs --check  only verify the committed copies
//
// reference/.fetched/ is git-ignored. It exists so the behavioural oracle
// (tools/oracle/) can run the real original game, and so anyone can confirm
// that the hashes recorded here belong to the files they say they do. Nothing in
// it is ever copied into public/ or into a release.

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const manifest = JSON.parse(readFileSync(join(root, "reference/SOURCES.json"), "utf8"));
const sha256 = (buf) => createHash("sha256").update(buf).digest("hex");
const checkOnly = process.argv.includes("--check");

const committedDir = { orig: "reference/original", facebook: "reference/facebook-adaptation" };
const fetchedDir = { orig: "reference/.fetched/orig", facebook: "reference/.fetched/facebook" };

let bad = 0;
let ok = 0;

function verify(label, base, files) {
  for (const f of files) {
    const p = join(root, base, f.path);
    if (!existsSync(p)) { console.error(`MISSING ${label}: ${f.path}`); bad++; continue; }
    if (sha256(readFileSync(p)) !== f.sha256) { console.error(`HASH MISMATCH ${label}: ${f.path}`); bad++; continue; }
    ok++;
  }
}

for (const repo of manifest.repositories) {
  verify(`committed ${repo.id}`, committedDir[repo.id], manifest.files.filter((f) => f.repo === repo.id && f.keep === "source"));
}

if (!checkOnly) {
  for (const repo of manifest.repositories) {
    const dir = join(root, fetchedDir[repo.id]);
    if (!existsSync(join(dir, ".git"))) {
      console.log(`cloning ${repo.url} ...`);
      execFileSync("git", ["clone", "--quiet", repo.url, dir], { stdio: "inherit" });
    }
    execFileSync("git", ["-C", dir, "-c", "advice.detachedHead=false", "checkout", "--quiet", repo.commit], { stdio: "inherit" });
    verify(`fetched ${repo.id}`, fetchedDir[repo.id], manifest.files.filter((f) => f.repo === repo.id));
  }
}

console.log(`${ok} files verified, ${bad} problems`);
process.exit(bad ? 1 : 0);
