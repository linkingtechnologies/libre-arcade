// SPDX-FileCopyrightText: 2026 Umberto Bresciani
// SPDX-License-Identifier: GPL-3.0-or-later

import {
  boardFromMinimalDeal,
  shuffledMinimalDeal,
  solveMinimalKlondike,
} from "./solver-core.js";

self.onmessage = ({ data }) => {
  if (data.mode === "hint") {
    const result = solveMinimalKlondike(data.board, { maxStates: data.maxStates ?? 50000 });
    self.postMessage({
      type: result.result === "solved" ? "hint" : "no-hint",
      move: result.moves[0] ?? null,
      states: result.states,
    });
    return;
  }
  const firstSeed = data.seed >>> 0;
  const drawCount = data.drawCount ?? 1;
  const maxStates = data.maxStates ?? 50000;
  // A zero limit means that a foreground search keeps trying until it finds a
  // certified deal. The UI can still stop it immediately by terminating this
  // worker. Background reserve generation always supplies a finite limit.
  const maxAttempts = data.maxAttempts ?? 20;

  for (let attempt = 0; maxAttempts === 0 || attempt < maxAttempts; attempt++) {
    const seed = (firstSeed + attempt) >>> 0;
    self.postMessage({ type: "progress", attempt: attempt + 1 });
    const encoded = shuffledMinimalDeal(seed);
    const result = solveMinimalKlondike(boardFromMinimalDeal(encoded, drawCount), { maxStates });
    if (result.result !== "solved") continue;
    self.postMessage({
      type: "solved",
      deal: {
        id: `js-${drawCount}-${seed}`,
        seed,
        drawCount,
        encoded,
        expectedMoves: result.moves.length,
        states: result.states,
        solution: result.moves,
        sourceTest: "MinimalKlondike JS on-demand",
      },
    });
    return;
  }
  self.postMessage({ type: "exhausted" });
};
