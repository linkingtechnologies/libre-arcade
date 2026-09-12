// SPDX-License-Identifier: GPL-3.0-only
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, statSync } from "node:fs";
import { POIANA_MODELS, POIANA_MODELS_BY_WIN_RATE } from "../src/players/poiana/PoianaModels.js";

test("PoIAna catalog exposes all 23 upstream agents", () => {
  assert.equal(POIANA_MODELS.length, 23);
  assert.equal(new Set(POIANA_MODELS.map((model) => model.id)).size, 23);
  assert.equal(POIANA_MODELS.filter((model) => model.architecture === "dqn").length, 21);
  assert.deepEqual(
    POIANA_MODELS.filter((model) => model.architecture === "qrdqn-50").map((model) => model.name).sort(),
    ["devout-paper", "toasty-pine"]
  );
  assert.equal(POIANA_MODELS_BY_WIN_RATE[0].name, "blooming-bird");
  assert.ok(POIANA_MODELS.every((model) => !model.displayName.includes("%")));
});

test("every PoIAna identity ships both original ONNX and deterministic policy tensors", () => {
  for (const model of POIANA_MODELS) {
    const onnx = `assets/models/poiana/${model.name}.onnx`;
    const policy = `assets/models/poiana/${model.name}-policy.bin`;
    assert.ok(existsSync(onnx), onnx);
    assert.ok(existsSync(policy), policy);
    assert.ok(statSync(onnx).size > 100_000, onnx);
    assert.ok(statSync(policy).size > 100_000, policy);
  }
});
