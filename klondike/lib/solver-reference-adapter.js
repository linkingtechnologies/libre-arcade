// SPDX-FileCopyrightText: 2026 Umberto Bresciani
// SPDX-License-Identifier: GPL-3.0-or-later

import {
  availableDestinations,
  createReferenceGame,
  drawCards,
  isWon,
  moveTo,
  recycleWaste,
} from "./reference-engine.js";
import { cardsFromMinimalDeal } from "../public/src/deal-codec.js";

export function applySolverMoveToReference(game, solverBoard, move) {
  if (move.type === "talon-move") {
    for (const step of move.steps) applySolverMoveToReference(game, solverBoard, step);
    return applySolverMoveToReference(game, solverBoard, move.destination);
  }
  if (move.type === "draw") { drawCards(game, solverBoard.drawCount); return; }
  if (move.type === "recycle") { recycleWaste(game); return; }

  let id;
  let destination;
  if (move.type === "waste-foundation") {
    id = game.waste.at(-1);
    destination = availableDestinations(game, id).find((item) => item.area === "foundations");
  } else if (move.type === "waste-tableau") {
    id = game.waste.at(-1);
    destination = { area: "tableau", pile: move.to };
  } else if (move.type === "tableau-foundation") {
    id = game.tableau[move.from].at(-1);
    destination = availableDestinations(game, id).find((item) => item.area === "foundations");
  } else if (move.type === "tableau-tableau") {
    id = game.tableau[move.from].at(-move.count);
    destination = { area: "tableau", pile: move.to };
  } else if (move.type === "foundation-tableau") {
    const suit = ["c", "d", "h", "s"][move.suitIndex];
    const pile = game.foundations.findIndex((cards) => cards.length && game.cards[cards.at(-1)].suit === suit);
    id = game.foundations[pile]?.at(-1);
    destination = { area: "tableau", pile: move.to };
  }
  if (id === undefined || !destination || !moveTo(game, id, destination)) {
    throw new Error(`Reference engine rejected solver move: ${JSON.stringify(move)}`);
  }
}

export function replaySolverCertificate(deal, solverBoard, moves) {
  const game = createReferenceGame(cardsFromMinimalDeal(deal));
  for (const move of moves) applySolverMoveToReference(game, solverBoard, move);
  return { game, won: isWon(game) };
}
