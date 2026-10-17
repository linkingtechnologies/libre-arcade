#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
// SPDX-License-Identifier: GPL-3.0-only

// Writes SHA256SUMS.txt at the root of this folder: the SHA-256 of every file in it, one line each ("<hash>  <path>", paths with forward slashes,
// sorted by path), except node_modules/, game/ (a build artifact), .claude/ and the list itself. Run it after any change to a file of the folder.
//   node scripts/checksums.mjs            rewrite SHA256SUMS.txt
//   node scripts/checksums.mjs --check    change nothing; list what differs from the recorded list, and exit 1 if anything does

import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const LIST = join(ROOT, "SHA256SUMS.txt");
const SKIP = new Set(["node_modules", "game", ".claude", "SHA256SUMS.txt"]);

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    const rel = relative(ROOT, path).split(sep).join("/");
    if (SKIP.has(rel)) return [];
    return statSync(path).isDirectory() ? walk(path) : [rel];
  });
}

const files = walk(ROOT).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
const lines = files.map((rel) => `${createHash("sha256").update(readFileSync(join(ROOT, rel))).digest("hex")}  ${rel}`);

if (process.argv.includes("--check")) {
  let recorded = [];
  try { recorded = readFileSync(LIST, "utf8").split(/\r?\n/).filter(Boolean); } catch { /* no list yet: everything is new */ }
  const have = new Set(recorded);
  const want = new Set(lines);
  const changes = [
    ...lines.filter((l) => !have.has(l)).map((l) => `new or changed: ${l.slice(66)}`),
    ...recorded.filter((l) => !want.has(l) && !lines.some((m) => m.slice(66) === l.slice(66))).map((l) => `gone: ${l.slice(66)}`),
  ];
  for (const change of changes) console.log(change);
  console.log(changes.length ? `${changes.length} difference(s) from SHA256SUMS.txt` : `SHA256SUMS.txt is current (${lines.length} files)`);
  process.exitCode = changes.length ? 1 : 0;
} else {
  writeFileSync(LIST, lines.join("\n") + "\n");
  console.log(`SHA256SUMS.txt: ${lines.length} files`);
}
