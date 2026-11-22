import assert from "node:assert/strict";
import test from "node:test";
import levels from "../public/js/game/levels.js";
import * as entityClasses from "../public/js/game/entities.js";
import { loadPort } from "./helpers/engine.mjs";
import { solveLevel } from "./helpers/solver.mjs";

test("the port ships the same 20 levels as the original", async () => {
  const original = (await import("./helpers/engine.mjs")).REF_SRC;
  const { readFileSync } = await import("node:fs");
  const a = readFileSync(`${original}/levels.js`, "utf8");
  const b = readFileSync(new URL("../public/js/game/levels.js", import.meta.url), "utf8");
  assert.equal(b, a, "levels.js must stay byte for byte upstream's");
  assert.equal(levels.length, 20);
  for (const level of levels) {
    assert.equal(level.length, 10);
    for (const row of level) assert.equal(row.length, 10);
    assert.equal(level.join("").split("@").length - 1, 1, "exactly one player");
    assert.equal(level.join("").split("!").length - 1, 1, "exactly one door");
  }
});

test("every level can be won (exhaustive search of the real rules)", async () => {
  const ctx = await loadPort();
  const lengths = [];
  for (let n = 0; n < levels.length; n += 1) {
    const solution = solveLevel(ctx, entityClasses, n);
    assert.ok(solution, `level ${n + 1} has no winning line`);
    lengths.push(solution.path.length);
  }
  console.log("shortest solutions:", lengths.join(" "));
});
