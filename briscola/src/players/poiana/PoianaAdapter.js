// SPDX-License-Identifier: GPL-3.0-only
import { PoianaRuntime } from "./PoianaRuntime.js";
import { vectorizePoianaObservation } from "./PoianaVectorizer.js";

export function actionIndexFromPoianaOutputs(outputs) {
  const tensors = Object.values(outputs ?? {});
  if (tensors.length === 0) throw new Error("PoIAna ONNX model returned no outputs");

  const scalar = tensors.find((tensor) => {
    if (tensor?.data?.length !== 1) return false;
    const value = Number(tensor.data[0]);
    return Number.isInteger(value) && value >= 0 && value <= 2;
  });
  if (!scalar) throw new Error("PoIAna ONNX output does not contain an action index 0..2");
  return Number(scalar.data[0]);
}

export function clampPoianaActionIndex(index, handLength) {
  if (!Number.isInteger(index) || index < 0 || index > 2) {
    throw new RangeError(`Invalid PoIAna action index ${index}`);
  }
  if (!Number.isInteger(handLength) || handLength <= 0 || handLength > 3) {
    throw new RangeError(`Invalid PoIAna hand length ${handLength}`);
  }
  // Faithful upstream behavior from Hand.TakeCard(): decrement until the
  // predicted slot exists rather than masking/re-running the network.
  while (index >= handLength) index -= 1;
  return index;
}

export class PoianaAdapter {
  constructor({ model, runtime = null } = {}) {
    if (!model?.name) throw new TypeError("PoianaAdapter requires a model descriptor");
    this.model = model;
    this.id = model.id ?? `poiana-${model.name}`;
    this.name = model.displayName ?? `PoIAna ${model.name}`;
    this.runtime = runtime ?? new PoianaRuntime({ modelUrl: model.onnxUrl });
    this.reset();
  }

  reset() {
    this.originalTrump = null;
    this.runtime.reset?.();
  }

  buildModelInput(observation) {
    if (observation.visibleTrump) this.originalTrump = { ...observation.visibleTrump };
    return vectorizePoianaObservation(observation, this.originalTrump);
  }

  async chooseAction(observation) {
    if (!observation?.isMyTurn) {
      throw new Error("PoianaAdapter received an observation outside its turn");
    }
    if (!observation.hand?.length) throw new Error("PoianaAdapter received an empty hand");

    const input = this.buildModelInput(observation);
    const outputs = await this.runtime.infer(input);
    const rawIndex = actionIndexFromPoianaOutputs(outputs);
    const chosenIndex = clampPoianaActionIndex(rawIndex, observation.hand.length);
    const card = observation.hand[chosenIndex];

    return {
      type: "PLAY_CARD",
      cardId: card.id,
      debug: {
        algorithm: `PoIAna ${this.model.architecture === "qrdqn-50" ? "QR-DQN" : "DQN"}/ONNX`,
        model: this.model.name,
        modelAction: rawIndex,
        chosenIndex,
        upstreamWinRate: this.model.winRate
      }
    };
  }
}
