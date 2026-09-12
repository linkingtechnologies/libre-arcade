// SPDX-License-Identifier: GPL-3.0-only
export function rankingFromTotals(totals) {
  return Object.entries(totals)
    .map(([id, item]) => ({
      id,
      ...item,
      winRate: item.games ? item.wins / item.games : 0,
      averagePoints: item.games ? item.points / item.games : 0
    }))
    .sort((left, right) => right.winRate - left.winRate || right.averagePoints - left.averagePoints);
}

export function roundRobinMarkdown(report) {
  const lines = [
    "# BriscoLab Arena — Round Robin",
    "",
    `- Seed start: ${report.seedStart}`,
    `- Seed pairs per matchup: ${report.seedPairs}`,
    `- Total games: ${report.totalGames}`,
    `- Draws: ${report.totalDraws}`,
    "- Both seating positions are tested for every seed.",
    "",
    "| Rank | Player | Wins | Games | Win rate | Avg points |",
    "|---:|---|---:|---:|---:|---:|"
  ];

  report.ranking.forEach((item, index) => {
    lines.push(
      `| ${index + 1} | ${item.name} | ${item.wins} | ${item.games} | ${(item.winRate * 100).toFixed(2)}% | ${item.averagePoints.toFixed(2)} |`
    );
  });

  lines.push("", "## Head-to-head", "");
  for (const match of report.headToHead) {
    lines.push(
      `- **${match.nameA} vs ${match.nameB}:** ${match.winsA}-${match.winsB}, ${match.draws} draws, ${match.games} games.`
    );
  }

  return `${lines.join("\n")}\n`;
}

export function headToHeadMarkdown(report) {
  return [
    `# BriscoLab Arena — ${report.nameA} vs ${report.nameB}`,
    "",
    `- Seed start: ${report.seedStart}`,
    `- Seed pairs: ${report.seedPairs}`,
    `- Total games: ${report.games}`,
    "- Both seating positions are tested for every seed.",
    "",
    `| Player | Wins | Points | Avg points |`,
    `|---|---:|---:|---:|`,
    `| ${report.nameA} | ${report.winsA} | ${report.pointsA} | ${(report.pointsA / report.games).toFixed(2)} |`,
    `| ${report.nameB} | ${report.winsB} | ${report.pointsB} | ${(report.pointsB / report.games).toFixed(2)} |`,
    "",
    `Draws: **${report.draws}**`,
    ""
  ].join("\n");
}
