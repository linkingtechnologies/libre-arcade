#!/usr/bin/env node
import {
  boardFromMinimalDeal,
  shuffledMinimalDeal,
  solveMinimalKlondike,
} from "../src/solver/minimal-klondike-js.js";

const wanted = Math.max(1, Number(process.argv[2] ?? 10));
const drawCount = Number(process.argv[3] ?? 1);
const maxStates = Number(process.argv[4] ?? 250000);
const firstSeed = Number(process.argv[5] ?? 1);
const maxAttempts = Math.max(wanted, Number(process.argv[6] ?? wanted * 100));
const catalog = [];

for (let offset = 0; offset < maxAttempts && catalog.length < wanted; offset++) {
  const seed = firstSeed + offset;
  const encoded = shuffledMinimalDeal(seed);
  const result = solveMinimalKlondike(boardFromMinimalDeal(encoded, drawCount), { maxStates });
  if (result.result !== "solved") continue;
  catalog.push({
    id: `js-${drawCount}-${seed}`,
    seed,
    drawCount,
    encoded,
    moves: result.moves,
    moveCount: result.moves.length,
    states: result.states,
    solver: "MinimalKlondike JS port",
  });
  console.error(`certified ${catalog.length}/${wanted}: seed ${seed}, ${result.states} states`);
}

console.log(JSON.stringify({
  generatedAt: new Date().toISOString(),
  requested: wanted,
  attempts: maxAttempts,
  certified: catalog.length,
  catalog,
}, null, 2));
if (catalog.length < wanted) process.exitCode = 1;
