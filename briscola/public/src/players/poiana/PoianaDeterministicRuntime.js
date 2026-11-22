// SPDX-License-Identifier: GPL-3.0-only
import { POIANA_OBSERVATION_SIZE } from "./PoianaVectorizer.js";

const HIDDEN = 64;
const QUANTILES = 50;
const ACTIONS = 3;
const cache = new Map();

function exactArrayBuffer(bytes) {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

async function loadArrayBuffer(url) {
  if (url.protocol === "file:") {
    const { readFile } = await import("node:fs/promises");
    return exactArrayBuffer(await readFile(url));
  }
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Unable to load PoIAna policy weights: ${response.status}`);
  return response.arrayBuffer();
}

export function poianaPolicyWeightsUrl(modelName) {
  return new URL(`../../../assets/models/poiana/${modelName}-policy.bin`, import.meta.url);
}

export function splitPoianaPolicyWeights(buffer, architecture = "dqn") {
  const outputUnits = architecture === "qrdqn-50" ? QUANTILES * ACTIONS : ACTIONS;
  const counts = [
    HIDDEN * POIANA_OBSERVATION_SIZE,
    HIDDEN,
    HIDDEN * HIDDEN,
    HIDDEN,
    outputUnits * HIDDEN,
    outputUnits
  ];
  const total = counts.reduce((sum, value) => sum + value, 0);
  if (buffer.byteLength !== total * 4) {
    throw new Error(`Unexpected PoIAna policy weight size: ${buffer.byteLength} bytes for ${architecture}`);
  }

  const all = new Float32Array(buffer);
  let offset = 0;
  const take = (count) => {
    const view = all.subarray(offset, offset + count);
    offset += count;
    return view;
  };
  return Object.freeze({
    architecture,
    outputUnits,
    w1: take(counts[0]), b1: take(counts[1]),
    w2: take(counts[2]), b2: take(counts[3]),
    w3: take(counts[4]), b3: take(counts[5])
  });
}

async function loadDefaultPolicy(modelName, architecture) {
  const key = `${modelName}:${architecture}`;
  if (!cache.has(key)) {
    cache.set(key, loadArrayBuffer(poianaPolicyWeightsUrl(modelName))
      .then((buffer) => splitPoianaPolicyWeights(buffer, architecture)));
  }
  return cache.get(key);
}

function denseRelu(input, weights, bias, outputSize, inputSize) {
  const out = new Float32Array(outputSize);
  for (let row = 0; row < outputSize; row += 1) {
    let sum = bias[row];
    const base = row * inputSize;
    for (let col = 0; col < inputSize; col += 1) sum += weights[base + col] * input[col];
    out[row] = Math.max(0, sum);
  }
  return out;
}

function dense(input, weights, bias, outputSize, inputSize) {
  const out = new Float32Array(outputSize);
  for (let row = 0; row < outputSize; row += 1) {
    let sum = bias[row];
    const base = row * inputSize;
    for (let col = 0; col < inputSize; col += 1) sum += weights[base + col] * input[col];
    out[row] = sum;
  }
  return out;
}

function argmax(values) {
  let best = 0;
  for (let i = 1; i < values.length; i += 1) {
    // Upstream ONNX uses select_last_index=0, therefore ties keep the first.
    if (values[i] > values[best]) best = i;
  }
  return best;
}

export function evaluatePoianaPolicy(observationVector, policy) {
  if (!(observationVector instanceof Float32Array) || observationVector.length !== POIANA_OBSERVATION_SIZE) {
    throw new TypeError(`PoIAna observation must be Float32Array(${POIANA_OBSERVATION_SIZE})`);
  }
  const h1 = denseRelu(observationVector, policy.w1, policy.b1, HIDDEN, POIANA_OBSERVATION_SIZE);
  const h2 = denseRelu(h1, policy.w2, policy.b2, HIDDEN, HIDDEN);
  const raw = dense(h2, policy.w3, policy.b3, policy.outputUnits, HIDDEN);

  if (policy.architecture === "qrdqn-50") {
    // The upstream ONNX graph reshapes [150] -> [50,3], averages axis 1
    // (quantiles), then performs ArgMax over the three actions.
    const qValues = new Float32Array(ACTIONS);
    for (let q = 0; q < QUANTILES; q += 1) {
      for (let action = 0; action < ACTIONS; action += 1) {
        qValues[action] += raw[q * ACTIONS + action] / QUANTILES;
      }
    }
    return { action: argmax(qValues), qValues };
  }

  return { action: argmax(raw), qValues: raw };
}

export class PoianaDeterministicRuntime {
  constructor({ modelName, architecture = "dqn", policyLoader = null } = {}) {
    if (!modelName) throw new TypeError("PoianaDeterministicRuntime requires modelName");
    this.modelName = modelName;
    this.architecture = architecture;
    this.policyLoader = policyLoader ?? (() => loadDefaultPolicy(modelName, architecture));
  }

  reset() {}

  async infer(observationVector) {
    const policy = await this.policyLoader();
    const result = evaluatePoianaPolicy(observationVector, policy);
    return {
      action: {
        type: "int64",
        dims: [1],
        data: Int32Array.of(result.action)
      }
    };
  }
}
