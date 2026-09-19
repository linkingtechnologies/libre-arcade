import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadBoard } from '../public/src/node/board-loader.js';
import { Game } from '../public/src/core/game.js';
import {
  pazifikPurchaseDecision,
  pazifikAuctionDecision,
  pazifikDetentionDecision
} from '../public/src/players/profiles.js';
import { targetAcceptsCpuTrade } from '../public/src/core/trading.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const board = loadBoard(path.join(root, 'public', 'boards', 'grugnetto-32-v1.4', 'board.json'));

// Mandatory SimpleAI behavioural parity cases.
test('Pazifik purchase parity: cash 301 price 300 -> BUY', () => {
  assert.equal(pazifikPurchaseDecision({ cash: 301, price: 300 }), 'BUY');
});
test('Pazifik purchase parity: cash 300 price 300 -> AUCTION', () => {
  assert.equal(pazifikPurchaseDecision({ cash: 300, price: 300 }), 'AUCTION');
});
test('Pazifik auction parity: 198/200 cash 1000 -> BID 199', () => {
  assert.deepEqual(pazifikAuctionDecision({ highestBid: 198, price: 200, cash: 1000 }), { action: 'BID', bid: 199 });
});
test('Pazifik auction parity: 199/200 cash 1000 -> PASS', () => {
  assert.deepEqual(pazifikAuctionDecision({ highestBid: 199, price: 200, cash: 1000 }), { action: 'PASS', bid: null });
});
test('Pazifik auction parity: 148/300 cash 150 -> BID 149', () => {
  assert.deepEqual(pazifikAuctionDecision({ highestBid: 148, price: 300, cash: 150 }), { action: 'BID', bid: 149 });
});
test('Pazifik auction parity: 149/300 cash 150 -> PASS', () => {
  assert.deepEqual(pazifikAuctionDecision({ highestBid: 149, price: 300, cash: 150 }), { action: 'PASS', bid: null });
});
test('Pazifik detention parity: card -> USE_CARD', () => {
  assert.equal(pazifikDetentionDecision({ hasCard: true, cash: 0 }), 'USE_CARD');
});
test('Pazifik detention parity: no card cash 51 -> PAY', () => {
  assert.equal(pazifikDetentionDecision({ hasCard: false, cash: 51 }), 'PAY');
});
test('Pazifik detention parity: no card cash 50 -> ROLL', () => {
  assert.equal(pazifikDetentionDecision({ hasCard: false, cash: 50 }), 'ROLL');
});

test('Pazifik auction starts at one when current bid is zero', () => {
  assert.deepEqual(pazifikAuctionDecision({ highestBid: 0, price: 200, cash: 1000 }), { action: 'BID', bid: 1 });
});

test('Pazifik never initiates a trade and declines incoming CPU trades', () => {
  const game = new Game({ board, agents: ['Pazifik', 'Zilla'], seed: 101, maxTurns: 100 });
  const pazifik = game.players.find(p => p.profileName === 'Pazifik');
  const zilla = game.players.find(p => p.profileName === 'Zilla');
  assert.equal(game.attemptTrade(pazifik), false);
  const proposal = { trader: zilla, target: pazifik, traderToGive: [], targetToGive: [], traderGivesCash: 10, shouldTrade: true };
  const decision = targetAcceptsCpuTrade(game, proposal);
  assert.equal(decision.accepted, false);
  assert.equal(decision.chance, 0);
});

test('Pazifik develops immediately in board order with no cash reserve', () => {
  const game = new Game({ board, agents: ['Pazifik', 'Lemming'], seed: 102, maxTurns: 100 });
  const p = game.players.find(x => x.profileName === 'Pazifik');
  const home = board.spaces.map((s,i)=>({s,i})).filter(x => x.s.type === 'site' && x.s.world === 'world1');
  for (const {i} of home) { game.state[i].owner = p.id; p.properties.push(i); }
  p.cash = home[0].s.buildCost;
  game.develop(p);
  assert.equal(game.state[home[0].i].embellishments, 1);
  assert.equal(p.cash, 0);
  assert.equal(home.slice(1).reduce((n,x)=>n+game.state[x.i].embellishments,0), 0);
});

test('Pazifik minimal debt adapter sells embellishments then pledges in board order', () => {
  const game = new Game({ board, agents: ['Pazifik', 'Lemming'], seed: 103, maxTurns: 100 });
  const p = game.players.find(x => x.profileName === 'Pazifik');
  const props = board.spaces.map((s,i)=>({s,i})).filter(x => ['site','hub','service'].includes(x.s.type)).slice(0,3);
  for (const {i} of props) { game.state[i].owner = p.id; p.properties.push(i); }
  game.state[props[0].i].embellishments = 2;
  p.developments = 2;
  p.cash = 0;
  game.liquidateToCash(p, 99999);
  assert.equal(game.state[props[0].i].embellishments, 0);
  assert.equal(game.state[props[0].i].pledged, true);
  assert.equal(game.state[props[1].i].pledged, true);
  assert.equal(game.state[props[2].i].pledged, true);
});

test('Pazifik full-game behavior is deterministic for a fixed seed', () => {
  const run = () => {
    const game = new Game({ board, agents: ['Pazifik', 'Zilla'], seed: 2007, maxTurns: 350 });
    const result = game.run();
    return {
      result,
      players: game.players.map(p => ({ name: p.name, cash: p.cash, bankrupt: p.bankrupt, properties: [...p.properties], developments: p.developments })),
      state: game.state,
      cursor: game.eventCursor
    };
  };
  assert.deepEqual(run(), run());
});
