// SPDX-FileCopyrightText: 2026 Umberto Bresciani
// SPDX-License-Identifier: GPL-3.0-or-later

import { availableDestinations, drawCards, isWon, moveTo, recycleWaste } from "./engine.js";

const clone = (value) => JSON.parse(JSON.stringify(value));
const key = (game) => [game.stock.join(","), game.waste.join(","), ...game.foundations.map((p) => p.join(",")), ...game.tableau.map((p) => p.join(","))].join("|");

export function planAutoFinish(source, drawCount) {
  if (source.tableau.some((pile) => pile.some((id) => !source.cards[id].faceUp))) return null;
  const game = clone(source);
  const steps = [];
  const seen = new Set();
  for (let guard = 0; guard < 2_000 && !isWon(game); guard++) {
    const exposed = [game.waste.at(-1), ...game.tableau.map((pile) => pile.at(-1))].filter((id) => id !== undefined);
    let moved = false;
    for (const id of exposed) {
      const destination = availableDestinations(game, id).find((item) => item.area === "foundations");
      if (!destination) continue;
      moveTo(game, id, destination); steps.push({ type: "foundation", id, destination }); moved = true; break;
    }
    if (moved) { seen.clear(); continue; }
    const state = key(game);
    if (seen.has(state)) return null;
    seen.add(state);
    if (game.stock.length) { drawCards(game, drawCount); steps.push({ type: "draw" }); }
    else if (game.waste.length) { recycleWaste(game); steps.push({ type: "recycle" }); }
    else return null;
  }
  return isWon(game) ? steps : null;
}
