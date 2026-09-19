import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadBoard } from '../public/src/node/board-loader.js';
import { Game } from '../public/src/core/game.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const board = loadBoard(path.join(root, 'public', 'boards', 'grugnetto-32-v1.4', 'board.json'));
const args = process.argv.slice(2);
const value = flag => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : undefined; };
const games = Number(value('--games') ?? 10000);
const seedStart = Number(value('--seed') ?? 20000);
const agents = (value('--agents') ?? 'Zilla,Queen,Wallace,Hans').split(',');
const maxTurns = Number(value('--max-turns') ?? 6000);

const totals = board.spaces.map((space, index) => ({
  index, name: (space.name ?? space.id), type: space.type, world: space.world ?? null,
  price: space.price ?? 0, landings: 0, acquisitions: 0, acquisitionSpend: 0,
  rentCollected: 0, embellishmentsBought: 0, embellishmentSpend: 0
}));
const wins = Object.fromEntries(agents.map(a => [a, 0]));
let completed = 0;
let turns = 0;
for (let i = 0; i < games; i += 1) {
  const result = new Game({ board, agents, seed: seedStart + i, maxTurns }).run();
  wins[result.winner] = (wins[result.winner] ?? 0) + 1;
  completed += result.completed ? 1 : 0;
  turns += result.turns;
  for (const st of result.spaceStats) {
    const t = totals[st.index];
    t.landings += st.landings;
    t.acquisitions += st.acquisitions;
    t.acquisitionSpend += st.acquisitionSpend;
    t.rentCollected += st.rentCollected;
    t.embellishmentsBought += st.embellishmentsBought;
    t.embellishmentSpend += st.embellishmentSpend;
  }
}

const siteTotals = totals.filter(x => x.type === 'site').map(x => ({
  ...x,
  avgLandings: x.landings / games,
  avgRent: x.rentCollected / games,
  rentPerLanding: x.landings ? x.rentCollected / x.landings : 0,
  rentVsListPrice: x.price ? x.rentCollected / games / x.price : 0,
  acquisitionRate: x.acquisitions / games,
  avgAcquisitionPrice: x.acquisitions ? x.acquisitionSpend / x.acquisitions : 0,
  embellishmentsPerGame: x.embellishmentsBought / games
}));
const worlds = Object.fromEntries(board.worlds.map(w => [w.id, {
  id: w.id, name: w.id, sites: 0, listPrice: 0, landings: 0, rentCollected: 0,
  acquisitions: 0, acquisitionSpend: 0, embellishmentsBought: 0, embellishmentSpend: 0
}]));
for (const x of siteTotals) {
  const w = worlds[x.world];
  w.sites += 1; w.listPrice += x.price; w.landings += x.landings; w.rentCollected += x.rentCollected;
  w.acquisitions += x.acquisitions; w.acquisitionSpend += x.acquisitionSpend;
  w.embellishmentsBought += x.embellishmentsBought; w.embellishmentSpend += x.embellishmentSpend;
}
const worldRows = Object.values(worlds).map(w => ({
  ...w,
  avgLandingsPerGame: w.landings / games,
  avgRentPerGame: w.rentCollected / games,
  rentVsListPrice: w.listPrice ? (w.rentCollected / games) / w.listPrice : 0,
  acquisitionRatePerSite: w.sites ? w.acquisitions / games / w.sites : 0,
  avgAcquisitionPrice: w.acquisitions ? w.acquisitionSpend / w.acquisitions : 0,
  embellishmentsPerGame: w.embellishmentsBought / games
}));

const report = {
  games, seedStart, agents, completed, completionRate: completed / games,
  averageTurns: turns / games, wins,
  winRates: Object.fromEntries(Object.entries(wins).map(([k,v]) => [k, v / games])),
  worlds: worldRows,
  sites: siteTotals
};
console.log(JSON.stringify(report, null, 2));
