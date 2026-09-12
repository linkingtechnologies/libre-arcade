// SPDX-License-Identifier: GPL-3.0-only
import { allArenaPlayers } from "./lib/players.mjs";
import { playBalancedPair } from "./lib/simulate.mjs";
import { rankingFromTotals, roundRobinMarkdown } from "./lib/report.mjs";
import { resolveProjectPath, writeReports } from "./lib/io.mjs";

const seedPairs = Number(process.argv[2] ?? 100);
const seedStart = Number(process.argv[3] ?? 1);
const outputBase = resolveProjectPath(process.argv[4] ?? "arena/results/latest-global-round-robin");

if (!Number.isInteger(seedPairs) || seedPairs <= 0) throw new Error("seedPairs must be a positive integer");
if (!Number.isInteger(seedStart)) throw new Error("seedStart must be an integer");

const totals = Object.fromEntries(
  allArenaPlayers.map((player) => [player.id, { name: player.name, wins: 0, points: 0, games: 0 }])
);
const headToHead = [];
let totalDraws = 0;
let totalGames = 0;

for (let i = 0; i < allArenaPlayers.length; i += 1) {
  for (let j = i + 1; j < allArenaPlayers.length; j += 1) {
    const a = allArenaPlayers[i];
    const b = allArenaPlayers[j];
    const match = {
      a: a.id,
      b: b.id,
      nameA: a.name,
      nameB: b.name,
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

        match.pointsA += aPoints;
        match.pointsB += bPoints;
        totals[a.id].points += aPoints;
        totals[b.id].points += bPoints;
        totals[a.id].games += 1;
        totals[b.id].games += 1;
        totalGames += 1;

        if (game.result.draw) {
          match.draws += 1;
          totalDraws += 1;
        } else {
          const winnerId = game.result.winner === 0 ? game.first.id : game.second.id;
          if (winnerId === a.id) {
            match.winsA += 1;
            totals[a.id].wins += 1;
          } else {
            match.winsB += 1;
            totals[b.id].wins += 1;
          }
        }
      }
    }

    headToHead.push(match);
  }
}

const report = {
  format: "briscolab-arena-global-round-robin-v1",
  seedStart,
  seedPairs,
  playerCount: allArenaPlayers.length,
  matchupCount: headToHead.length,
  totalGames,
  totalDraws,
  ranking: rankingFromTotals(totals),
  headToHead
};

const paths = writeReports(outputBase, report, roundRobinMarkdown(report));
console.log(JSON.stringify({ ...report, files: paths }, null, 2));
