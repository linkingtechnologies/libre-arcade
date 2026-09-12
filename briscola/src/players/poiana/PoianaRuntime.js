// SPDX-License-Identifier: GPL-3.0-only
import { loadOnnxRuntimeWeb } from "../briscolabot/BriscolaBotRuntime.js";
import { POIANA_OBSERVATION_SIZE } from "./PoianaVectorizer.js";

export class PoianaRuntime {
  constructor({ modelUrl, runtimeLoader = loadOnnxRuntimeWeb, sessionFactory = null } = {}) {
    if (!modelUrl) throw new TypeError("PoianaRuntime requires modelUrl");
    this.modelUrl = modelUrl;
    this.runtimeLoader = runtimeLoader;
    this.sessionFactory = sessionFactory;
    this.sessionPromise = null;
    this.ort = null;
  }

  reset() {
    // Stateless policy; preserve the expensive ONNX session.
  }

  async getSession() {
    this.sessionPromise ??= this.#createSession();
    return this.sessionPromise;
  }

  async #createSession() {
    this.ort = await this.runtimeLoader();
    if (this.sessionFactory) return this.sessionFactory(this.ort, this.modelUrl);
    return this.ort.InferenceSession.create(this.modelUrl, { executionProviders: ["wasm"] });
  }

  async infer(observationVector) {
    if (!(observationVector instanceof Float32Array) || observationVector.length !== POIANA_OBSERVATION_SIZE) {
      throw new TypeError(`PoIAna observation must be Float32Array(${POIANA_OBSERVATION_SIZE})`);
    }

    const session = await this.getSession();
    const ort = this.ort ?? await this.runtimeLoader();
    if ((session.inputNames ?? []).length !== 1) {
      throw new Error(`Unexpected PoIAna ONNX input count: ${(session.inputNames ?? []).length}`);
    }

    const feeds = {
      [session.inputNames[0]]: new ort.Tensor("float32", observationVector, [1, POIANA_OBSERVATION_SIZE])
    };
    return session.run(feeds);
  }
}
