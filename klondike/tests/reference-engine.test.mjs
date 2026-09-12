import assert from "node:assert/strict";
import test from "node:test";
import {
  availableDestinations,
  clickCard,
  createCards,
  createReferenceGame,
  drawCards,
  drawThree,
  isWon,
  moveTo,
  recycleWaste,
} from "../lib/reference-engine.js";

test("uses the upstream triangular deal order", () => {
  const game = createReferenceGame(createCards());
  assert.deepEqual(game.tableau.map((pile) => pile.length), [1, 2, 3, 4, 5, 6, 7]);
  assert.equal(game.stock.length, 24);
  assert.deepEqual(game.tableau.map((pile) => pile.at(-1)), [0, 7, 13, 18, 22, 25, 27]);
  game.tableau.forEach((pile) => assert.equal(game.cards[pile.at(-1)].faceUp, true));
});

test("draws three cards and recycles without reversing", () => {
  const game = createReferenceGame(createCards());
  const originalStock = [...game.stock];
  drawThree(game);
  assert.deepEqual(game.waste, [51, 50, 49]);
  assert.equal(game.stock.length, 21);
  recycleWaste(game);
  assert.deepEqual(game.stock, [51, 50, 49]);
  assert.notDeepEqual(game.stock, originalStock.slice(-3));
});

test("draw-one and a partial draw move exactly the available cards", () => {
  const game = createReferenceGame(createCards());
  drawCards(game, 1);
  assert.deepEqual(game.waste, [51]);
  game.stock = [2, 3]; game.waste = [];
  drawCards(game, 3);
  assert.deepEqual(game.waste, [3, 2]);
  assert.equal(game.stock.length, 0);
});

test("recycling turns every waste card face down and preserves order", () => {
  const game = createReferenceGame(createCards());
  game.stock = []; game.waste = [4, 8, 12];
  game.waste.forEach((id) => { game.cards[id].faceUp = true; });
  recycleWaste(game);
  assert.deepEqual(game.stock, [4, 8, 12]);
  assert.ok(game.stock.every((id) => !game.cards[id].faceUp));
});

test("allows an Ace to claim the first empty foundation", () => {
  const game = createReferenceGame(createCards());
  game.tableau = [[0], [], [], [], [], [], []];
  game.stock = game.stock.filter((card) => card !== 0);
  assert.deepEqual(availableDestinations(game, 0, true), [{ area: "foundations", pile: 0 }]);
  assert.equal(clickCard(game, 0), true);
  assert.deepEqual(game.foundations[0], [0]);
});

test("moves a complete tableau suffix like upstream moveCardTo", () => {
  const cards = createCards();
  const game = createReferenceGame(cards);
  // 8 clubs (black), 7 diamonds (red), 6 clubs (black), 9 hearts (red).
  game.tableau = [[7, 19, 5], [34], [], [], [], [], []];
  game.cards.forEach((card) => { card.faceUp = true; });
  game.stock = game.stock.filter((card) => ![7, 19, 5, 34].includes(card));
  const destinations = availableDestinations(game, 7);
  assert.ok(destinations.some((d) => d.area === "tableau" && d.pile === 1));
  moveTo(game, 7, { area: "tableau", pile: 1 });
  assert.deepEqual(game.tableau[1], [34, 7, 19, 5]);
});

test("tableau requires descending alternating colors and only Kings fill gaps", () => {
  const game = createReferenceGame(createCards());
  // 7 diamonds may sit on 8 clubs; 7 spades may not.
  game.tableau = [[7], [19], [45], [], [], [], []];
  game.waste = [12];
  game.stock = game.stock.filter((id) => ![7, 19, 45, 12].includes(id));
  game.cards.forEach((card) => { card.faceUp = true; });
  assert.ok(availableDestinations(game, 19).some((d) => d.pile === 0));
  assert.ok(!availableDestinations(game, 45).some((d) => d.pile === 0));
  assert.ok(availableDestinations(game, 12).some((d) => d.area === "tableau" && d.pile === 3));
  assert.ok(!availableDestinations(game, 7).some((d) => d.area === "tableau" && d.pile === 3));
});

test("foundations accept only the next rank of the same suit", () => {
  const game = createReferenceGame(createCards());
  game.tableau = [[0], [1], [14], [], [], [], []];
  game.stock = game.stock.filter((id) => ![0, 1, 14].includes(id));
  game.cards.forEach((card) => { card.faceUp = true; });
  moveTo(game, 0, { area: "foundations", pile: 0 });
  assert.ok(availableDestinations(game, 1).some((d) => d.area === "foundations" && d.pile === 0));
  assert.ok(!availableDestinations(game, 14).some((d) => d.area === "foundations" && d.pile === 0));
});

test("moving a tableau suffix reveals the newly exposed card", () => {
  const game = createReferenceGame(createCards());
  game.tableau = [[8, 7], [34], [], [], [], [], []];
  game.cards[8].faceUp = false; game.cards[7].faceUp = true; game.cards[34].faceUp = true;
  moveTo(game, 7, { area: "tableau", pile: 1 });
  assert.equal(game.cards[8].faceUp, true);
});

test("victory requires thirteen cards in every foundation", () => {
  const game = createReferenceGame(createCards());
  game.foundations = [
    Array.from({ length: 13 }, (_, i) => i),
    Array.from({ length: 13 }, (_, i) => i + 13),
    Array.from({ length: 13 }, (_, i) => i + 26),
    Array.from({ length: 13 }, (_, i) => i + 39),
  ];
  assert.equal(isWon(game), true);
  game.foundations[3].pop();
  assert.equal(isWon(game), false);
});
