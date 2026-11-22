// SPDX-License-Identifier: GPL-3.0-only

/**
 * Upstream PoIAna model catalog, copied from SelectorMenu.cs.
 * `winRate` is the author's published in-game comparison metric and is not a
 * BriscoLab Arena score.
 */
export const POIANA_MODELS = Object.freeze([
  { icon: "🤳🏻", name: "selfplay-best", winRate: 0.568933, architecture: "dqn", descriptionIt: "DQN allenato in self-play" },
  { icon: "🌊", name: "amber-lake", winRate: 0.578433, architecture: "dqn", descriptionIt: "Allenamento lungo con uno sparse reward." },
  { icon: "🍂", name: "autumn-night", winRate: 0.680767, architecture: "dqn", descriptionIt: "Allenamento molto lungo contro una strategia avida. Forte nelle fasi finali di gioco." },
  { icon: "🦦", name: "mild-aardvark", winRate: 0.653067, architecture: "dqn", descriptionIt: "Solo lo sparse reward. Allenato velocemente contro un agente avido." },
  { icon: "💫", name: "lively-cosmos", winRate: 0.633833, architecture: "dqn", descriptionIt: "Solo lo sparse reward." },
  { icon: "🍃", name: "bumbling-leaf", winRate: 0.615367, architecture: "dqn", descriptionIt: "Solo lo sparse reward." },
  { icon: "🪨", name: "easy-shape", winRate: 0.612867, architecture: "dqn", descriptionIt: "Solo sparse reward, con annealing lento." },
  { icon: "🌲", name: "toasty-pine", winRate: 0.680800, architecture: "qrdqn-50", descriptionIt: "Allenamento più lungo con penalità più severe. Dovrebbe essere meno imprevedibile." },
  { icon: "🐦", name: "blooming-bird", winRate: 0.682033, architecture: "dqn", descriptionIt: "Uno dei primi modelli allenato con penalità. Forte e bilanciato." },
  { icon: "📄", name: "devout-paper", winRate: 0.656833, architecture: "qrdqn-50", descriptionIt: "Penalità più severe in un allenamento veloce." },
  { icon: "🧨", name: "cosmic-firebrand", winRate: 0.450967, architecture: "dqn", descriptionIt: "Peggior modello fra questi migliori." },
  { icon: "🥗", name: "dark-salad", winRate: 0.572400, architecture: "dqn", descriptionIt: "Allenamento più lungo con una learning rate più grande." },
  { icon: "🌃", name: "earnest-night", winRate: 0.588133, architecture: "dqn", descriptionIt: "Primo modello che ha ottenuto delle buone performance." },
  { icon: "🕳️", name: "graceful-darkness", winRate: 0.681433, architecture: "dqn", descriptionIt: "Miglior modello con penalità. Allenato con tutti i premi attivi." },
  { icon: "☄️", name: "hardy-galaxy", winRate: 0.482300, architecture: "dqn", descriptionIt: "Learning rate e gamma più piccoli." },
  { icon: "🎣", name: "laced-pond", winRate: 0.676333, architecture: "dqn", descriptionIt: "Allenato con tutti i reward contro l'agente basato su euristiche." },
  { icon: "🏔️", name: "rich-mountain", winRate: 0.588133, architecture: "dqn", descriptionIt: "Prosecuzione dell'allenamento su earnest-night, con decadimento veloce dell'esplorazione." },
  { icon: "😌", name: "skilled-serenity", winRate: 0.538800, architecture: "dqn", descriptionIt: "Allenamento breve con poca esplorazione." },
  { icon: "🐲", name: "smart-dragon", winRate: 0.532100, architecture: "dqn", descriptionIt: "Allenamento più lungo con premi dense e sparse." },
  { icon: "🌨️", name: "snowy-shape", winRate: 0.650300, architecture: "dqn", descriptionIt: "Allenamento standard, con penalità per azioni sub-ottime." },
  { icon: "❄️", name: "spring-snowflake", winRate: 0.575500, architecture: "dqn", descriptionIt: "Ulteriore rifinitura di earnest-night." },
  { icon: "🌟", name: "true-star", winRate: 0.680267, architecture: "dqn", descriptionIt: "Secondo buon modello ottenuto. Particolarmente forte sulla seconda mossa." },
  { icon: "🛶", name: "warm-river", winRate: 0.576833, architecture: "dqn", descriptionIt: "Rifinitura di un modello già allenato." }
].map((model) => Object.freeze({
  ...model,
  id: `poiana-${model.name}`,
  onnxUrl: `./assets/models/poiana/${model.name}.onnx`,
  displayName: `PoIAna ${model.icon} ${model.name}`
})));

export function getPoianaModel(nameOrId) {
  const normalized = String(nameOrId ?? "").replace(/^poiana-/, "");
  const model = POIANA_MODELS.find((item) => item.name === normalized);
  if (!model) throw new Error(`Unknown PoIAna model '${nameOrId}'`);
  return model;
}

export const POIANA_MODELS_BY_WIN_RATE = Object.freeze(
  [...POIANA_MODELS].sort((a, b) => b.winRate - a.winRate)
);
