#!/usr/bin/env node
import { boardFromMinimalDeal, solveMinimalKlondike } from "../src/solver/minimal-klondike-js.js";

const encoded = process.argv[2];
if (!encoded) {
  console.error("Usage: node scripts/solve-minimal-deal.mjs DEAL [drawCount] [maxStates]");
  process.exitCode = 2;
} else {
  const drawCount = Number(process.argv[3] ?? 1);
  const maxStates = Number(process.argv[4] ?? 250000);
  const board = boardFromMinimalDeal(encoded, drawCount);
  const result = solveMinimalKlondike(board, { maxStates });
  console.log(JSON.stringify(result, null, 2));
  if (result.result !== "solved") process.exitCode = 1;
}
