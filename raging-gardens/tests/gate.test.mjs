// SPDX-FileCopyrightText: 2026 Umberto Bresciani
// SPDX-License-Identifier: GPL-3.0-or-later

// The publication gate must fail closed. Each case copies the shippable part of the project to a
// temporary folder, breaks one rule, and expects the gate to refuse.

import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, rmSync, writeFileSync, readFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const gate = join(root, "scripts/gate.mjs");

function sandbox() {
  const dir = mkdtempSync(join(tmpdir(), "rg-gate-"));
  cpSync(join(root, "public"), join(dir, "public"), { recursive: true });
  mkdirSync(join(dir, "reference"));
  cpSync(join(root, "reference/SOURCES.json"), join(dir, "reference/SOURCES.json"));
  for (const f of ["package.json", "LICENSE", "THIRD_PARTY_NOTICES.md"]) cpSync(join(root, f), join(dir, f));
  return dir;
}
function run(dir) {
  const r = spawnSync(process.execPath, [gate, dir], { encoding: "utf8" });
  return { code: r.status, out: r.stdout + r.stderr };
}
function withBreak(name, expectInOutput, mutate) {
  test(`gate refuses: ${name}`, () => {
    const dir = sandbox();
    try {
      mutate(dir);
      const r = run(dir);
      assert.notEqual(r.code, 0, r.out);
      assert.match(r.out, expectInOutput);
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });
}

test("gate passes on the project as it is", () => {
  const r = run(root);
  assert.equal(r.code, 0, r.out);
});

withBreak("an image no rule covers (the original artwork would be one)", /not in the provenance manifest|binary media/, (d) => writeFileSync(join(d, "public/stuz_rabbit.png"), Buffer.from([137, 80, 78, 71])));
withBreak("a file in the manifest whose bytes changed", /hash differs/, (d) => writeFileSync(join(d, "public/src/rng.js"), readFileSync(join(d, "public/src/rng.js"), "utf8") + "\n// changed\n"));
withBreak("a manifest entry marked unverified", /unverified asset/, (d) => {
  const p = join(d, "public/assets/PROVENANCE.json");
  const m = JSON.parse(readFileSync(p, "utf8"));
  m.files.find((f) => f.path === "assets/music/trouble-in-the-garden.ogg").verified = false;
  writeFileSync(p, JSON.stringify(m));
});
withBreak("the music missing", /listed but missing/, (d) => rmSync(join(d, "public/assets/music"), { recursive: true }));
withBreak("a byte-for-byte copy of a blocked upstream file", /identical to the blocked upstream file/, (d) => {
  const src = JSON.parse(readFileSync(join(d, "reference/SOURCES.json"), "utf8"));
  const blocked = src.files.find((f) => f.keep === "excluded" && f.path === "sfx/pull.ogg");
  // forge the situation: a shipped file whose hash equals a blocked one
  src.files.push({ ...blocked, path: "x", sha256: JSON.parse(readFileSync(join(d, "public/assets/PROVENANCE.json"), "utf8")).files.find((f) => f.path === "src/rng.js").sha256 });
  writeFileSync(join(d, "reference/SOURCES.json"), JSON.stringify(src));
});
withBreak("a remote script", /remote reference/, (d) => {
  const p = join(d, "public/index.html");
  writeFileSync(p, readFileSync(p, "utf8").replace("</body>", '<script src="https://cdn.example.com/x.js"></script></body>'));
  const m = JSON.parse(readFileSync(join(d, "public/assets/PROVENANCE.json"), "utf8"));
  m.files.find((f) => f.path === "index.html").sha256 = "0".repeat(64); // the hash failure is expected too
  writeFileSync(join(d, "public/assets/PROVENANCE.json"), JSON.stringify(m));
});
withBreak("a library file shipped", /library file shipped|not in the provenance manifest/, (d) => {
  mkdirSync(join(d, "public/lib"));
  writeFileSync(join(d, "public/lib/crafty.js"), "// SPDX-License-Identifier: MIT\n");
});
withBreak("notices that differ from the project's", /must be identical/, (d) => writeFileSync(join(d, "THIRD_PARTY_NOTICES.md"), "changed"));
