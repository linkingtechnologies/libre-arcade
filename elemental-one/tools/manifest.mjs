#!/usr/bin/env node
// SPDX-License-Identifier: MIT
// Dev tooling. Writes SOURCE-MANIFEST.json: SHA-256 of the acquired archive,
// of every retained reference file, of every file withheld from reference/
// (with the reason), and a classification of every file shipped in public/.
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const sha = (buf) => createHash("sha256").update(buf).digest("hex");
const walk = (dir) => readdirSync(dir).flatMap((n) => {
  const p = join(dir, n);
  return statSync(p).isDirectory() ? walk(p) : [p];
});
const rel = (base, p) => relative(base, p).split("\\").join("/");

const COMMIT = "609636d84f8abb20e49fdf00ab42428f4805d27b";
const refDir = join(root, "reference", "elemental-one-609636d");
const pubDir = join(root, "public");

const reference = Object.fromEntries(walk(refDir).map((p) => [rel(refDir, p), { sha256: sha(readFileSync(p)), bytes: statSync(p).size }]));

// Hashes recorded from the acquired archive before these files were removed from reference/.
const withheld = {
  "assets/fonts/minecraftia-webfont.eot": ["92dfe12abfb0e10004070a18c6f4ae49fee7c32d8ee74fe541b3366ddef590c0", 11360, "Minecraftia: 'Free for personal use' only; not redistributable (LICENSE-AUDIT.md)"],
  "assets/fonts/minecraftia-webfont.svg": ["6424add56fbbd58f024258e110722da2cfc1afd242fb250e9ab601659bfaa89e", 33086, "Minecraftia: personal use only"],
  "assets/fonts/minecraftia-webfont.ttf": ["7859170ed73e0c748723d507ec9920d3100640635f8dea5280864a224fe8f876", 41148, "Minecraftia: personal use only"],
  "assets/fonts/minecraftia-webfont.woff": ["f2f7b9d662afe0ffb7d8ccad51716b1cde60b3a706ff5849fdb4b6f64cd0a7d4", 12780, "Minecraftia: personal use only"],
  "assets/sounds/jump.wav": ["3784202588dc336890c19cf2c152888c32cd149bbfe61db2994e6101683f7a74", 39670, "No author or licence recorded anywhere upstream (absent from ATTRIBUTION.md); quarantined"],
  "assets/images/starring.png": ["44993957d1aade4fb688edd48e46c69c8f129f9fb7d5b994a288203bf3c65389", 847, "Page-background pattern with no attribution upstream; quarantined, not needed for gameplay"],
};

const INTEGRATION = new Set(["index.html", "css/arcade.css", "js/arcade.js", "js/i18n.js", "LICENSE", "CREDITS.md"]);
const GENERATED = { "js/game.js": "tools/bundle.mjs wrapper around unmodified reference src/*.js", "assets/sounds/jump.wav": "tools/make-jump.mjs (replaces quarantined upstream jump.wav)" };
const REPLACEMENT_FONT = new Set(["fonts/Jersey10-Regular.ttf", "fonts/OFL.txt"]);

const shipped = {};
for (const p of walk(pubDir)) {
  const r = rel(pubDir, p);
  const h = sha(readFileSync(p));
  let origin;
  if (GENERATED[r]) origin = { kind: "generated", how: GENERATED[r] };
  else if (INTEGRATION.has(r)) origin = { kind: "integration-layer" };
  else if (REPLACEMENT_FONT.has(r)) origin = { kind: "third-party-replacement", source: "google/fonts ofl/jersey10 (SIL OFL 1.1)" };
  else {
    const candidates = [`assets/${r.replace(/^assets\//, "")}`, r === "js/phaser.js" ? "deps/phaser.js" : null].filter(Boolean);
    const match = candidates.find((c) => reference[c]?.sha256 === h);
    origin = match ? { kind: "upstream-verbatim", reference: match } : { kind: "UNCLASSIFIED" };
  }
  shipped[r] = { sha256: h, bytes: statSync(p).size, ...origin };
}

const manifest = {
  project: "Elemental One",
  upstream: { repository: "https://github.com/voithos/elemental-one", commit: COMMIT, author: "Zaven Muradyan", license: "MIT" },
  acquisition: {
    archive: `https://codeload.github.com/voithos/elemental-one/zip/${COMMIT}`,
    archiveSha256: "aa64f706f30f4d4686c340040080b99fe66bb1f3bda188f3052f1a7843c76ce7",
    archiveBytes: 12142335,
    acquiredOn: "2026-11-22",
    note: "reference/elemental-one-609636d is that archive extracted, minus the withheld files listed below.",
  },
  referenceFiles: reference,
  withheldFromReference: Object.fromEntries(Object.entries(withheld).map(([k, [sha256, bytes, reason]]) => [k, { sha256, bytes, reason }])),
  shippedFiles: shipped,
};
writeFileSync(join(root, "SOURCE-MANIFEST.json"), JSON.stringify(manifest, null, 2) + "\n");
const unclassified = Object.entries(shipped).filter(([, v]) => v.kind === "UNCLASSIFIED");
console.log(`manifest: ${Object.keys(reference).length} reference files, ${Object.keys(shipped).length} shipped files, ${unclassified.length} unclassified`);
for (const [k] of unclassified) console.log("  UNCLASSIFIED", k);
if (unclassified.length) process.exit(1);
