import { Game } from '../core/game.js';

export function runArena({ board, agents, games = 100, seed = 1, maxTurns = 6000 }) {
  const wins = Object.fromEntries(agents.map(a => [a, 0]));
  let completed = 0;
  let turns = 0;
  const results = [];
  for (let i = 0; i < games; i += 1) {
    const game = new Game({ board, agents, seed: seed + i, maxTurns });
    const result = game.run();
    results.push(result);
    wins[result.winner] = (wins[result.winner] ?? 0) + 1;
    completed += result.completed ? 1 : 0;
    turns += result.turns;
  }
  return {
    games,
    seedStart: seed,
    completed,
    completionRate: completed / games,
    averageTurns: turns / games,
    wins,
    winRates: Object.fromEntries(Object.entries(wins).map(([k, v]) => [k, v / games])),
    results
  };
}
