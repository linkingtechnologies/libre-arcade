// SPDX-License-Identifier: GPL-3.0-only
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  evaluatePoianaPolicy,
  poianaPolicyWeightsUrl,
  splitPoianaPolicyWeights
} from "../src/players/poiana/PoianaDeterministicRuntime.js";

async function policy(name, architecture) {
  const bytes = await readFile(poianaPolicyWeightsUrl(name));
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  return splitPoianaPolicyWeights(buffer, architecture);
}

test("DQN policy tensor bundle has the expected upstream architecture", async () => {
  const p = await policy("blooming-bird", "dqn");
  assert.equal(p.w1.length, 64 * 519);
  assert.equal(p.w2.length, 64 * 64);
  assert.equal(p.w3.length, 3 * 64);
  const result = evaluatePoianaPolicy(new Float32Array(519), p);
  assert.ok([0, 1, 2].includes(result.action));
  assert.equal(result.qValues.length, 3);
});

test("QR-DQN policy averages 50 quantiles into three actions", async () => {
  const p = await policy("toasty-pine", "qrdqn-50");
  assert.equal(p.w3.length, 150 * 64);
  const result = evaluatePoianaPolicy(new Float32Array(519), p);
  assert.ok([0, 1, 2].includes(result.action));
  assert.equal(result.qValues.length, 3);
});
