// SPDX-License-Identifier: GPL-3.0-only
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  DEFAULT_BRISCOLABOT_POLICY_WEIGHTS_URL,
  BriscolaBotDeterministicRuntime,
  evaluateBriscolaBotPolicy,
  splitPolicyWeights
} from "../src/players/briscolabot/BriscolaBotDeterministicRuntime.js";

test("BriscolaBot deterministic policy contains the exact 117,800 actor parameters", async () => {
  const bytes = await readFile(DEFAULT_BRISCOLABOT_POLICY_WEIGHTS_URL);
  assert.equal(bytes.length, 117800 * 4);
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  const policy = splitPolicyWeights(buffer);
  assert.equal(policy.w1.length, 256 * 162);
  assert.equal(policy.b1.length, 256);
  assert.equal(policy.w2.length, 256 * 256);
  assert.equal(policy.b2.length, 256);
  assert.equal(policy.w3.length, 40 * 256);
  assert.equal(policy.b3.length, 40);
});

test("BriscolaBot deterministic forward pass matches the extracted policy fixture", async () => {
  const bytes = await readFile(DEFAULT_BRISCOLABOT_POLICY_WEIGHTS_URL);
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  const policy = splitPolicyWeights(buffer);
  const input = new Float32Array(162);
  input[3] = 1;
  input[42] = 1;
  input[121] = 1;
  input[137] = 1;
  input[160] = 31 / 120;
  input[161] = 44 / 120;
  const logits = evaluateBriscolaBotPolicy(input, policy);

  // Values generated independently from the same ONNX initializers with NumPy.
  const expected = [
    7.8168182373046875,
    6.493154048919678,
    14.536737442016602,
    9.886391639709473,
    16.548412322998047
  ];
  for (let i = 0; i < expected.length; i += 1) {
    assert.ok(Math.abs(logits[i] - expected[i]) < 1e-5, `${i}: ${logits[i]}`);
  }
});

test("deterministic runtime masks illegal actions before seeded sampling", async () => {
  const runtime = new BriscolaBotDeterministicRuntime();
  const observation = new Float32Array(162);
  const mask = new BigInt64Array(40);
  mask[7] = 1n;
  mask[18] = 1n;
  const outputs = await runtime.infer(observation, mask);
  assert.equal(outputs.logits.data.length, 40);
  assert.equal(outputs.logits.data[0], -Infinity);
  assert.ok(Number.isFinite(outputs.logits.data[7]));
  assert.ok(Number.isFinite(outputs.logits.data[18]));
});
