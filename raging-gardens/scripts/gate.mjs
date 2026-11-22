#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Umberto Bresciani
// SPDX-License-Identifier: GPL-3.0-or-later

// Publication gate, fail-closed: exits non-zero (and so stops `npm run package`) unless every
// shipped file is accounted for and cleared.
//
//  1. every file under public/ is listed in public/assets/PROVENANCE.json with the right SHA-256;
//  2. every listed file exists, and every entry is verified: an SPDX tag we recognise, or
//     recorded evidence for a licence that may be redistributed;
//  3. no file shipped is, byte for byte, one of the upstream files whose licence is NOT shown
//     (reference/SOURCES.json, keep: excluded), and no path or name of the original artwork;
//  4. the music that the game needs is present and its hash is the one recorded;
//  5. nothing loads from a remote host except the collection's analytics beacon;
//  6. no runtime dependency, no framework or library file shipped.

import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = process.argv[2] ? resolve(process.argv[2]) : fileURLToPath(new URL("..", import.meta.url));
const pub = join(root, "public");
const problems = [];
const fail = (m) => problems.push(m);

function walk(dir) {
  return readdirSync(dir).sort().flatMap((n) => { const p = join(dir, n); return statSync(p).isDirectory() ? walk(p) : [p]; });
}
const sha = (buf) => createHash("sha256").update(buf).digest("hex");

const manifestPath = join(pub, "assets/PROVENANCE.json");
if (!existsSync(manifestPath)) { console.error("GATE FAILED: public/assets/PROVENANCE.json is missing (run scripts/update-provenance.mjs)"); process.exit(1); }
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const listed = new Map(manifest.files.map((f) => [f.path, f]));
const sources = JSON.parse(readFileSync(join(root, "reference/SOURCES.json"), "utf8"));
const blockedHashes = new Map(sources.files.filter((f) => f.keep === "excluded" || f.kind === "library-online-service").map((f) => [f.sha256, f.path]));

const present = new Map();
for (const abs of walk(pub)) {
  const rel = relative(pub, abs).split(sep).join("/");
  if (rel === "assets/PROVENANCE.json") continue;
  present.set(rel, readFileSync(abs));
}

// 1 and 2
for (const [rel, buf] of present) {
  const entry = listed.get(rel);
  if (!entry) { fail(`not in the provenance manifest: ${rel}`); continue; }
  if (entry.sha256 !== sha(buf)) fail(`hash differs from the manifest (re-run update-provenance after reviewing the change): ${rel}`);
  if (entry.verified !== true) fail(`unverified asset: ${rel} (${entry.evidence || "no evidence"})`);
  if (!entry.license) fail(`no licence recorded: ${rel}`);
}
for (const rel of listed.keys()) if (!present.has(rel)) fail(`listed but missing: ${rel}`);

// 3
for (const [rel, buf] of present) {
  const h = sha(buf);
  if (blockedHashes.has(h)) fail(`${rel} is identical to the blocked upstream file ${blockedHashes.get(h)}`);
  if (/stuz_|stremena|^art\//i.test(rel)) fail(`name suggests the original artwork: ${rel}`);
  if (/\.(png|jpe?g|gif|webp|ico|wav|mp3|aif+|aiff)$/i.test(rel)) fail(`binary media with no rule, refusing to ship: ${rel}`);
}

// 4: the music
const music = listed.get("assets/music/trouble-in-the-garden.ogg");
if (!music || music.verified !== true || music.license !== "CC0-1.0") fail("the CC0 music is not recorded as verified");
else if (!present.has(music.path) || sha(present.get(music.path)) !== music.sha256) fail("the music file does not match its recorded hash");

// 5
const REMOTE = /(?:https?:)?\/\/[\w.-]+\.[a-z]{2,}(?:\/[\w./-]*)?/gi;
// the analytics beacon, and one hyperlink (a link the player may follow, never a request the page makes)
const ALLOWED_HOSTS = ["gc.zgo.at", "grugnetto.goatcounter.com", "github.com/linkingtechnologies/libre-arcade"];
for (const [rel, buf] of present) {
  if (!/\.(js|mjs|html|css)$/.test(rel)) continue;
  for (const [i, line] of buf.toString("utf8").split("\n").entries()) {
    const code = line.trim();
    if (code.startsWith("//") || code.startsWith("*") || code.startsWith("/*") || code.startsWith("<!--")) continue; // comments may cite sources
    for (const m of code.match(REMOTE) || []) {
      if (!ALLOWED_HOSTS.some((h) => m.includes(h)) && !/w3\.org/.test(m)) fail(`remote reference in ${rel}:${i + 1}: ${m}`);
    }
  }
}

// 6
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
if (pkg.dependencies && Object.keys(pkg.dependencies).length) fail("package.json declares runtime dependencies");
for (const rel of present.keys()) if (/(^|\/)(node_modules|lib)\//.test(rel) || /crafty|jquery|backbone|underscore|require(js)?\.|modernizr/i.test(rel)) fail(`library file shipped: ${rel}`);

// notices shipped next to the game must be the project's own
for (const f of ["LICENSE", "THIRD_PARTY_NOTICES.md"]) {
  const a = join(root, f), b = join(pub, f);
  if (!existsSync(b) || !existsSync(a) || !readFileSync(a).equals(readFileSync(b))) fail(`public/${f} must be identical to ${f} at the game's root`);
}

if (problems.length) {
  console.error(`PUBLICATION GATE FAILED (${problems.length}):\n` + problems.map((p) => `  - ${p}`).join("\n"));
  process.exit(1);
}
console.log(`publication gate passed: ${present.size} files, all listed, hashed and cleared`);
