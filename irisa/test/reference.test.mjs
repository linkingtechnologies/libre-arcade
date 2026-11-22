// The frozen upstream snapshot and the assets reused from it are byte for byte
// what commit 4dada41 contains.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import { ROOT } from "./helpers/engine.mjs";
import levels from "../public/js/game/levels.js";

const sums = readFileSync(`${ROOT}/reference/SHA256SUMS.txt`, "utf8")
  .split("\n")
  .filter(Boolean)
  .map((line) => {
    const [hash, ...rest] = line.split("  ");
    return { hash, path: rest.join("  ") };
  });

const sha = (file) => createHash("sha256").update(readFileSync(file)).digest("hex");
const where = (path) =>
  /^static\/(audio|img)\//.test(path)
    ? `${ROOT}/public/assets/${path.slice("static/".length)}`
    : `${ROOT}/reference/irisa-4dada41/${path}`;

test("all 41 upstream files are present and unmodified", () => {
  assert.equal(sums.length, 41);
  for (const { hash, path } of sums) {
    assert.equal(sha(where(path)), hash, path);
  }
});

test("the recorded archive checksum and commit are in SOURCE.md", () => {
  const source = readFileSync(`${ROOT}/reference/SOURCE.md`, "utf8");
  assert.match(source, /4dada410bae9df2cc849e6808663b6043d3e7fb3/);
  assert.match(source, /a0963021385d4302f5a9b02b375a5c91c547f18c1de53d440ccdbcd349104bae/);
});

test("the committed bundle contains the same levels as src/levels.js", () => {
  const bundle = readFileSync(`${ROOT}/reference/irisa-4dada41/static/bundle.js`, "utf8");
  for (const level of levels) {
    for (const row of level) {
      assert.ok(bundle.includes(`"${row}"`) || bundle.includes(`'${row}'`), `row ${JSON.stringify(row)} missing from bundle`);
    }
  }
  assert.ok(bundle.includes("That's all for now"), "bundle ends the game the way the source does");
});
