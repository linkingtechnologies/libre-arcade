import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { loadBoard } from '../public/src/node/board-loader.js';
import { SeededRng } from '../public/src/core/rng.js';
import { CPU_PROFILES } from '../public/src/players/profiles.js';
import { Game } from '../public/src/core/game.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const board = loadBoard(path.join(root, 'public', 'boards', 'grugnetto-32-v1.4', 'board.json'));
const parityBoard = loadBoard(path.join(root, 'tests', 'fixtures', 'board-0.2-parity.json'));
const locales = Object.fromEntries(['it','en','fr','de'].map(code => [code, JSON.parse(fs.readFileSync(path.join(root, 'public', 'boards', 'grugnetto-32-v1.4', 'i18n', `${code}.json`), 'utf8'))]));

test('Grugnetto board has 32 spaces and detention is not a corner', () => {
  assert.equal(board.spaces.length, 32);
  assert.equal(board.detentionIndex, 13);
  assert.notEqual(board.detentionIndex % 8, 0);
});



test('all four Grugnetto Go worlds are present with four sites each', () => {
  const expected = { world1: 4, world2: 4, world3: 4, world4: 4 };
  const counts = Object.fromEntries(Object.keys(expected).map(id => [id, board.spaces.filter(s => s.type === 'site' && s.world === id).length]));
  assert.deepEqual(counts, expected);
  assert.deepEqual(Object.values(locales.it.worlds), ['Prato di Casa', 'Bosco degli Scoiattoli', 'Dune Dorate', 'Miniera di Pietra']);
});

test('Grugnetto art references are separated from engine data', () => {
  assert.equal(board.currencyAsset, 'assets/grugnetto/collectable_coin.png');
  assert.equal(board.humanTokenAsset, 'assets/grugnetto/grugnetto_idle.png');
});

test('referenced board art exists in the packaged project', () => {
  const refs = [board.currencyAsset, board.humanTokenAsset, ...board.spaces.map(s => s.asset).filter(Boolean)];
  for (const ref of refs) assert.equal(fs.existsSync(path.join(root, 'public', ref)), true, `missing ${ref}`);
});

test('historical friends use a coherent configurable CC0 pawn set', () => {
  const pawns = JSON.parse(fs.readFileSync(path.join(root, 'public', 'config', 'pawns.json'), 'utf8'));
  assert.deepEqual(Object.keys(pawns.cpu), ['Zilla','Queen','Wallace','Hans','Mimrock','Lost Soul','Lemming','Pazifik']);
  for (const [name, entry] of Object.entries(pawns.cpu)) {
    assert.match(
      entry.asset,
      /^assets\/grugnetto-go\/enemies\/.+\.png$/
    );
    assert.equal(fs.existsSync(path.join(root, 'public', entry.asset)), true, `missing pawn for ${name}`);
  }
  assert.match(pawns.license.grugnettoGoEnemyTokens, /Kenney.*CC0/i);
  assert.match(pawns.cpu.Hans.asset, /frog_idle\.png$/);
  assert.match(pawns.cpu.Zilla.asset, /slime_normal_rest\.png$/);
  assert.match(pawns.cpu.Queen.asset, /bee_rest\.png$/);
});

test('seeded RNG is reproducible', () => {
  const a = new SeededRng(99);
  const b = new SeededRng(99);
  assert.deepEqual(Array.from({ length: 20 }, () => a.nextUint32()), Array.from({ length: 20 }, () => b.nextUint32()));
});

test('seven KludgopolB CPUs plus Pazifik historical reimplementation are present', () => {
  assert.deepEqual(Object.keys(CPU_PROFILES), ['Mimrock', 'Zilla', 'Queen', 'Wallace', 'Hans', 'Lost Soul', 'Pazifik', 'Lemming']);
  assert.equal(CPU_PROFILES.Pazifik.strategy, 'pazifik-simple-ai');
  assert.equal(CPU_PROFILES.Pazifik.deterministic, true);
  assert.deepEqual(CPU_PROFILES.Zilla.siteValues, [1.0, 1.2, 0.5]);
  assert.equal(CPU_PROFILES['Lost Soul'].randomBid, true);
  assert.equal(CPU_PROFILES.Lemming.reserveFromStartKept, 200);
});

test('same seed gives the same full game result', () => {
  const opts = { board, agents: ['Zilla', 'Queen', 'Wallace', 'Hans'], seed: 1234, maxTurns: 4000 };
  const a = new Game(opts).run();
  const b = new Game(opts).run();
  assert.deepEqual(a, b);
});

test('four CPUs can complete a headless game', () => {
  const result = new Game({ board, agents: ['Zilla', 'Queen', 'Wallace', 'Hans'], seed: 12345, maxTurns: 6000 }).run();
  assert.equal(result.completed, true);
  assert.ok(result.turns > 0 && result.turns < 6000);
  assert.ok(['Zilla', 'Queen', 'Wallace', 'Hans'].includes(result.winner));
});

import {
  canTradeIndexes,
  currentHubGainCost,
  currentServiceGainCost,
  currentSiteGainCost,
  proposeCpuTrade,
  targetAcceptsCpuTrade,
  tradingChanges
} from '../public/src/core/trading.js';

function makeTradeFixture() {
  const game = new Game({ board: parityBoard, agents: ['Zilla', 'Queen'], seed: 1, maxTurns: 100 });
  const zilla = game.players.find(p => p.name === 'Zilla');
  const queen = game.players.find(p => p.name === 'Queen');
  const own = (player, index) => {
    game.state[index].owner = player.id;
    player.properties.push(index);
  };
  own(zilla, 1);  // bronze
  own(queen, 3);  // bronze
  own(zilla, 5);  // hub
  own(queen, 16); // hub
  own(zilla, 12); // service
  own(queen, 24); // service
  return { game, zilla, queen };
}

test('trading portfolio valuation follows CurrentState Java formulas', () => {
  const { game, zilla, queen } = makeTradeFixture();
  assert.equal(currentSiteGainCost(game, zilla, zilla.profile.siteValues), 76);
  assert.equal(currentSiteGainCost(game, queen, zilla.profile.siteValues), 93);
  assert.equal(currentHubGainCost(game, zilla, zilla.profile.hubValues), 236);
  assert.equal(currentHubGainCost(game, queen, zilla.profile.hubValues), 258);
  assert.equal(currentServiceGainCost(game, zilla, zilla.profile.serviceValues), 162);
  assert.equal(currentServiceGainCost(game, queen, zilla.profile.serviceValues), 191);
  assert.deepEqual(tradingChanges(game, zilla, queen, [], [3], zilla.profile), [272, 0]);
});

test('sites cannot be traded while any site in their group is developed', () => {
  const { game, zilla } = makeTradeFixture();
  assert.ok(canTradeIndexes(game, zilla).includes(1));
  game.state[1].embellishments = 1;
  assert.ok(!canTradeIndexes(game, zilla).includes(1));
});

test('PlayerCPUTrader proposal is deterministic under fixed decision/state RNG streams', () => {
  const { game, zilla, queen } = makeTradeFixture();
  const proposal = proposeCpuTrade(game, zilla, queen, {
    decisionRng: new SeededRng(1),
    stateRng: new SeededRng(2)
  });
  assert.equal(proposal.shouldTrade, true);
  assert.deepEqual(proposal.traderToGive, [1]);
  assert.deepEqual(proposal.targetToGive, [24]);
  assert.equal(proposal.traderGivesCash, 42);
  assert.deepEqual(proposal.transferValues, [404, 238]);
});

test('CPU target independently accepts or declines the same proposal', () => {
  const { game, zilla, queen } = makeTradeFixture();
  const proposal = proposeCpuTrade(game, zilla, queen, {
    decisionRng: new SeededRng(1),
    stateRng: new SeededRng(2)
  });
  const decline = targetAcceptsCpuTrade(game, proposal, { decisionRng: new SeededRng(77) });
  const accept = targetAcceptsCpuTrade(game, proposal, { decisionRng: new SeededRng(2) });
  assert.equal(decline.accepted, false);
  assert.equal(accept.accepted, true);
  assert.equal(decline.chance, accept.chance);
  assert.deepEqual(decline.targetValues, [404, 280]);
});

test('each Grugnetto world has a comparable total acquisition cost', () => {
  const totals = Object.fromEntries(board.worlds.map(w => [w.id, board.spaces.filter(s => s.type === 'site' && s.world === w.id).reduce((sum, s) => sum + s.price, 0)]));
  assert.deepEqual(totals, { world1: 595, world2: 600, world3: 600, world4: 595 });
});

test('economy is original and probability-calibrated', () => {
  assert.equal(board.economy.version, 'v1');
  assert.match(board.economy.note, /original Grugnetto pricing and revenue tables/);
  for (const space of board.spaces.filter(s => ['site', 'hub', 'service'].includes(s.type))) {
    assert.ok(space.landingWeight > 0);
  }
});

test('agreed Grugnetto special-space vocabulary is present in Italian locale', () => {
  const names = new Set(Object.values(locales.it.spaces));
  for (const name of ['Casa di Grugnetto', 'Portale del Prato', 'Passaggio del Bosco', 'Galleria dei Mondi', 'Bottega delle Provviste', 'Officina di Grugnetto', 'Campo Base', 'Torna al Campo Base', 'Riparazioni', 'Pedaggio del Ponte', 'Area Picnic', 'Grande Portale', 'Avventura!', 'Contrattempo!']) {
    assert.ok(names.has(name), `missing ${name}`);
  }
});

test('board configuration is language-neutral and frozen', () => {
  assert.equal(board.frozen, true);
  assert.equal(board.contentVersion, '1.4.1');
  assert.deepEqual(board.locales, ['it', 'en', 'fr', 'de']);
  for (const space of board.spaces) {
    assert.ok(space.id);
    assert.equal('name' in space, false);
    assert.equal('nameEN' in space, false);
  }
  for (const cards of Object.values(board.events)) for (const card of cards) {
    assert.equal('text' in card, false);
    assert.equal('textEN' in card, false);
  }
});


test('themed event engine supports portals, ownership and embellishment effects', () => {
  const game = new Game({ board, agents: ['Zilla', 'Queen'], seed: 77, maxTurns: 100 });
  const zilla = game.players.find(p => p.name === 'Zilla');
  const own = index => { game.state[index].owner = zilla.id; zilla.properties.push(index); };
  // Complete Home Meadow so the free-embellishment Adventure has an eligible Place.
  for (const index of [1, 3, 6, 7]) own(index);
  const cashBefore = zilla.cash;
  game.applyEventCard(zilla, { id: 'test-income', cashPerOwnedSite: 12 }, 7, 0);
  assert.equal(zilla.cash, cashBefore + 48);
  assert.equal(game.grantEventEmbellishment(zilla), true);
  assert.equal(zilla.properties.map(i => game.state[i].embellishments).reduce((a,b) => a+b, 0), 1);
  assert.equal(game.removeEventEmbellishment(zilla), true);
  assert.equal(zilla.properties.map(i => game.state[i].embellishments).reduce((a,b) => a+b, 0), 0);
  zilla.position = 2;
  game.moveToNextType(zilla, 'hub');
  assert.equal(board.spaces[zilla.position].id, 'meadow-portal');
});

test('event decks remain eight-card deterministic cycles', () => {
  const a = new Game({ board, agents: ['Zilla', 'Queen'], seed: 4242, maxTurns: 100 });
  const b = new Game({ board, agents: ['Zilla', 'Queen'], seed: 4242, maxTurns: 100 });
  for (const deckName of ['avventure', 'contrattempi']) {
    const seqA = Array.from({ length: 8 }, () => a.drawEvent(deckName).id);
    const seqB = Array.from({ length: 8 }, () => b.drawEvent(deckName).id);
    assert.deepEqual(seqA, seqB);
    assert.equal(new Set(seqA).size, 8);
  }
});


test('all four locales completely cover board, worlds and event cards', () => {
  const spaceIds = board.spaces.map(space => space.id).sort();
  const worldIds = board.worlds.map(world => world.id).sort();
  const eventIds = Object.values(board.events).flat().map(card => card.id).sort();
  for (const code of board.locales) {
    const l = locales[code];
    assert.equal(l.locale, code);
    assert.deepEqual(Object.keys(l.spaces).sort(), spaceIds, `${code}: spaces`);
    assert.deepEqual(Object.keys(l.worlds).sort(), worldIds, `${code}: worlds`);
    assert.deepEqual(Object.keys(l.events).sort(), eventIds, `${code}: events`);
    for (const id of eventIds) {
      assert.equal(typeof l.events[id], 'object', `${code}/${id}: event copy object`);
      assert.ok(l.events[id].title?.trim(), `${code}/${id}: title`);
      assert.ok(l.events[id].text?.trim(), `${code}/${id}: text`);
    }
    assert.equal(l.copyVersion, '1.3.0');
    assert.ok(l.boardTitle && l.currencyName && l.preview && l.footer);
  }
});

test('site revenues use the v1 embellishment curve', () => {
  for (const site of board.spaces.filter(s => s.type === 'site')) {
    const r = site.rents[0];
    assert.deepEqual(site.rents, [r, Math.round(r * 3), Math.round(r * 10), Math.round(r * 24), Math.round(r * 50)]);
  }
});

import { GameController } from '../public/src/core/controller.js';
import { serializeSave, deserializeSave } from '../public/src/core/save.js';

test('browser-facing core has no Node built-in imports', () => {
  for (const rel of ['src/core/board.js', 'src/core/game.js', 'src/core/player.js', 'src/core/rng.js', 'src/core/trading.js', 'src/core/valuation.js', 'src/core/controller.js', 'src/core/save.js']) {
    const text = fs.readFileSync(path.join(root, 'public', rel), 'utf8');
    assert.equal(/from ['"]node:/.test(text), false, rel);
  }
});

test('controller pauses for human decisions and emits structured UI events', () => {
  const controller = GameController.create({
    board,
    participants: [{ type: 'human', name: 'Grugnetto' }, { type: 'cpu', profile: 'Zilla' }],
    seed: 7,
    maxTurns: 200
  });
  let packet = controller.advance();
  // Start order is shuffled: CPU turns, if first, are consumed automatically until the human is reached.
  assert.ok(['ROLL_DICE', 'DETENTION_ACTION', 'TRADE_OFFER', 'TURN_REVIEW'].includes(packet.pendingDecision.type));
  while (['TRADE_OFFER', 'TURN_REVIEW'].includes(packet.pendingDecision.type)) packet = controller.dispatch({ type: packet.pendingDecision.type === 'TURN_REVIEW' ? 'ACK_TURN' : 'DECLINE_TRADE' });
  if (packet.pendingDecision.type === 'DETENTION_ACTION') packet = controller.dispatch({ type: 'ROLL_DICE' });
  else packet = controller.dispatch({ type: 'ROLL_DICE' });
  assert.ok(packet.events.some(event => event.type === 'DICE_ROLLED'));
  assert.ok(packet.events.some(event => ['PLAYER_MOVED', 'SENT_TO_BASE'].includes(event.type)));
  assert.ok(packet.pendingDecision);
});

function defaultHumanAction(decision) {
  if (decision.type === 'ROLL_DICE' || decision.type === 'DETENTION_ACTION') return { type: 'ROLL_DICE' };
  if (decision.type === 'BUY_PROPERTY') return { type: 'BUY' };
  if (decision.type === 'AUCTION_BIDS') return { type: 'RESOLVE_AUCTION', bids: Object.fromEntries(decision.humanBidders.map(b => [b.playerId, 0])) };
  if (decision.type === 'TURN_ACTIONS') return { type: 'END_TURN' };
  if (decision.type === 'TRADE_OFFER') return { type: 'DECLINE_TRADE' };
  if (decision.type === 'TURN_REVIEW') return { type: 'ACK_TURN' };
  throw new Error(`Unhandled test decision ${decision.type}`);
}

function driveController(controller, steps) {
  let packet = controller.pendingDecision ? { pendingDecision: controller.pendingDecision, status: controller.status } : controller.advance();
  for (let i = 0; i < steps && packet.status !== 'complete'; i += 1) {
    if (!packet.pendingDecision) packet = controller.advance();
    else packet = controller.dispatch(defaultHumanAction(packet.pendingDecision));
  }
  return packet;
}

test('save/load round-trip preserves RNG, decks and an in-progress human decision', () => {
  const original = GameController.create({
    board,
    participants: [{ type: 'human', name: 'Grugnetto' }, { type: 'cpu', profile: 'Zilla' }, { type: 'cpu', profile: 'Queen' }],
    seed: 42,
    maxTurns: 500
  });
  driveController(original, 13);
  assert.ok(original.pendingDecision);
  const before = original.getPublicState();
  const json = serializeSave(original);
  const restored = deserializeSave({ board, json });
  assert.deepEqual(restored.getPublicState(), before);
  assert.deepEqual(restored.pendingDecision, original.pendingDecision);
  assert.deepEqual(restored.game.rng.toSnapshot(), original.game.rng.toSnapshot());
  assert.deepEqual(restored.game.eventCursor, original.game.eventCursor);

  driveController(original, 30);
  driveController(restored, 30);
  assert.deepEqual(restored.getPublicState(), original.getPublicState());
  assert.deepEqual(restored.game.rng.toSnapshot(), original.game.rng.toSnapshot());
  assert.deepEqual(restored.game.eventCursor, original.game.eventCursor);
});

test('save refuses to load against a different board version', () => {
  const controller = GameController.create({ board, participants: [{ type: 'human', name: 'G' }, { type: 'cpu', profile: 'Zilla' }], seed: 2 });
  controller.advance();
  const json = serializeSave(controller);
  assert.throws(() => deserializeSave({ board: { ...board, contentVersion: '0.0.0-other' }, json }), /board\/version mismatch/);
});

test('mixed human/CPU controller can finish complete games without UI-specific hacks', () => {
  for (let seed = 1; seed <= 5; seed += 1) {
    const controller = GameController.create({
      board,
      participants: [{ type: 'human', name: 'Grugnetto' }, { type: 'cpu', profile: 'Zilla' }, { type: 'cpu', profile: 'Queen' }, { type: 'cpu', profile: 'Hans' }],
      seed,
      maxTurns: 3000
    });
    let packet = controller.advance();
    let decisions = 0;
    while (packet.status !== 'complete' && decisions < 10000) {
      const d = packet.pendingDecision;
      if (!d) packet = controller.advance();
      else if (d.type === 'BUY_PROPERTY' && d.cash < d.price) packet = controller.dispatch({ type: 'AUCTION' });
      else packet = controller.dispatch(defaultHumanAction(d));
      decisions += 1;
    }
    assert.equal(packet.status, 'complete', `seed ${seed}`);
  }
});

test('human trade proposals use the same CPU acceptance engine and return to turn actions', () => {
  const controller = GameController.create({ board: parityBoard, participants: [{ type: 'human', name: 'Grugnetto' }, { type: 'cpu', profile: 'Zilla' }], seed: 9, maxTurns: 100 });
  const human = controller.game.players.find(p => p.type === 'human');
  const cpu = controller.game.players.find(p => p.type === 'cpu');
  for (const [player, index] of [[human, 1], [cpu, 3]]) {
    controller.game.state[index].owner = player.id;
    player.properties.push(index);
  }
  controller.currentIndex = controller.game.players.indexOf(human);
  controller.humanTurn = { playerId: human.id, doublesCount: 0, lastRoll: { a: 2, b: 3, total: 5, doubles: false }, forceNoExtraRoll: false };
  controller.pendingDecision = { type: 'TURN_ACTIONS', playerId: human.id, actions: controller.game.availableHumanActions(human) };
  const packet = controller.dispatch({ type: 'PROPOSE_TRADE', targetId: cpu.id, traderToGive: [1], targetToGive: [3], cash: 0 });
  assert.equal(packet.pendingDecision.type, 'TURN_ACTIONS');
  assert.ok(packet.events.some(e => e.type === 'TRADE_PROPOSED'));
  assert.ok(packet.events.some(e => ['TRADE_ACCEPTED', 'TRADE_DECLINED'].includes(e.type)));
});


test('RC45 gives every CPU friend a distinct Grugnetto Go character pawn', () => {
  const pawns = JSON.parse(fs.readFileSync(path.join(root, 'public', 'config', 'pawns.json'), 'utf8'));
  const entries = Object.entries(pawns.cpu);
  assert.equal(entries.length, 8);
  const assets = entries.map(([, entry]) => entry.asset);
  assert.equal(new Set(assets).size, 8);
  for (const [name, entry] of entries) {
    assert.match(entry.asset, /^assets\/grugnetto-go\/enemies\/.+\.png$/);
    assert.equal(fs.existsSync(path.join(root, 'public', entry.asset)), true, `missing Grugnetto Go pawn for ${name}`);
  }
  assert.equal(pawns.reserveCharacters.length >= 2, true);
});
