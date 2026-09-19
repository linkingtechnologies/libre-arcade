import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadBoard } from '../public/src/node/board-loader.js';
import { Game } from '../public/src/core/game.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const board = loadBoard(path.join(root, 'public', 'boards', 'grugnetto-32-v1.4', 'board.json'));
const legacy = ['Zilla','Queen','Wallace','Hans','Mimrock','Lost Soul','Lemming'];

function runInstrumented(agents, seed, maxTurns = Number(process.env.MAX_TURNS || 1500)) {
  const game = new Game({ board, agents, seed, maxTurns });
  const paz = game.players.find(p => p.profileName === 'Pazifik');
  let cashTotal = 0, cashSamples = 0, builds = 0, auctionSeen = 0, auctionParticipations = 0, auctionWins = 0, auctionSpend = 0, auctionNominal = 0;
  const bankruptOrder = [];
  while (game.activePlayers().length > 1 && game.turnNumber < game.maxTurns) {
    game.roundNumber += 1;
    for (const player of game.players) {
      if (game.activePlayers().length <= 1 || game.turnNumber >= game.maxTurns) break;
      if (player.id === paz.id && !player.bankrupt) { cashTotal += player.cash; cashSamples += 1; }
      game.playTurn(player);
      const events = game.drainEvents();
      for (const e of events) {
        if (e.type === 'EMBELLISHMENT_BUILT' && e.playerId === paz.id) builds += 1;
        if (e.type === 'AUCTION_LIMIT_SET' && e.playerId === paz.id) {
          auctionSeen += 1;
          if (e.maxBid > 0) auctionParticipations += 1;
        }
        if (e.type === 'AUCTION_ENDED' && e.winnerId === paz.id) {
          auctionWins += 1; auctionSpend += e.price;
          const space = board.spaces[e.index]; auctionNominal += space.price;
        }
        if (e.type === 'PLAYER_BANKRUPT') bankruptOrder.push(e.playerId);
      }
    }
  }
  const alive = game.activePlayers();
  const ranked = [...game.players].sort((a,b) => {
    if (a.bankrupt !== b.bankrupt) return a.bankrupt ? 1 : -1;
    return game.netWorth(b) - game.netWorth(a);
  });
  const winner = alive.length === 1 ? alive[0] : ranked[0];
  const pazRank = ranked.findIndex(p => p.id === paz.id) + 1;
  const bankruptIndex = bankruptOrder.indexOf(paz.id);
  return {
    completed: alive.length === 1,
    turns: game.turnNumber,
    winner: winner?.name ?? null,
    pazWon: alive.length === 1 && winner?.id === paz.id,
    pazLeader: winner?.id === paz.id,
    pazRank,
    pazBankrupt: paz.bankrupt,
    pazBankruptOrder: bankruptIndex >= 0 ? bankruptIndex + 1 : null,
    averageCash: cashSamples ? cashTotal / cashSamples : paz.cash,
    builds,
    purchases: paz.purchases,
    auctionSeen,
    auctionParticipations,
    auctionWins,
    averageAuctionPrice: auctionWins ? auctionSpend / auctionWins : 0,
    averageAuctionPriceRatio: auctionWins ? auctionSpend / auctionNominal : 0,
    finalCash: paz.cash,
    finalNetWorth: game.netWorth(paz)
  };
}

function summarize(rows) {
  const n = rows.length;
  const avg = key => rows.reduce((s,r)=>s+(r[key]??0),0)/n;
  const sortedTurns=[...rows].map(r=>r.turns).sort((a,b)=>a-b);
  const med=sortedTurns[Math.floor(n/2)];
  return {
    games:n,
    completedWinRate:rows.filter(r=>r.pazWon).length/n,
    leaderAtEndRate:rows.filter(r=>r.pazLeader).length/n,
    leaderAtCapRate:rows.filter(r=>!r.completed && r.pazLeader).length/n,
    completionRate:rows.filter(r=>r.completed).length/n,
    averageTurns:avg('turns'), medianTurns:med,
    averageCash:avg('averageCash'),
    averageBuilds:avg('builds'),
    averagePurchases:avg('purchases'),
    averageAuctionsSeen:avg('auctionSeen'),
    averageAuctionParticipations:avg('auctionParticipations'),
    averageAuctionWins:avg('auctionWins'),
    averageWinningAuctionPrice: rows.reduce((s,r)=>s+r.averageAuctionPrice*r.auctionWins,0) / Math.max(1,rows.reduce((s,r)=>s+r.auctionWins,0)),
    winningAuctionPriceToNominal: rows.reduce((s,r)=>s+r.averageAuctionPriceRatio*r.auctionWins,0) / Math.max(1,rows.reduce((s,r)=>s+r.auctionWins,0)),
    bankruptcyRate:rows.filter(r=>r.pazBankrupt).length/n,
    deadlockRate:rows.filter(r=>!r.completed).length/n,
    averageRank:avg('pazRank')
  };
}

const pairGames = Number(process.env.PAIR_GAMES || 300);
const multiplayerGames = Number(process.env.MULTI_GAMES || 500);
const pairwise = {};
let seed = 200000;
for (const opponent of legacy) {
  const rows=[];
  for (let i=0;i<pairGames;i++) rows.push(runInstrumented(['Pazifik',opponent],seed++));
  pairwise[opponent]=summarize(rows);
}
const multiRows=[];
for (let i=0;i<multiplayerGames;i++) multiRows.push(runInstrumented(['Pazifik',...legacy],seed++));
const multiplayer=summarize(multiRows);
multiplayer.firstBankruptcyRate=multiRows.filter(r=>r.pazBankruptOrder===1).length/multiplayerGames;
multiplayer.firstTwoBankruptciesRate=multiRows.filter(r=>r.pazBankruptOrder!=null && r.pazBankruptOrder<=2).length/multiplayerGames;
multiplayer.topHalfRate=multiRows.filter(r=>r.pazRank<=4).length/multiplayerGames;
const report={
  generatedAt:new Date().toISOString(), boardId:board.id, boardVersion:board.contentVersion,
  methodology:{pairGamesPerOpponent:pairGames,multiplayerGames,allEightAgents:['Pazifik',...legacy],maxTurns:Number(process.env.MAX_TURNS || 1500)},
  pairwise,multiplayer
};
const out=path.join(root,'specs','pazifik-benchmark.json');
fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
