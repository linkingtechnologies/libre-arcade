#!/usr/bin/env node
// SPDX-License-Identifier: GPL-3.0-or-later
// Generates SOURCE-MANIFEST.json (SHA-256 of every preserved upstream file + archive checksums) and
// ASSET-INVENTORY.csv. `--verify` recomputes the snapshot checksums and fails on any mismatch.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ref = join(root, "reference");
const sha = b => createHash("sha256").update(b).digest("hex");
const walk = d => readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]);
function tree(dir) {
  const files = walk(dir).map(p => relative(dir, p).split("\\").join("/")).sort().map(p => ({ path: p, bytes: statSync(join(dir, p)).size, sha256: sha(readFileSync(join(dir, p))) }));
  const treeChecksum = sha(files.map(f => `${f.sha256}  ${f.path}\n`).join(""));
  return { files, treeChecksum };
}
const QUARANTINED = [/^upstream-master\/app\/audio\//, /^upstream-gh-pages\/audio\//]; // never committed (see .gitignore)
const master = tree(join(ref, "upstream-master")), pages = tree(join(ref, "upstream-gh-pages"));
const archives = Object.fromEntries(["game-off-2013.bundle", "upstream-master-66950cd.tar", "upstream-gh-pages-2f8629d.tar"].filter(n => existsSync(join(ref, n))).map(n => [n, { bytes: statSync(join(ref, n)).size, sha256: sha(readFileSync(join(ref, n))) }]));
const prev = existsSync(join(root, "SOURCE-MANIFEST.json")) ? JSON.parse(readFileSync(join(root, "SOURCE-MANIFEST.json"), "utf8")) : null;
if (process.argv.includes("--verify")) {
  // Works on a clean checkout, where the quarantined audio and the archives are absent: every file that IS present must match its recorded hash,
  // and every recorded file outside the quarantine must be present. If everything is present the tree checksums must match too.
  const bad = [];
  for (const [key, snap] of [["masterFiles", master], ["ghPagesFiles", pages]]) {
    const have = new Map(snap.files.map(f => [f.path, f.sha256]));
    const dir = key === "masterFiles" ? "upstream-master/" : "upstream-gh-pages/";
    for (const f of prev[key]) {
      const quarantined = QUARANTINED.some(re => re.test(dir + f.path));
      if (!have.has(f.path)) { if (!quarantined) bad.push("missing " + dir + f.path); }
      else if (have.get(f.path) !== f.sha256) bad.push("changed " + dir + f.path);
    }
    for (const p of have.keys()) if (!prev[key].some(f => f.path === p)) bad.push("unexpected " + dir + p);
  }
  const complete = prev.masterFiles.length === master.files.length && prev.ghPagesFiles.length === pages.files.length;
  if (complete && (prev.snapshot.masterTreeChecksum !== master.treeChecksum || prev.snapshot.ghPagesTreeChecksum !== pages.treeChecksum)) bad.push("tree checksum");
  console.log(bad.length ? "MISMATCH: " + bad.join("; ") : "OK: reference snapshot matches SOURCE-MANIFEST.json" + (complete ? "" : " (quarantined audio not present, checked the rest)"));
  process.exit(bad.length ? 1 : 0);
}
const manifest = {
  schema: 1,
  generatedBy: "heal-em-all/tools/make-manifest.mjs",
  upstream: {
    url: "https://github.com/krzysu/game-off-2013", owner: "krzysu (Krzysztof Urbas)",
    creators: ["Krzysztof Urbas (programming, story)", "Pawel Madeja (graphics)"],
    selectedCommit: "66950cda39d2b91f114dcf1a0b0307972f24a68f", selectedCommitDate: "2019-07-24T17:41:42+02:00",
    selectedCommitSubject: "Clarify licensing and add GPL license (#1)",
    lastGameplayCommit: "e148bc56b8540b0b2ccf13174f61b72fbe9c738a (2013-12-02, typo + google analytics)",
    ghPagesCommit: "2f8629d385736a567ca84b775e3423f2064fa13e (2013-12-01, deploy)",
    developmentPeriod: "2013-10-14 (GitHub Game Off template commit) / 2013-10-30 (repo created) to 2013-12-02 (last game change); relicensing commit 2019-07-24",
    commitsAllRefs: 119, authors: { "Krzysztof Urbas": 103, "Lee Reilly": 14, "kmcnaught": 1, "pawelmadeja": 1 },
    fetchedOn: "2026-11-22",
  },
  snapshot: { masterDir: "reference/upstream-master", ghPagesDir: "reference/upstream-gh-pages", masterFiles: master.files.length, ghPagesFiles: pages.files.length,
    masterTreeChecksum: master.treeChecksum, ghPagesTreeChecksum: pages.treeChecksum,
    treeChecksumMethod: "sha256 over lines '<file sha256>  <path>\n', paths sorted bytewise, '/' separators, bytes exactly as committed (CRLF preserved)" },
  archives, masterFiles: master.files, ghPagesFiles: pages.files,
};
writeFileSync(join(root, "SOURCE-MANIFEST.json"), JSON.stringify(manifest, null, 1) + "\n");
console.log("manifest written:", master.files.length, "master files;", master.treeChecksum);
