// SPDX-License-Identifier: GPL-3.0-only
import { arenaPlayers, getArenaPlayer } from "./lib/players.mjs";
import { playBalancedPair } from "./lib/simulate.mjs";
import { resolveProjectPath, writeReports } from "./lib/io.mjs";

const id = process.argv[2];
if (!id) throw new Error("Usage: node arena/scripts/benchmark-player.mjs <player> [seedPairs] [seedStart] [outputBase]");

const player = getArenaPlayer(id);
const opponents = arenaPlayers.filter((item) => item.id !== player.id);
const seedPairs = Number(process.argv[3] ?? 1000);
const seedStart = Number(process.argv[4] ?? 1);
const outputBase = resolveProjectPath(process.argv[5] ?? `arena/results/latest-${player.id}-benchmark`);

const matches = [];
let wins = 0;
let draws = 0;
let points = 0;
let gamesTotal = 0;

for (const opponent of opponents) {
  const match = { opponent: opponent.id, opponentName: opponent.name, games: seedPairs * 2, wins: 0, losses: 0, draws: 0, points: 0 };
  for (let seed = seedStart; seed < seedStart + seedPairs; seed += 1) {
    const games = await playBalancedPair(seed, player, opponent);
    for (const game of games) {
      const playerSeat = game.first.id === player.id ? 0 : 1;
      const playerPoints = game.result.scores[playerSeat];
      match.points += playerPoints;
      points += playerPoints;
      gamesTotal += 1;

      if (game.result.draw) {
        match.draws += 1;
        draws += 1;
      } else if (game.result.winner === playerSeat) {
        match.wins += 1;
        wins += 1;
      } else {
        match.losses += 1;
      }
    }
  }
  matches.push(match);
}

const report = {
  format: "briscolab-arena-player-benchmark-v1",
  player: player.id,
  playerName: player.name,
  seedStart,
  seedPairs,
  games: gamesTotal,
  wins,
  draws,
  winRate: wins / gamesTotal,
  averagePoints: points / gamesTotal,
  matches
};

const markdown = [
  `# BriscoLab Arena — ${player.name}`,
  "",
  `- Games: ${report.games}`,
  `- Wins: ${report.wins}`,
  `- Draws: ${report.draws}`,
  `- Win rate: ${(report.winRate * 100).toFixed(2)}%`,
  `- Average points: ${report.averagePoints.toFixed(2)}`,
  "",
  "| Opponent | W | L | D | Avg points |",
  "|---|---:|---:|---:|---:|",
  ...matches.map((match) => `| ${match.opponentName} | ${match.wins} | ${match.losses} | ${match.draws} | ${(match.points / match.games).toFixed(2)} |`),
  ""
].join("\n");

const paths = writeReports(outputBase, report, markdown);
console.log(JSON.stringify({ ...report, files: paths }, null, 2));
