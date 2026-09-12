// SPDX-License-Identifier: GPL-3.0-only
import { SeededRandom } from "../../core/SeededRandom.js";
import {
  fromBriscolaBotCardIndex,
  toBriscolaBotCardIndex,
  vectorizeBriscolaBotObservation
} from "./BriscolaBotVectorizer.js";
import { BriscolaBotRuntime } from "./BriscolaBotRuntime.js";

function softmaxSample(scores, legalIndices, rng) {
  let maxScore = -Infinity;
  for (const index of legalIndices) maxScore = Math.max(maxScore, Number(scores[index]));

  const weights = legalIndices.map((index) => Math.exp(Number(scores[index]) - maxScore));
  const total = weights.reduce((sum, value) => sum + value, 0);
  let threshold = rng.next() * total;
  for (let i = 0; i < legalIndices.length; i += 1) {
    threshold -= weights[i];
    if (threshold <= 0) return legalIndices[i];
  }
  return legalIndices.at(-1);
}

function chooseFromOutputs(outputs, legalIndices, rng) {
  const tensors = Object.values(outputs ?? {});
  if (tensors.length === 0) throw new Error("BriscolaBot ONNX model returned no outputs");

  // Some exported policies return the already-selected action as an integer tensor.
  const scalarAction = tensors.find((tensor) => {
    if (tensor?.data?.length !== 1) return false;
    const isIntegerTensor =
      String(tensor.type ?? "").includes("int") ||
      tensor.data instanceof BigInt64Array ||
      tensor.data instanceof Int32Array ||
      tensor.data instanceof Uint32Array;
    if (!isIntegerTensor) return false;
    const candidate = Number(tensor.data[0]);
    return Number.isInteger(candidate) && legalIndices.includes(candidate);
  });
  if (scalarAction) return Number(scalarAction.data[0]);

  // Actor exports normally expose one score/logit for every card action.
  const policy = tensors.find((tensor) => tensor?.data?.length === 40);
  if (!policy) {
    const shapes = tensors.map((tensor) => `[${tensor?.dims?.join?.(",") ?? "?"}]`).join(", ");
    throw new Error(`Unsupported BriscolaBot ONNX outputs: ${shapes}`);
  }

  return softmaxSample(policy.data, legalIndices, rng);
}

/** Adapter for the pretrained BriscolaBot-v3 PPO policy. */
export class BriscolaBotAdapter {
  constructor({
    runtime = new BriscolaBotRuntime(),
    name = "BriscolaBot v3",
    randomSeed = 0x42524953
  } = {}) {
    this.id = "briscolabot-v3";
    this.name = name;
    this.runtime = runtime;
    this.initialRandomSeed = Number(randomSeed) >>> 0;
    this.reset();
  }

  reset() {
    this.originalTrump = null;
    this.rng = new SeededRandom(this.initialRandomSeed);
    this.runtime.reset?.();
  }

  buildModelInput(observation) {
    if (!observation) throw new TypeError("observation is required");
    if (observation.visibleTrump) this.originalTrump = { ...observation.visibleTrump };
    return vectorizeBriscolaBotObservation(observation, this.originalTrump);
  }

  async chooseAction(observation) {
    if (!observation?.isMyTurn) {
      throw new Error("BriscolaBotAdapter received an observation outside its turn");
    }

    const input = this.buildModelInput(observation);
    const legalIndices = observation.hand.map(toBriscolaBotCardIndex);
    const outputs = await this.runtime.infer(input.observation, input.actionMask);
    const chosenIndex = chooseFromOutputs(outputs, legalIndices, this.rng);
    const chosen = fromBriscolaBotCardIndex(chosenIndex);
    const chosenCard = observation.hand.find((card) => card.id === chosen.id);

    if (!chosenCard) {
      throw new Error(`BriscolaBot selected illegal card index ${chosenIndex}`);
    }

    return {
      type: "PLAY_CARD",
      cardId: chosenCard.id,
      debug: {
        algorithm: "BriscolaBot v3 (PPO/ONNX)",
        modelAction: chosenIndex
      }
    };
  }
}

export { chooseFromOutputs };
