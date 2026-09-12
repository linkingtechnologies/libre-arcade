// SPDX-License-Identifier: GPL-3.0-only

export const DEFAULT_BRISCOLABOT_POLICY_WEIGHTS_URL = new URL(
  "../../../assets/models/briscolabot/briscola-bot-v3-policy.bin",
  import.meta.url
);

const L1_WEIGHT_COUNT = 256 * 162;
const L1_BIAS_COUNT = 256;
const L2_WEIGHT_COUNT = 256 * 256;
const L2_BIAS_COUNT = 256;
const L3_WEIGHT_COUNT = 40 * 256;
const L3_BIAS_COUNT = 40;
const TOTAL_FLOATS =
  L1_WEIGHT_COUNT + L1_BIAS_COUNT +
  L2_WEIGHT_COUNT + L2_BIAS_COUNT +
  L3_WEIGHT_COUNT + L3_BIAS_COUNT;

let defaultPolicyPromise = null;

function exactArrayBuffer(bytes) {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

async function loadArrayBuffer(url) {
  if (url.protocol === "file:") {
    const { readFile } = await import("node:fs/promises");
    const bytes = await readFile(url);
    return exactArrayBuffer(bytes);
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Unable to load BriscolaBot policy weights: ${response.status}`);
  }
  return response.arrayBuffer();
}

function splitPolicyWeights(buffer) {
  if (buffer.byteLength !== TOTAL_FLOATS * 4) {
    throw new Error(
      `Unexpected BriscolaBot policy weight size: ${buffer.byteLength} bytes`
    );
  }

  const all = new Float32Array(buffer);
  let offset = 0;
  const take = (count) => {
    const view = all.subarray(offset, offset + count);
    offset += count;
    return view;
  };

  return Object.freeze({
    w1: take(L1_WEIGHT_COUNT),
    b1: take(L1_BIAS_COUNT),
    w2: take(L2_WEIGHT_COUNT),
    b2: take(L2_BIAS_COUNT),
    w3: take(L3_WEIGHT_COUNT),
    b3: take(L3_BIAS_COUNT)
  });
}

async function loadDefaultPolicy() {
  defaultPolicyPromise ??= loadArrayBuffer(DEFAULT_BRISCOLABOT_POLICY_WEIGHTS_URL)
    .then(splitPolicyWeights);
  return defaultPolicyPromise;
}

function mish(value) {
  // Numerically stable Mish: x * tanh(softplus(x)).
  let softplus;
  if (value > 20) softplus = value;
  else if (value < -20) softplus = Math.exp(value);
  else softplus = Math.log1p(Math.exp(value));
  return value * Math.tanh(softplus);
}

function denseMish(input, weights, bias, outputSize, inputSize, output) {
  for (let row = 0; row < outputSize; row += 1) {
    let sum = bias[row];
    const base = row * inputSize;
    for (let col = 0; col < inputSize; col += 1) {
      sum += weights[base + col] * input[col];
    }
    output[row] = mish(sum);
  }
}

function dense(input, weights, bias, outputSize, inputSize, output) {
  for (let row = 0; row < outputSize; row += 1) {
    let sum = bias[row];
    const base = row * inputSize;
    for (let col = 0; col < inputSize; col += 1) {
      sum += weights[base + col] * input[col];
    }
    output[row] = sum;
  }
}

export function evaluateBriscolaBotPolicy(observationVector, policy) {
  if (!(observationVector instanceof Float32Array) || observationVector.length !== 162) {
    throw new TypeError("BriscolaBot observation must be Float32Array(162)");
  }

  const hidden1 = new Float32Array(256);
  const hidden2 = new Float32Array(256);
  const logits = new Float32Array(40);

  denseMish(observationVector, policy.w1, policy.b1, 256, 162, hidden1);
  denseMish(hidden1, policy.w2, policy.b2, 256, 256, hidden2);
  dense(hidden2, policy.w3, policy.b3, 40, 256, logits);
  return logits;
}

/**
 * Deterministic benchmark runtime for BriscolaBot v3.
 *
 * It evaluates the exact actor weights extracted from the supplied upstream
 * ONNX model but stops before legal masking and Multinomial sampling. The
 * existing BriscolaBotAdapter then samples only legal logits using SeededRandom.
 */
export class BriscolaBotDeterministicRuntime {
  constructor({ policyLoader = loadDefaultPolicy } = {}) {
    this.policyLoader = policyLoader;
  }

  reset() {
    // Stateless policy; loaded weights are intentionally cached.
  }

  async infer(observationVector, actionMask) {
    if (!actionMask || actionMask.length !== 40) {
      throw new TypeError("BriscolaBot action mask must contain 40 values");
    }
    const policy = await this.policyLoader();
    const logits = evaluateBriscolaBotPolicy(observationVector, policy);

    // Mirror the upstream legal mask. The adapter also restricts sampling to
    // cards in the current hand, making illegal selection impossible twice.
    for (let i = 0; i < 40; i += 1) {
      if (Number(actionMask[i]) === 0) logits[i] = -Infinity;
    }

    return {
      logits: {
        type: "float32",
        dims: [1, 40],
        data: logits
      }
    };
  }
}

export { splitPolicyWeights };
