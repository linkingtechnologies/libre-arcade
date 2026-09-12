import assert from "node:assert/strict";
import test from "node:test";
import { availableDestinations, clickCard, createReferenceGame, drawThree, recycleWaste } from "../lib/reference-engine.js";
import { createOriginalOracle, snapshotOriginal } from "./helpers/original-oracle.mjs";

function comparablePort(game) {
  return {
    cards: game.cards.map(({ suit, rank, faceUp }) => ({ suit, rank, faceUp })),
    stock: [...game.stock],
    waste: [...game.waste],
    foundations: game.foundations.map((pile) => [...pile]),
    tableau: game.tableau.map((pile) => [...pile]),
  };
}

test("port matches the executed original after deal for multiple shuffles", () => {
  for (const seed of [1, 7, 42, 2021, 65537]) {
    const oracle = createOriginalOracle(seed);
    const snapshot = snapshotOriginal(oracle);
    const port = createReferenceGame(snapshot.cards);
    assert.deepEqual(comparablePort(port), snapshot, `deal mismatch at seed ${seed}`);
  }
});

test("port matches every original draw-three step and waste recycle", () => {
  const oracle = createOriginalOracle(1987);
  const initial = snapshotOriginal(oracle);
  const port = createReferenceGame(initial.cards);
  while (oracle.state.deal.pile.cards.length) {
    oracle.draw();
    drawThree(port);
    assert.deepEqual(comparablePort(port), snapshotOriginal(oracle));
  }
  oracle.recycle();
  recycleWaste(port);
  assert.deepEqual(comparablePort(port), snapshotOriginal(oracle));
});

test("port returns the same ordered destinations as the original", () => {
  for (const seed of [3, 11, 29, 97]) {
    const oracle = createOriginalOracle(seed);
    const snapshot = snapshotOriginal(oracle);
    const port = createReferenceGame(snapshot.cards);
    const exposed = port.tableau.map((pile) => pile.at(-1));
    for (const card of exposed) {
      assert.deepEqual(availableDestinations(port, card), oracle.destinations(card), `destination mismatch for seed ${seed}, card ${card}`);
      assert.deepEqual(availableDestinations(port, card, true), oracle.destinations(card, true), `priority mismatch for seed ${seed}, card ${card}`);
    }
  }
});

test("port and original remain identical through automatic click moves", () => {
  const oracle = createOriginalOracle(314159);
  const initial = snapshotOriginal(oracle);
  const port = createReferenceGame(initial.cards);
  for (let step = 0; step < 20; step++) {
    const candidates = [
      ...port.tableau.filter((pile) => pile.length).map((pile) => pile.at(-1)),
      ...(port.waste.length ? [port.waste.at(-1)] : []),
      ...port.foundations.filter((pile) => pile.length).map((pile) => pile.at(-1)),
    ];
    const card = candidates.find((candidate) => availableDestinations(port, candidate, true).length);
    if (card === undefined) {
      if (!port.stock.length) break;
      oracle.draw();
      drawThree(port);
    } else {
      oracle.click(card);
      assert.equal(clickCard(port, card), true);
    }
    assert.deepEqual(comparablePort(port), snapshotOriginal(oracle), `state mismatch after step ${step}`);
  }
});
