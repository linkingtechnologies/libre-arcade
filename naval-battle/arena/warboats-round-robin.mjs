import { SeededRng } from '../src/core/prng.js';
import { createRandomBoard } from '../src/core/fleet.js';
import { CLASSIC_FLEET } from '../src/core/rules.js';
import { Game } from '../src/core/game.js';
import { RandomPlayer } from '../src/players/random.js';
import { Os4ReconstructedPlayer } from '../src/players/os4-2009-reconstructed.js';
import { HistoricalAiStallError, Warboats2009Player } from '../src/players/warboats-2009.js';

const factories = [
  ['Random', rng => new RandomPlayer(rng, 'Random')],
  ['OS4-2009', rng => new Os4ReconstructedPlayer(rng, 'OS4-2009')],
  ...[1,2,3,4].map(level => [`Warboats-L${level}`, rng => new Warboats2009Player(rng, level, `Warboats-L${level}`)])
];

function play(seed, aFactory, bFactory, swap) {
  const pa = aFactory(new SeededRng(seed ^ 0x13579bdf));
  const pb = bFactory(new SeededRng(seed ^ 0x2468ace0));
  const players = swap ? [pb, pa] : [pa, pb];
  const game = new Game({
    boardA: createRandomBoard(new SeededRng(seed ^ 0x11111111), CLASSIC_FLEET),
    boardB: createRandomBoard(new SeededRng(seed ^ 0x22222222), CLASSIC_FLEET),
    playerA: players[0], playerB: players[1]
  });
  try {
    const result = game.run(250);
    return { winner: players[result.winner].name, turns: result.turns, stall: null };
  } catch (error) {
    if (!(error instanceof HistoricalAiStallError)) throw error;
    return { winner: null, turns: game.history.length, stall: players[game.turn].name };
  }
}

const gamesPerPair = Number(process.argv[2] ?? 500);
const results = [];
for (let i = 0; i < factories.length; i += 1) {
  for (let j = i + 1; j < factories.length; j += 1) {
    const [nameA, fa] = factories[i];
    const [nameB, fb] = factories[j];
    let aWins = 0, bWins = 0, aStalls = 0, bStalls = 0, turns = 0;
    for (let g = 0; g < gamesPerPair; g += 1) {
      const seed = (0x6ba70000 + i * 100000 + j * 10000 + g) >>> 0;
      const r = play(seed, fa, fb, g % 2 === 1);
      turns += r.turns;
      if (r.winner === nameA) aWins += 1;
      else if (r.winner === nameB) bWins += 1;
      else if (r.stall === nameA) aStalls += 1;
      else if (r.stall === nameB) bStalls += 1;
      else throw new Error(`Unexpected result ${JSON.stringify(r)}`);
    }
    const completed = aWins + bWins;
    results.push({
      a: nameA, b: nameB, games: gamesPerPair,
      aWins, bWins, aStalls, bStalls, completed,
      aWinRateCompleted: completed ? aWins / completed : null,
      stallRate: (aStalls + bStalls) / gamesPerPair,
      averageTurnsToWinOrStall: turns / gamesPerPair
    });
  }
}
console.log(JSON.stringify({ fleet: CLASSIC_FLEET, gamesPerPair, results }, null, 2));
