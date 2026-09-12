// SPDX-License-Identifier: GPL-3.0-only
import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const modelUrl = new URL(
  "../assets/models/briscolabot/briscola-bot-v3.onnx",
  import.meta.url
);

test("bundled BriscolaBot v3 model matches the supplied upstream binary", async () => {
  const bytes = await readFile(modelUrl);
  const sha256 = createHash("sha256").update(bytes).digest("hex");

  assert.equal(bytes.length, 474612);
  assert.equal(
    sha256,
    "ab6fed4667cb9ddbacdd394d717108233ab2dbdced7ee4440d0bdfbce1cb53d2"
  );
});


test("derived deterministic BriscolaBot assets have the recorded hashes", async () => {
  const logitsUrl = new URL(
    "../assets/models/briscolabot/briscola-bot-v3-logits.onnx",
    import.meta.url
  );
  const weightsUrl = new URL(
    "../assets/models/briscolabot/briscola-bot-v3-policy.bin",
    import.meta.url
  );
  const [logits, weights] = await Promise.all([readFile(logitsUrl), readFile(weightsUrl)]);
  assert.equal(logits.length, 474625);
  assert.equal(weights.length, 471200);
  assert.equal(
    createHash("sha256").update(logits).digest("hex"),
    "4ef7a6f11aad0cdcb774bce5f2ffa2cdcd8d846de67fe692a6b9098151ce7206"
  );
  assert.equal(
    createHash("sha256").update(weights).digest("hex"),
    "d54496ac4cf09364d5a4c8f562fc1f6ab54e7d9465a2800dd791535bb613881b"
  );
});
