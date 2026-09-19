import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadBoard } from '../public/src/node/board-loader.js';
import { Game } from '../public/src/core/game.js';
import { GameController } from '../public/src/core/controller.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const board = loadBoard(path.join(root, 'public', 'boards', 'grugnetto-32-v1.4', 'board.json'));

function freshGame(seed = 1) {
  return new Game({
    board,
    participants: [{ type: 'human', name: 'Grugnetto' }, { type: 'cpu', profile: 'Zilla' }],
    seed,
    maxTurns: 500
  });
}

function own(game, player, indexes) {
  for (const index of indexes) {
    game.state[index].owner = player.id;
    if (!player.properties.includes(index)) player.properties.push(index);
  }
}

function worldIndexes(worldId) {
  return board.spaces.map((s, i) => ({ s, i })).filter(({ s }) => s.type === 'site' && s.world === worldId).map(({ i }) => i);
}

function startHumanTurn(controller) {
  const human = controller.game.players.find(p => p.type === 'human');
  const idx = controller.game.players.indexOf(human);
  controller.currentIndex = (idx - 1 + controller.game.players.length) % controller.game.players.length;
  const packet = controller.advance();
  assert.equal(packet.pendingDecision?.playerId, human.id);
  return { human, packet };
}

test('QA rare: human can decline a Place and win the resulting auction through controller actions', () => {
  const controller = GameController.create({ board, participants: [{ type: 'human', name: 'Grugnetto' }, { type: 'cpu', profile: 'Lemming' }], seed: 301, maxTurns: 100 });
  const { human } = startHumanTurn(controller);
  human.position = 3; // roll 3 -> Frog Pond (index 6)
  controller.game.roll2d6 = () => ({ a: 1, b: 2, total: 3, doubles: false });
  let packet = controller.dispatch({ type: 'ROLL_DICE' });
  assert.equal(packet.pendingDecision?.type, 'BUY_PROPERTY');
  assert.equal(packet.pendingDecision?.index, 6);
  packet = controller.dispatch({ type: 'AUCTION' });
  assert.equal(packet.pendingDecision?.type, 'AUCTION_BIDS');
  packet = controller.dispatch({ type: 'RESOLVE_AUCTION', bids: { [human.id]: 1200 } });
  assert.equal(controller.game.state[6].owner, human.id);
  assert.ok(packet.events.some(e => e.type === 'AUCTION_ENDED' && e.winnerId === human.id));
});

test('QA rare: every Adventure and Setback card executes its configured effect', () => {
  const cases = [...board.events.avventure.map(card => ['avventure', card]), ...board.events.contrattempi.map(card => ['contrattempi', card])];
  assert.equal(cases.length, 16);
  for (const [deck, card] of cases) {
    const game = freshGame(400 + Number(card.id.slice(1)) + (deck === 'contrattempi' ? 100 : 0));
    const player = game.players.find(p => p.type === 'human');
    player.position = card.id === 'a3' ? 7 : 9;
    player.cash = 500;

    if (card.grantEmbellishment || card.removeEmbellishment) {
      const indexes = worldIndexes('world1');
      own(game, player, indexes);
      if (card.removeEmbellishment) {
        game.state[indexes[0]].embellishments = 2;
        player.developments = 2;
      }
    }
    if (card.cashPerOwnedSite) own(game, player, [1, 3]);
    if (card.cashPerEmbellishment) {
      own(game, player, [1, 3]);
      game.state[1].embellishments = 1;
      game.state[3].embellishments = 2;
      player.developments = 3;
    }

    const before = { cash: player.cash, position: player.position, detained: player.detained, developments: player.developments };
    const result = game.applyEventCard(player, card, 7, 0);
    assert.equal(player.bankrupt, false, `${card.id} unexpectedly bankrupted player`);

    if (card.cash > 0) assert.ok(player.cash >= before.cash + card.cash, `${card.id}: positive cash`);
    if (card.cash < 0 && !card.moveToNextType) assert.ok(player.cash <= before.cash + card.cash, `${card.id}: negative cash`);
    if (card.detain) assert.equal(player.detained, 1, `${card.id}: detention`);
    if (card.grantEmbellishment) assert.equal(player.developments, before.developments + 1, `${card.id}: grant embellishment`);
    if (card.removeEmbellishment) assert.equal(player.developments, before.developments - 1, `${card.id}: remove embellishment`);
    if (card.move) assert.equal(player.position, (before.position + card.move + board.spaces.length) % board.spaces.length, `${card.id}: relative move`);
    if (card.moveTo) assert.equal(player.position, board.spaces.findIndex(s => s.id === card.moveTo), `${card.id}: moveTo`);
    if (card.moveToNextType) assert.equal(board.spaces[player.position].type, card.moveToNextType, `${card.id}: next type`);
    if (card.resolve && result?.type === 'BUY_PROPERTY') assert.equal(result.index, player.position, `${card.id}: resolve target`);
  }
});

test('QA rare: event fallback branches pay cash when no embellishment can be granted or removed', () => {
  const game = freshGame(510);
  const player = game.players.find(p => p.type === 'human');
  player.cash = 100;
  const grant = board.events.avventure.find(c => c.grantEmbellishment);
  game.applyEventCard(player, grant, 7, 0);
  assert.equal(player.cash, 120);
  const remove = board.events.contrattempi.find(c => c.removeEmbellishment);
  game.applyEventCard(player, remove, 7, 0);
  assert.equal(player.cash, 95);
});

test('QA rare: bankruptcy during a payment liquidates first, transfers estate to creditor and leaves no ghost ownership', () => {
  const game = freshGame(520);
  const payer = game.players.find(p => p.type === 'human');
  const creditor = game.players.find(p => p.type === 'cpu');
  const indexes = worldIndexes('world1');
  own(game, payer, indexes);
  game.state[indexes[0]].embellishments = 2;
  payer.developments = 2;
  payer.cash = 5;
  const ok = game.pay(payer, 10000, creditor, { reason: 'qa-bankruptcy' });
  assert.equal(ok, false);
  assert.equal(payer.bankrupt, true);
  assert.equal(payer.cash, 0);
  assert.deepEqual(payer.properties, []);
  assert.equal(payer.developments, 0, 'liquidated embellishments should no longer remain in player state');
  for (const index of indexes) {
    assert.equal(game.state[index].owner, creditor.id);
    assert.equal(creditor.properties.includes(index), true);
    assert.equal(game.state[index].embellishments, 0);
  }
  assert.ok(game.events.some(e => e.type === 'PLAYER_BANKRUPT' && e.playerId === payer.id));
});

test('QA rare: bankruptcy to the bank releases ownership and clears property state', () => {
  const game = freshGame(521);
  const payer = game.players.find(p => p.type === 'human');
  own(game, payer, [1, 5]);
  game.state[1].pledged = true;
  payer.cash = 0;
  game.bankrupt(payer, null, { reason: 'qa-bank' });
  assert.equal(payer.bankrupt, true);
  assert.deepEqual(payer.properties, []);
  for (const index of [1, 5]) assert.deepEqual(game.state[index], { owner: null, pledged: false, embellishments: 0 });
});

test('QA rare: human management actions build, sell, pledge and redeem without stale availability', () => {
  const controller = GameController.create({ board, participants: [{ type: 'human', name: 'Grugnetto' }, { type: 'cpu', profile: 'Zilla' }], seed: 530, maxTurns: 100 });
  const human = controller.game.players.find(p => p.type === 'human');
  const indexes = worldIndexes('world1');
  own(controller.game, human, indexes);
  human.cash = 1200;
  controller.currentIndex = controller.game.players.indexOf(human);
  controller.humanTurn = { playerId: human.id, doublesCount: 0, lastRoll: { a: 2, b: 3, total: 5, doubles: false }, forceNoExtraRoll: false };
  controller.pendingDecision = { type: 'TURN_ACTIONS', playerId: human.id, actions: controller.game.availableHumanActions(human) };

  const target = indexes[0];
  let packet = controller.dispatch({ type: 'BUILD_EMBELLISHMENT', index: target });
  assert.equal(controller.game.state[target].embellishments, 1);
  assert.equal(human.developments, 1);
  packet = controller.dispatch({ type: 'SELL_EMBELLISHMENT', index: target });
  assert.equal(controller.game.state[target].embellishments, 0);
  assert.equal(human.developments, 0, 'selling an embellishment must update current development count');

  packet = controller.dispatch({ type: 'PLEDGE_PROPERTY', index: target });
  assert.equal(controller.game.state[target].pledged, true);
  const cost = Math.floor(board.spaces[target].price * 0.55 + 0.5);
  human.cash = cost - 1;
  controller._enterHumanActions();
  assert.equal(controller.pendingDecision.actions.redeem.some(a => a.index === target), false, 'unaffordable redemption must not be advertised as available');
  human.cash = cost + 100;
  controller._enterHumanActions();
  assert.equal(controller.pendingDecision.actions.redeem.some(a => a.index === target), true);
  packet = controller.dispatch({ type: 'REDEEM_PROPERTY', index: target });
  assert.equal(controller.game.state[target].pledged, false);
  assert.equal(packet.pendingDecision.type, 'TURN_ACTIONS');
});

test('QA rare: forced liquidation keeps current development count in sync', () => {
  const game = freshGame(540);
  const player = game.players.find(p => p.type === 'human');
  const indexes = worldIndexes('world1');
  own(game, player, indexes);
  game.state[indexes[0]].embellishments = 2;
  game.state[indexes[1]].embellishments = 1;
  player.developments = 3;
  player.cash = 0;
  game.liquidateToCash(player, 10000);
  assert.equal(indexes.reduce((sum, i) => sum + game.state[i].embellishments, 0), 0);
  assert.equal(player.developments, 0);
});

function makeCpuToHumanTradeController(seed = 2) {
  const controller = GameController.create({ board, participants: [{ type: 'human', name: 'Grugnetto' }, { type: 'cpu', profile: 'Zilla' }], seed, maxTurns: 100 });
  const human = controller.game.players.find(p => p.type === 'human');
  const cpu = controller.game.players.find(p => p.type === 'cpu');
  own(controller.game, human, [1, 3]);
  own(controller.game, cpu, [6, 7]);
  const outcome = controller.game.attemptTrade(cpu);
  assert.equal(outcome?.pending, true);
  assert.equal(outcome.proposal.target.id, human.id);
  controller.currentIndex = controller.game.players.indexOf(cpu);
  controller.resume = { type: 'cpu-post-trade', playerId: cpu.id };
  controller.pendingDecision = { type: 'TRADE_OFFER', playerId: human.id, proposal: controller.game.serializeTradeProposal(outcome.proposal) };
  return { controller, human, cpu, proposal: outcome.proposal };
}

test('QA rare: CPU to human trade can be accepted and resumes the CPU turn cleanly', () => {
  const { controller, human, cpu, proposal } = makeCpuToHumanTradeController();
  const humanCash = human.cash;
  const cpuCash = cpu.cash;
  const packet = controller.dispatch({ type: 'ACCEPT_TRADE' });
  for (const index of proposal.targetToGive) assert.equal(controller.game.state[index].owner, cpu.id);
  for (const index of proposal.traderToGive) assert.equal(controller.game.state[index].owner, human.id);
  assert.equal(human.cash, humanCash + proposal.traderGivesCash);
  assert.equal(cpu.cash <= cpuCash - proposal.traderGivesCash, true); // CPU may develop immediately after acceptance.
  assert.ok(packet.events.some(e => e.type === 'TRADE_ACCEPTED'));
  assert.notEqual(controller.pendingDecision?.type, 'TRADE_OFFER');
});

test('QA rare: CPU to human trade can be declined without transferring cash or Places', () => {
  const { controller, human, cpu, proposal } = makeCpuToHumanTradeController();
  const before = { humanCash: human.cash, cpuCash: cpu.cash, owners: controller.game.state.map(s => s.owner ?? null) };
  const packet = controller.dispatch({ type: 'DECLINE_TRADE' });
  assert.equal(human.cash, before.humanCash);
  assert.equal(cpu.cash <= before.cpuCash, true); // CPU may develop after the decline, but no trade cash moves.
  assert.deepEqual(controller.game.state.map(s => s.owner ?? null), before.owners);
  assert.ok(packet.events.some(e => e.type === 'TRADE_DECLINED'));
  assert.equal(proposal.target.id, human.id);
});
