// SPDX-License-Identifier: GPL-3.0-only
import test from "node:test";
import assert from "node:assert/strict";
import {
  BriscolaBotRuntime,
  DEFAULT_BRISCOLABOT_MODEL_URL,
  concatenateModelInput
} from "../src/players/briscolabot/BriscolaBotRuntime.js";

class FakeTensor {
  constructor(type, data, dims) {
    this.type = type;
    this.data = data;
    this.dims = dims;
  }
}

test("BriscolaBot runtime points to the bundled model", () => {
  assert.equal(DEFAULT_BRISCOLABOT_MODEL_URL, "./assets/models/briscolabot/briscola-bot-v3.onnx");
});

test("BriscolaBot runtime concatenates the upstream 162+40 model input", () => {
  const observation = new Float32Array(162);
  observation[0] = 1;
  observation[161] = 0.5;
  const mask = new BigInt64Array(40);
  mask[2] = 1n;
  mask[39] = 1n;

  const input = concatenateModelInput(observation, mask);
  assert.equal(input.length, 202);
  assert.equal(input[0], 1);
  assert.equal(input[161], 0.5);
  assert.equal(input[162 + 2], 1);
  assert.equal(input[162 + 39], 1);
  assert.equal(input[162 + 3], 0);
});

test("BriscolaBot runtime feeds the real ONNX signature float32[1,202]", async () => {
  let capturedFeeds = null;
  const session = {
    inputNames: ["input"],
    async run(feeds) {
      capturedFeeds = feeds;
      return { action: new FakeTensor("int64", BigInt64Array.from([2n]), [1]) };
    }
  };
  const runtime = new BriscolaBotRuntime({
    runtimeLoader: async () => ({ Tensor: FakeTensor }),
    sessionFactory: async () => session
  });

  const obs = new Float32Array(162);
  const mask = new BigInt64Array(40);
  mask[2] = 1n;
  const output = await runtime.infer(obs, mask);

  assert.equal(output.action.data[0], 2n);
  assert.equal(capturedFeeds.input.type, "float32");
  assert.deepEqual(capturedFeeds.input.dims, [1, 202]);
  assert.equal(capturedFeeds.input.data.length, 202);
  assert.equal(capturedFeeds.input.data[164], 1);
});

test("BriscolaBot runtime rejects a different ONNX signature", async () => {
  const runtime = new BriscolaBotRuntime({
    runtimeLoader: async () => ({ Tensor: FakeTensor }),
    sessionFactory: async () => ({ inputNames: ["observation", "mask"], async run() { return {}; } })
  });
  await assert.rejects(
    () => runtime.infer(new Float32Array(162), new BigInt64Array(40)),
    /input count: 2/
  );
});
