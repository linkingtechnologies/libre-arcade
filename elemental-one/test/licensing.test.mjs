// SPDX-License-Identifier: MIT
// Fail-closed publication gate: every file under public/ must be on the
// allowlist below with a licence, and must match SOURCE-MANIFEST.json.
// Anything new, renamed or edited fails until someone clears it on purpose.

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const pub = join(root, "public");
const walk = (d) => readdirSync(d).flatMap((n) => (statSync(join(d, n)).isDirectory() ? walk(join(d, n)) : [join(d, n)]));
const rel = (p) => relative(pub, p).split("\\").join("/");
const sha = (p) => createHash("sha256").update(readFileSync(p)).digest("hex");
const manifest = JSON.parse(readFileSync(join(root, "SOURCE-MANIFEST.json"), "utf8"));

/** Publication allowlist: path prefix -> licence (see LICENSE-AUDIT.md for the evidence behind each). */
const ALLOW = [
  ["index.html", "MIT (integration)"],
  ["css/", "MIT (integration)"],
  ["js/arcade.js", "MIT (integration)"],
  ["js/i18n.js", "MIT (integration)"],
  ["js/game.js", "MIT (Zaven Muradyan)"],
  ["js/phaser.js", "MIT (Photon Storm, Pixi, PolyK)"],
  ["LICENSE", "licence text"],
  ["CREDITS.md", "credits"],
  ["fonts/Jersey10-Regular.ttf", "OFL-1.1"],
  ["fonts/OFL.txt", "licence text"],
  ["assets/sprites/", "CC0-1.0 (Kenney)"],
  ["assets/tilesets/", "CC0-1.0 (Kenney)"],
  ["assets/images/", "MIT / CC0 (author composite of Kenney tiles)"],
  ["assets/tilemaps/", "MIT (Zaven Muradyan)"],
  ["assets/sounds/happy.mp3", "CC-BY-3.0 (rezoner)"],
  ["assets/sounds/happy.ogg", "CC-BY-3.0 (rezoner)"],
  ["assets/sounds/air.wav", "CC0-1.0 (remaxim)"],
  ["assets/sounds/water.wav", "CC-BY-3.0 (kurt)"],
  ["assets/sounds/earth.wav", "CC-BY-3.0 (qubodup)"],
  ["assets/sounds/fire.wav", "CC-BY-SA-3.0 / GPL-3.0 (p0ss)"],
  ["assets/sounds/pickup.wav", "CC-BY-SA-3.0 / GPL-3.0 (p0ss)"],
  ["assets/sounds/jump.wav", "GPL-3.0-or-later (synthesized here)"],
];

test("every shipped file is on the publication allowlist", () => {
  for (const p of walk(pub)) {
    const r = rel(p);
    assert.ok(ALLOW.some(([prefix]) => r === prefix || (prefix.endsWith("/") && r.startsWith(prefix))), `not cleared for publication: ${r}`);
  }
});

test("shipped files match SOURCE-MANIFEST.json and none is unclassified", () => {
  const files = walk(pub).map(rel).sort();
  assert.deepEqual(files, Object.keys(manifest.shippedFiles).sort(), "run `npm run manifest` after changing public/");
  for (const f of files) {
    const m = manifest.shippedFiles[f];
    assert.notEqual(m.kind, "UNCLASSIFIED", f);
    assert.equal(sha(join(pub, f)), m.sha256, `${f} differs from the manifest`);
  }
});

test("the personal-use-only Minecraftia font is nowhere in the distributable game", () => {
  for (const p of walk(pub)) {
    const r = rel(p);
    assert.doesNotMatch(r, /minecraftia/i, r);
    assert.doesNotMatch(r, /\.(eot|woff2?|svg)$/i, `unexpected font/vector file ${r}`);
    if (/\.(ttf|otf)$/i.test(r)) assert.equal(r, "fonts/Jersey10-Regular.ttf");
  }
  const heads = ["index.html", "css/arcade.css", "js/arcade.js", "js/i18n.js"].map((f) => readFileSync(join(pub, f), "utf8"));
  for (const h of heads) assert.doesNotMatch(h, /minecraftia-webfont/i);
  // upstream's source asks for the family *name* 'minecraftiaregular'; the CSS must point it at the OFL font
  assert.match(readFileSync(join(pub, "css/arcade.css"), "utf8"), /font-family: 'minecraftiaregular';\s*src: url\('\.\.\/fonts\/Jersey10-Regular\.ttf'\)/);
});

test("withheld files are absent from reference/ and from public/, and only their hashes are kept", () => {
  const ref = join(root, "reference", "elemental-one-609636d");
  for (const [f, info] of Object.entries(manifest.withheldFromReference)) {
    assert.ok(!existsSync(join(ref, f)), `${f} must not be redistributed in reference/`);
    assert.match(info.sha256, /^[0-9a-f]{64}$/);
  }
  assert.ok(manifest.withheldFromReference["assets/sounds/jump.wav"]);
  // the shipped jump.wav is our synthesized one, not upstream's
  assert.notEqual(manifest.shippedFiles["assets/sounds/jump.wav"].sha256, manifest.withheldFromReference["assets/sounds/jump.wav"].sha256);
});

test("retained reference files still match their recorded hashes", () => {
  const ref = join(root, "reference", "elemental-one-609636d");
  const files = walk(ref).map((p) => relative(ref, p).split("\\").join("/")).sort();
  assert.deepEqual(files, Object.keys(manifest.referenceFiles).sort());
  for (const f of files) assert.equal(sha(join(ref, f)), manifest.referenceFiles[f].sha256, f);
});

test("upstream MIT notice and source commit are recorded", () => {
  assert.equal(manifest.upstream.commit, "609636d84f8abb20e49fdf00ab42428f4805d27b");
  const lic = readFileSync(join(pub, "LICENSE"), "utf8");
  assert.match(lic, /Copyright \(c\) 2014 Zaven Muradyan/);
  assert.match(lic, /Photon Storm/);
  const credits = readFileSync(join(pub, "CREDITS.md"), "utf8");
  for (const who of ["Zaven Muradyan", "Kenney", "rezoner", "remaxim", "kurt", "qubodup", "p0ss", "Jersey 10", "Minecraftia"]) assert.ok(credits.includes(who), `credits mention ${who}`);
});

test("no remote URLs in the game page or scripts besides the documented ones", () => {
  const allowed = [
    "linkingtechnologies.github.io/libre-arcade", // link back to the arcade
    "github.com/voithos/elemental-one",             // credits link (not fetched)
    "creativecommons.org",                          // licence links in text only
    "grugnetto.goatcounter.com", "gc.zgo.at",       // collection-wide analytics snippet (AGENTS.md)
    "www.w3.org",
  ];
  for (const f of ["index.html", "css/arcade.css", "js/arcade.js", "js/i18n.js"]) {
    const text = readFileSync(join(pub, f), "utf8");
    for (const m of text.matchAll(/(?:https?:)?\/\/[a-z0-9.-]+\.[a-z]{2,}[^\s"'<>)]*/gi)) {
      assert.ok(allowed.some((a) => m[0].includes(a)), `unexpected remote reference in ${f}: ${m[0]}`);
    }
  }
});
