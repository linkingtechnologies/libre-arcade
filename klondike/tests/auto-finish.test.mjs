import assert from "node:assert/strict";
import test from "node:test";
import { createReferenceGame } from "../lib/reference-engine.js";
import { planAutoFinish } from "../public/src/auto-finish.js";

test("safe auto-finish plans only a proven winning sequence", () => {
  const game = createReferenceGame();
  game.stock = []; game.waste = []; game.foundations = [[], [], [], []]; game.tableau = [[], [], [], [], [], [], []];
  for (const card of game.cards) card.faceUp = true;
  ["c", "d", "h", "s"].forEach((suit, pile) => {
    const ids = game.cards.map((card, id) => ({ card, id })).filter(({ card }) => card.suit === suit).sort((a, b) => a.card.rank - b.card.rank).map(({ id }) => id);
    game.foundations[pile].push(...ids.slice(0, 12)); game.tableau[pile].push(ids[12]);
  });
  assert.equal(planAutoFinish(game, 3).filter((step) => step.type === "foundation").length, 4);
  game.cards[game.tableau[0][0]].faceUp = false;
  assert.equal(planAutoFinish(game, 3), null);
});
