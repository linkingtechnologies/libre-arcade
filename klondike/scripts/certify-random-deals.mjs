import { writeFile } from "node:fs/promises";
import { applySolverMove, boardFromMinimalDeal, shuffledMinimalDeal, solveMinimalKlondike } from "../src/solver/minimal-klondike-js.js";
import { replaySolverCertificate } from "../lib/solver-reference-adapter.js";

const count = Math.max(1, Number(process.argv[2] ?? 100));
const output = process.argv[3] ?? "certification/random-deals-latest.json";
const maxStates = Math.max(1_000, Number(process.env.MAX_STATES ?? 50_000));
const started = new Date().toISOString();
const rows = [];

for (const drawCount of [1, 3]) {
  const summary = { drawCount, attempted: count, solved: 0, crossCertified: 0, unknown: 0, states: 0, timeMs: 0, failures: [] };
  for (let seed = 1; seed <= count; seed++) {
    const encoded = shuffledMinimalDeal(seed);
    const board = boardFromMinimalDeal(encoded, drawCount);
    const result = solveMinimalKlondike(board, { maxStates });
    summary.states += result.states;
    summary.timeMs += result.timeMs;
    if (result.result !== "solved") { summary.unknown++; continue; }
    summary.solved++;
    const solverEnd = result.moves.reduce(applySolverMove, board);
    const solverWon = solverEnd.foundations.every((rank) => rank === 13);
    let referenceWon = false;
    try { referenceWon = replaySolverCertificate({ encoded }, board, result.moves).won; }
    catch (error) { summary.failures.push({ seed, error: error.message }); }
    if (solverWon && referenceWon) summary.crossCertified++;
    else summary.failures.push({ seed, error: "certificate did not win in both engines" });
  }
  rows.push(summary);
}

const report = {
  schema: 1,
  generatedAt: started,
  generator: "xorshift32 seeds 1..N",
  maxStates,
  claim: "Only solved deals replayed successfully in both engines are certified; unknown is never treated as impossible.",
  results: rows,
};
await writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (rows.some((row) => row.crossCertified !== row.solved || row.failures.length)) process.exitCode = 1;
