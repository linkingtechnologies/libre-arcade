import { SeededRng } from '../src/core/prng.js';
import { createRandomBoard } from '../src/core/fleet.js';
import { CLASSIC_FLEET } from '../src/core/rules.js';
import { Game } from '../src/core/game.js';
import { RandomPlayer } from '../src/players/random.js';
import { Os4ReconstructedPlayer } from '../src/players/os4-2009-reconstructed.js';

function oneGame(seed, swap = false) {
  const boardA = createRandomBoard(new SeededRng(seed ^ 0x11111111), CLASSIC_FLEET);
  const boardB = createRandomBoard(new SeededRng(seed ^ 0x22222222), CLASSIC_FLEET);
  const os4 = new Os4ReconstructedPlayer(new SeededRng(seed ^ 0x33333333));
  const random = new RandomPlayer(new SeededRng(seed ^ 0x44444444));
  const players = swap ? [random, os4] : [os4, random];
  const result = new Game({ boardA, boardB, playerA: players[0], playerB: players[1] }).run();
  const winnerName = players[result.winner].name;
  return { winnerName, turns: result.turns };
}

const games = Number(process.argv[2] ?? 1000);
let os4Wins = 0;
let randomWins = 0;
let turns = 0;
for (let i = 0; i < games; i += 1) {
  const r = oneGame((0x5eed0000 + i) >>> 0, i % 2 === 1);
  turns += r.turns;
  if (r.winnerName.startsWith('Bataille')) os4Wins += 1;
  else randomWins += 1;
}
console.log(JSON.stringify({ fleet: CLASSIC_FLEET, games, os4Wins, randomWins, os4WinRate: os4Wins / games, averageTurns: turns / games }, null, 2));
