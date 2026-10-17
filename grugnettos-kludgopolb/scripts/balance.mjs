#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Umberto Bresciani
// SPDX-License-Identifier: GPL-3.0-only

// Balance study over many simulated games (see specs/balance.md).
//
//   node scripts/balance.mjs mirror --profile Zilla --players 4 --games 300   identical players: any asymmetry is the seat
//   node scripts/balance.mjs mixed  --players 4 --games 400                   random tables of the eight friends
//   add --escalation to play with the Growing Revenue rule (the browser game's default); --max-turns 2400 --seed 100000
//
// Output: how games end (finished within the cap, length in rounds), who wins (by seat, by friend) and how often
// the leader of the table after round 20 goes on to win. Games that hit the turn cap count as not finished.

import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { loadBoard } from '../public/src/node/board-loader.js';
import { Game } from '../public/src/core/game.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const board = loadBoard(path.join(root, 'public', 'boards', 'grugnetto-32-v1.4', 'board.json'));
const FRIENDS = ['Zilla', 'Queen', 'Wallace', 'Hans', 'Mimrock', 'Lost Soul', 'Lemming', 'Pazifik'];

const args = process.argv.slice(2);
const command = args[0];
const option = (name, fallback) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : fallback; };
const players = Number(option('players', 4));
const games = Number(option('games', 300));
const seed = Number(option('seed', 100000));
const maxTurns = Number(option('max-turns', 2400));
const rentEscalation = args.includes('--escalation');

// a tiny generator for choosing mixed tables, independent of the games' own random streams
function lineups(count, size, start) {
  let s = start >>> 0;
  const next = () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
  return Array.from({ length: count }, () => {
    const pool = [...FRIENDS];
    return Array.from({ length: size }, () => pool.splice(Math.floor(next() * pool.length), 1)[0]);
  });
}

function play(profiles, gameSeed) {
  // distinct names, so the same friend can sit twice at one table
  const participants = profiles.map((profile, i) => ({ type: 'cpu', profile, name: `${profile}#${i}` }));
  const game = new Game({ board, participants, seed: gameSeed, maxTurns, rentEscalation });
  const leaders = {};
  while (game.activePlayers().length > 1 && game.turnNumber < game.maxTurns) {
    game.roundNumber += 1;
    for (const player of game.players) {
      if (game.activePlayers().length <= 1 || game.turnNumber >= game.maxTurns) break;
      game.playTurn(player);
    }
    if (game.roundNumber === 20) leaders.at20 = [...game.activePlayers()].sort((a, b) => game.netWorth(b) - game.netWorth(a))[0]?.name;
  }
  const alive = game.activePlayers();
  const ranked = [...game.players].sort((a, b) => (a.bankrupt !== b.bankrupt ? (a.bankrupt ? 1 : -1) : game.netWorth(b) - game.netWorth(a)));
  const winner = (alive.length === 1 ? alive[0] : ranked[0]).name;
  return { finished: alive.length === 1, rounds: game.roundNumber, winner, seat: game.startOrder.indexOf(winner), leaderAt20: leaders.at20, size: profiles.length };
}

const pct = (k, n) => (n ? Math.round((k / n) * 1000) / 10 : 0);
const quantile = (xs, q) => [...xs].sort((a, b) => a - b)[Math.min(xs.length - 1, Math.floor(q * xs.length))];
const friendOf = name => name.replace(/#\d+$/, '');

let results;
if (command === 'mirror') {
  const profile = option('profile', 'Zilla');
  results = Array.from({ length: games }, (_, i) => play(Array(players).fill(profile), seed + i));
} else if (command === 'mixed') {
  results = lineups(games, players, 7 + players).map((profiles, i) => ({ ...play(profiles, seed + i), profiles }));
} else {
  console.error('usage: node scripts/balance.mjs mirror|mixed [--profile Zilla] [--players 4] [--games 300] [--seed 100000] [--max-turns 2400] [--escalation]');
  process.exit(2);
}

const rounds = results.map(r => r.rounds);
console.log(`${command} ${players} players, ${games} games, seed ${seed}, cap ${maxTurns} turns, growing rents ${rentEscalation ? 'on' : 'off'}`);
console.log(`  finished ${pct(results.filter(r => r.finished).length, games)}%   rounds: median ${quantile(rounds, 0.5)}, 90th percentile ${quantile(rounds, 0.9)}`);
const seats = Array(players).fill(0);
for (const r of results) seats[r.seat] += 1;
console.log(`  wins by seat (1 = plays first; fair ${pct(1, players)}%): ${seats.map((k, i) => `${i + 1}: ${pct(k, games)}%`).join('  ')}`);
const leaderWins = results.filter(r => r.leaderAt20 && r.leaderAt20 === r.winner).length;
console.log(`  the leader after round 20 wins ${pct(leaderWins, results.filter(r => r.leaderAt20).length)}% of the games still running then`);
if (command === 'mixed') {
  const appearances = {};
  const wins = {};
  for (const r of results) {
    for (const name of r.profiles) appearances[name] = (appearances[name] ?? 0) + 1;
    wins[friendOf(r.winner)] = (wins[friendOf(r.winner)] ?? 0) + 1;
  }
  console.log(`  wins per appearance (fair ${pct(1, players)}%):`);
  for (const name of Object.keys(appearances).sort((a, b) => (wins[b] ?? 0) / appearances[b] - (wins[a] ?? 0) / appearances[a])) {
    console.log(`    ${name.padEnd(10)} ${String(pct(wins[name] ?? 0, appearances[name])).padStart(5)}%  (${wins[name] ?? 0} of ${appearances[name]})`);
  }
}
