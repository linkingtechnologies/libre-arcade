// SPDX-License-Identifier: GPL-3.0-only

const DEFAULT_ORT_VERSION = "1.22.0";
const DEFAULT_ORT_BASE = `https://cdn.jsdelivr.net/npm/onnxruntime-web@${DEFAULT_ORT_VERSION}/dist/`;
const DEFAULT_ORT_SCRIPT = `${DEFAULT_ORT_BASE}ort.min.js`;
export const DEFAULT_BRISCOLABOT_MODEL_URL =
  "./assets/models/briscolabot/briscola-bot-v3.onnx";

let runtimePromise = null;

function loadScript(url) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[data-briscolabot-ort="${url}"]`);
    if (existing) {
      if (globalThis.ort) resolve(globalThis.ort);
      else existing.addEventListener("load", () => resolve(globalThis.ort), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = url;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.dataset.briscolabotOrt = url;
    script.addEventListener("load", () => resolve(globalThis.ort), { once: true });
    script.addEventListener("error", () => reject(new Error(`Unable to load ONNX Runtime Web from ${url}`)), { once: true });
    document.head.append(script);
  });
}

export async function loadOnnxRuntimeWeb({ scriptUrl = DEFAULT_ORT_SCRIPT, wasmBaseUrl = DEFAULT_ORT_BASE } = {}) {
  if (globalThis.ort) return globalThis.ort;
  if (typeof document === "undefined") {
    throw new Error("ONNX Runtime Web loader requires a browser document");
  }

  runtimePromise ??= loadScript(scriptUrl).then((ort) => {
    if (!ort?.InferenceSession || !ort?.Tensor) {
      throw new Error("ONNX Runtime Web loaded without the expected API");
    }
    ort.env.wasm.wasmPaths = wasmBaseUrl;
    return ort;
  });
  return runtimePromise;
}

function concatenateModelInput(observationVector, actionMask) {
  if (!(observationVector instanceof Float32Array) || observationVector.length !== 162) {
    throw new TypeError("BriscolaBot observation must be Float32Array(162)");
  }
  if (!actionMask || actionMask.length !== 40) {
    throw new TypeError("BriscolaBot action mask must contain 40 values");
  }

  // The upstream ONNX export has one float32[1,202] input. It slices the
  // first 162 values as the policy observation and the final 40 as the mask.
  const input = new Float32Array(202);
  input.set(observationVector, 0);
  for (let i = 0; i < 40; i += 1) input[162 + i] = Number(actionMask[i]);
  return input;
}

export class BriscolaBotRuntime {
  constructor({
    modelUrl = DEFAULT_BRISCOLABOT_MODEL_URL,
    runtimeLoader = loadOnnxRuntimeWeb,
    sessionFactory = null
  } = {}) {
    this.modelUrl = modelUrl;
    this.runtimeLoader = runtimeLoader;
    this.sessionFactory = sessionFactory;
    this.sessionPromise = null;
    this.ort = null;
  }

  reset() {
    // The neural network is stateless. Keep the expensive ONNX session cached.
  }

  async getSession() {
    this.sessionPromise ??= this.#createSession();
    return this.sessionPromise;
  }

  async #createSession() {
    this.ort = await this.runtimeLoader();
    if (this.sessionFactory) return this.sessionFactory(this.ort, this.modelUrl);
    return this.ort.InferenceSession.create(this.modelUrl, {
      executionProviders: ["wasm"]
    });
  }

  async infer(observationVector, actionMask) {
    const session = await this.getSession();
    const ort = this.ort ?? await this.runtimeLoader();
    const inputNames = session.inputNames ?? [];

    if (inputNames.length !== 1) {
      throw new Error(`Unexpected BriscolaBot ONNX input count: ${inputNames.length}`);
    }

    const modelInput = concatenateModelInput(observationVector, actionMask);
    const feeds = {
      [inputNames[0]]: new ort.Tensor("float32", modelInput, [1, 202])
    };
    return session.run(feeds);
  }
}

export { concatenateModelInput };
