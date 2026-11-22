#!/usr/bin/env node
// SPDX-License-Identifier: GPL-3.0-only
// Writes MANIFEST.sha256.txt: SHA-256 of every file that ships (public/) and
// of the frozen upstream snapshot (reference/). `--check` verifies instead.
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));

export function listFiles(dir) {
  return readdirSync(dir).sort().flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? listFiles(p) : [p];
  });
}

export function buildManifest() {
  const lines = [];
  for (const top of ["public", "reference"]) {
    for (const file of listFiles(join(root, top))) {
      const hash = createHash("sha256").update(readFileSync(file)).digest("hex");
      lines.push(`${hash}  ${relative(root, file).split("\\").join("/")}`);
    }
  }
  return lines.join("\n") + "\n";
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const target = join(root, "MANIFEST.sha256.txt");
  const manifest = buildManifest();
  if (process.argv.includes("--check")) {
    const ok = readFileSync(target, "utf8") === manifest;
    console.log(ok ? "manifest is current" : "manifest is stale: run node scripts/manifest.mjs");
    process.exit(ok ? 0 : 1);
  }
  writeFileSync(target, manifest);
  console.log(`wrote ${target} (${manifest.split("\n").length - 1} files)`);
}
