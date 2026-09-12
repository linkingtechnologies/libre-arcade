// SPDX-License-Identifier: GPL-3.0-only
import test from "node:test";
import assert from "node:assert/strict";
import { PoianaRuntime } from "../src/players/poiana/PoianaRuntime.js";

class FakeTensor {
  constructor(type, data, dims) {
    this.type = type;
    this.data = data;
    this.dims = dims;
  }
}

test("PoIAna runtime feeds one float32[1,519] ONNX input", async () => {
  let captured = null;
  const fakeOrt = { Tensor: FakeTensor };
  const session = {
    inputNames: ["input"],
    async run(feeds) {
      captured = feeds;
      return { output: { data: BigInt64Array.of(2n), dims: [1], type: "int64" } };
    }
  };
  const runtime = new PoianaRuntime({
    modelUrl: "./fake.onnx",
    runtimeLoader: async () => fakeOrt,
    sessionFactory: async () => session
  });

  const result = await runtime.infer(new Float32Array(519));
  assert.equal(Object.keys(captured).length, 1);
  assert.ok(captured.input instanceof FakeTensor);
  assert.equal(captured.input.type, "float32");
  assert.deepEqual(captured.input.dims, [1, 519]);
  assert.equal(captured.input.data.length, 519);
  assert.equal(result.output.data[0], 2n);
});

test("PoIAna runtime rejects a wrong observation width", async () => {
  const runtime = new PoianaRuntime({
    modelUrl: "./fake.onnx",
    runtimeLoader: async () => ({ Tensor: FakeTensor }),
    sessionFactory: async () => ({ inputNames: ["input"], run: async () => ({}) })
  });
  await assert.rejects(() => runtime.infer(new Float32Array(518)), /519/);
});
