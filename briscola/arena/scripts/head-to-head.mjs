// SPDX-License-Identifier: GPL-3.0-only
import { getArenaPlayer } from "./lib/players.mjs";
import { playBalancedPair } from "./lib/simulate.mjs";
import { headToHeadMarkdown } from "./lib/report.mjs";
import { resolveProjectPath, writeReports } from "./lib/io.mjs";

const [idA, idB] = process.argv.slice(2, 4);
if (!idA || !idB) {
  throw new Error("Usage: node arena/scripts/head-to-head.mjs <playerA> <playerB> [seedPairs] [seedStart] [outputBase]");
}
if (idA === idB) throw new Error("Choose two different players");

const a = getArenaPlayer(idA);
const b = getArenaPlayer(idB);
const seedPairs = Number(process.argv[4] ?? 1000);
const seedStart = Number(process.argv[5] ?? 1);
const outputBase = resolveProjectPath(
  process.argv[6] ?? `arena/results/latest-${a.id}-vs-${b.id}`
);

const report = {
  format: "briscolab-arena-head-to-head-v1",
  a: a.id,
  b: b.id,
  nameA: a.name,
  nameB: b.name,
  seedStart,
  seedPairs,
  games: seedPairs * 2,
  winsA: 0,
  winsB: 0,
  draws: 0,
  pointsA: 0,
  pointsB: 0
};

for (let seed = seedStart; seed < seedStart + seedPairs; seed += 1) {
  const games = await playBalancedPair(seed, a, b);
  for (const game of games) {
    const firstPoints = game.result.scores[0];
    const secondPoints = game.result.scores[1];
    const aPoints = game.swapped ? secondPoints : firstPoints;
    const bPoints = game.swapped ? firstPoints : secondPoints;
    report.pointsA += aPoints;
    report.pointsB += bPoints;

    if (game.result.draw) {
      report.draws += 1;
    } else {
      const winnerId = game.result.winner === 0 ? game.first.id : game.second.id;
      if (winnerId === a.id) report.winsA += 1;
      else report.winsB += 1;
    }
  }
}

const paths = writeReports(outputBase, report, headToHeadMarkdown(report));
console.log(JSON.stringify({ ...report, files: paths }, null, 2));
