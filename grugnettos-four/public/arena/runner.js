import { createGame, legalMoves, playMove, snapshot, P1, P2 } from '../src/core/game.js';
import { createRng } from '../src/core/rng.js';
import { normalizeDecision } from '../src/core/player-contract.js';

export function runMatch({ red, yellow, seed = 1, startingPlayer = P1, maxMoves = 42 }) {
  const game = createGame(startingPlayer);
  const rng = createRng(seed);
  red.reset?.();
  yellow.reset?.();
  const trace = [];
  while (!game.over && game.moves.length < maxMoves) {
    const actor = game.player === P1 ? red : yellow;
    const before = performance.now();
    const decision = normalizeDecision(actor.chooseMove(snapshot(game), { rng, seed }));
    const elapsedMs = performance.now() - before;
    if (!legalMoves(game).includes(decision.column)) {
      throw new Error(`${actor.id ?? 'player'} returned illegal column ${decision.column}`);
    }
    playMove(game, decision.column);
    trace.push({ ply: trace.length + 1, player: game.moves.length % 2 ? startingPlayer : (startingPlayer === P1 ? P2 : P1), column: decision.column, elapsedMs, ...decision });
  }
  return { seed, startingPlayer, winner: game.winner, draw: game.draw, moves: [...game.moves], trace };
}

export function runPairedMatch({ aFactory, bFactory, seed = 1 }) {
  return [
    runMatch({ red: aFactory(), yellow: bFactory(), seed, startingPlayer: P1 }),
    runMatch({ red: bFactory(), yellow: aFactory(), seed, startingPlayer: P1 }),
  ];
}

export function runRoundRobin(entries, seed = 1) {
  if (!Array.isArray(entries) || entries.length < 2) throw new Error('Round robin requires at least two players');
  if (new Set(entries.map((entry) => entry.id)).size !== entries.length) throw new Error('Round robin player ids must be unique');
  const table = Object.fromEntries(entries.map((entry) => [entry.id, { player: entry.id, played: 0, wins: 0, draws: 0, losses: 0, points: 0 }]));
  const matches = [];
  let pairIndex = 0;
  for (let a = 0; a < entries.length - 1; a += 1) {
    for (let b = a + 1; b < entries.length; b += 1) {
      const pairSeed = (Number(seed) + pairIndex) >>> 0;
      const games = runPairedMatch({ aFactory: entries[a].factory, bFactory: entries[b].factory, seed: pairSeed });
      games.forEach((game, gameIndex) => {
        const red = gameIndex === 0 ? entries[a].id : entries[b].id;
        const yellow = gameIndex === 0 ? entries[b].id : entries[a].id;
        const winner = game.draw ? null : game.winner === P1 ? red : yellow;
        table[red].played += 1; table[yellow].played += 1;
        if (!winner) {
          table[red].draws += 1; table[yellow].draws += 1;
          table[red].points += 0.5; table[yellow].points += 0.5;
        } else {
          const loser = winner === red ? yellow : red;
          table[winner].wins += 1; table[winner].points += 1;
          table[loser].losses += 1;
        }
        matches.push({ pair: pairIndex + 1, game: gameIndex + 1, seed: pairSeed, red, yellow, winner: winner ?? 'draw', plies: game.moves.length, moves: game.moves, nodes: game.trace.reduce((sum, move) => sum + (move.nodes || 0), 0) });
      });
      pairIndex += 1;
    }
  }
  return { seed: Number(seed) >>> 0, standings: Object.values(table).sort((x, y) => y.points - x.points || y.wins - x.wins || x.player.localeCompare(y.player)), matches };
}
