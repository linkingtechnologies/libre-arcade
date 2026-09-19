import { SeededRng } from './rng.js';
import { createPlayer, createHumanPlayer } from './player.js';
import { isProperty, validateBoard } from './board.js';
import { getCpuProfile, isPazifikProfile, pazifikPurchaseDecision, pazifikAuctionCeiling, pazifikDetentionDecision } from '../players/profiles.js';
import { propertiesOwnedBy, propertyValue, rentFor, sameGroup } from './valuation.js';
import { proposeCpuTrade, targetAcceptsCpuTrade, executeTrade } from './trading.js';

export class Game {
  constructor({ board, agents = ['Zilla', 'Queen', 'Wallace', 'Hans'], participants = null, seed = 1, maxTurns = 6000, trace = false }) {
    validateBoard(board);
    const specs = participants ?? agents.map(name => ({ type: 'cpu', profile: name, name }));
    if (specs.length < 2 || specs.length > 8) throw new Error('KludgopolB supports 2-8 players');
    this.board = structuredClone(board);
    this.seed = Number(seed);
    this.rng = new SeededRng(this.seed);
    this.maxTurns = maxTurns;
    this.traceEnabled = trace;
    this.log = [];
    this.events = [];
    this.eventSequence = 0;
    this.turnNumber = 0;
    this.roundNumber = 0;
    this.pendingExternalTrade = null;
    this.state = this.board.spaces.map(space => isProperty(space)
      ? { owner: null, pledged: false, embellishments: 0 }
      : {});
    this.eventDecks = Object.fromEntries(Object.entries(this.board.events ?? {}).map(([k, cards]) => [k, this.rng.shuffle(cards)]));
    this.eventCursor = Object.fromEntries(Object.keys(this.eventDecks).map(k => [k, 0]));
    this.spaceStats = this.board.spaces.map(() => ({ landings: 0, acquisitions: 0, acquisitionSpend: 0, rentCollected: 0, embellishmentsBought: 0, embellishmentSpend: 0, embellishmentsGranted: 0, embellishmentsLost: 0 }));
    this.players = specs.map((spec, i) => {
      const seedForPlayer = (this.seed >>> 0) ^ Math.imul(i + 1, 0x9E3779B1);
      if (typeof spec === 'string') return createPlayer(i, spec, getCpuProfile(spec), this.board.startingCash, seedForPlayer);
      if (spec?.type === 'human') return createHumanPlayer(i, spec.name || `Player ${i + 1}`, this.board.startingCash, seedForPlayer);
      const profileName = spec?.profile || spec?.name;
      if (!profileName) throw new Error(`Missing CPU profile for participant ${i}`);
      const player = createPlayer(i, profileName, getCpuProfile(profileName), this.board.startingCash, seedForPlayer);
      player.name = spec.name || profileName;
      return player;
    });
    this.players = this.rng.shuffle(this.players);
    this.startOrder = this.players.map(p => p.name);
  }

  emit(type, data = {}) {
    const event = { id: ++this.eventSequence, type, turn: this.turnNumber, ...structuredClone(data) };
    this.events.push(event);
    return event;
  }

  drainEvents() {
    const out = this.events;
    this.events = [];
    return out;
  }

  trace(message, data = {}) {
    if (this.traceEnabled) this.log.push({ turn: this.turnNumber, message, ...data });
  }

  playerById(id) {
    return this.players.find(p => p.id === id);
  }

  activePlayers() {
    return this.players.filter(p => !p.bankrupt);
  }

  roll2d6() {
    const a = 1 + this.rng.int(6);
    const b = 1 + this.rng.int(6);
    return { a, b, total: a + b, doubles: a === b };
  }

  cashableWealth(player) {
    let total = player.cash;
    for (const { space, index } of propertiesOwnedBy(this, player)) {
      const st = this.state[index];
      if (!st.pledged) {
        total += Math.floor(space.price / 2);
        if (space.type === 'site') total += st.embellishments * Math.floor(space.buildCost * (this.board.development.sellPercent ?? 50) / 100);
      }
    }
    return total;
  }

  pledgeableWealth(player) {
    let total = player.cash;
    for (const { space, index } of propertiesOwnedBy(this, player)) {
      const st = this.state[index];
      if (st.pledged) continue;
      if (space.type === 'site') {
        const group = sameGroup(this.board, space);
        const groupHasEmbellishments = group.some(gs => this.state[this.board.spaces.indexOf(gs)].embellishments > 0);
        if (groupHasEmbellishments) continue;
      }
      total += Math.floor(space.price / 2);
    }
    return total;
  }

  move(player, amount, { salary = true } = {}) {
    const n = this.board.spaces.length;
    const old = player.position;
    let target = old + amount;
    if (amount > 0 && salary) {
      const laps = Math.floor(target / n) - Math.floor(old / n);
      if (laps > 0) {
        const amountPaid = laps * this.board.passStartSalary;
        player.cash += amountPaid;
        player.laps += laps;
        this.trace(`${player.name} passed Start`, { amount: amountPaid });
        this.emit('START_PASSED', { playerId: player.id, amount: amountPaid, laps });
        this.emit('CASH_CHANGED', { playerId: player.id, amount: amountPaid, reason: 'pass-start', balance: player.cash });
      }
    }
    target %= n;
    if (target < 0) target += n;
    player.position = target;
    this.emit('PLAYER_MOVED', { playerId: player.id, from: old, to: target, amount });
    return target;
  }

  sendToDetention(player) {
    const from = player.position;
    player.position = this.board.detentionIndex;
    player.detained = 1;
    this.trace(`${player.name} sent to detention`);
    this.emit('SENT_TO_BASE', { playerId: player.id, from, to: player.position });
  }

  drawEvent(deckName) {
    const deck = this.eventDecks[deckName];
    if (!deck?.length) throw new Error(`Missing event deck ${deckName}`);
    const cursor = this.eventCursor[deckName] % deck.length;
    const card = deck[cursor];
    this.eventCursor[deckName] = cursor + 1;
    return card;
  }

  applyEventCash(player, amount) {
    if (!amount || player.bankrupt) return true;
    if (amount > 0) {
      player.cash += amount;
      this.emit('CASH_CHANGED', { playerId: player.id, amount, reason: 'event', balance: player.cash });
      return true;
    }
    return this.pay(player, -amount, null);
  }

  ownedSiteCount(player) {
    return propertiesOwnedBy(this, player).filter(({ space }) => space.type === 'site').length;
  }

  ownedEmbellishmentCount(player) {
    return propertiesOwnedBy(this, player)
      .filter(({ space }) => space.type === 'site')
      .reduce((sum, { index }) => sum + this.state[index].embellishments, 0);
  }

  grantEventEmbellishment(player) {
    const max = this.board.development.maxEmbellishments;
    const candidates = propertiesOwnedBy(this, player)
      .filter(({ space, index }) => space.type === 'site'
        && this.ownsCompleteGroup(player, space)
        && !this.state[index].pledged
        && this.state[index].embellishments < max)
      .map(item => {
        const level = this.state[item.index].embellishments;
        const before = item.space.rents[Math.min(level, item.space.rents.length - 1)];
        const after = item.space.rents[Math.min(level + 1, item.space.rents.length - 1)];
        const score = (after - before) * (item.space.landingWeight ?? 1);
        return { ...item, level, score };
      })
      .sort((a, b) => a.level - b.level || b.score - a.score || a.index - b.index);
    if (!candidates.length) return false;
    const chosen = candidates[0];
    this.state[chosen.index].embellishments += 1;
    player.developments += 1;
    this.spaceStats[chosen.index].embellishmentsGranted += 1;
    this.trace(`${player.name} gained a free embellishment on ${(chosen.space.name ?? chosen.space.id)}`, { level: this.state[chosen.index].embellishments });
    this.emit('EMBELLISHMENT_GRANTED', { playerId: player.id, spaceId: chosen.space.id, index: chosen.index, level: this.state[chosen.index].embellishments });
    return true;
  }

  removeEventEmbellishment(player) {
    const candidates = propertiesOwnedBy(this, player)
      .filter(({ space, index }) => space.type === 'site' && this.state[index].embellishments > 0)
      .sort((a, b) => this.state[b.index].embellishments - this.state[a.index].embellishments
        || b.space.buildCost - a.space.buildCost
        || a.index - b.index);
    if (!candidates.length) return false;
    const chosen = candidates[0];
    this.state[chosen.index].embellishments -= 1;
    player.developments = Math.max(0, player.developments - 1);
    this.spaceStats[chosen.index].embellishmentsLost += 1;
    this.trace(`${player.name} lost an embellishment on ${(chosen.space.name ?? chosen.space.id)}`, { level: this.state[chosen.index].embellishments });
    this.emit('EMBELLISHMENT_LOST', { playerId: player.id, spaceId: chosen.space.id, index: chosen.index, level: this.state[chosen.index].embellishments });
    return true;
  }

  moveToIndexForward(player, targetIndex, { salary = true } = {}) {
    const n = this.board.spaces.length;
    const distance = (targetIndex - player.position + n) % n;
    this.move(player, distance, { salary });
    return targetIndex;
  }

  moveToSpaceId(player, spaceId, { salary = true } = {}) {
    const targetIndex = this.board.spaces.findIndex(space => space.id === spaceId);
    if (targetIndex < 0) throw new Error(`Missing destination space ${spaceId}`);
    return this.moveToIndexForward(player, targetIndex, { salary });
  }

  moveToNextType(player, type, { salary = true } = {}) {
    const n = this.board.spaces.length;
    for (let step = 1; step <= n; step += 1) {
      const index = (player.position + step) % n;
      if (this.board.spaces[index].type === type) {
        this.move(player, step, { salary });
        return index;
      }
    }
    throw new Error(`Missing destination type ${type}`);
  }

  applyEventCard(player, card, diceTotal, depth) {
    if (card.cash) this.applyEventCash(player, card.cash);
    if (player.bankrupt) return;

    if (card.cashPerOwnedSite) {
      const count = this.ownedSiteCount(player);
      const amount = count > 0 ? count * card.cashPerOwnedSite : (card.fallbackCash ?? 0);
      this.applyEventCash(player, amount);
    }
    if (player.bankrupt) return;

    if (card.cashPerEmbellishment) {
      const count = this.ownedEmbellishmentCount(player);
      const amount = count > 0 ? count * card.cashPerEmbellishment : (card.fallbackCash ?? 0);
      this.applyEventCash(player, amount);
    }
    if (player.bankrupt) return;

    if (card.grantEmbellishment && !this.grantEventEmbellishment(player) && card.fallbackCash) {
      this.applyEventCash(player, card.fallbackCash);
    }
    if (player.bankrupt) return;

    if (card.removeEmbellishment && !this.removeEventEmbellishment(player) && card.fallbackCash) {
      this.applyEventCash(player, card.fallbackCash);
    }
    if (player.bankrupt) return;

    if (card.detain) {
      this.sendToDetention(player);
      return null;
    }

    let moved = false;
    if (card.move) {
      this.move(player, card.move, { salary: card.move > 0 });
      moved = true;
    } else if (card.moveTo) {
      this.moveToSpaceId(player, card.moveTo, { salary: card.salary !== false });
      moved = true;
    } else if (card.moveToNextType) {
      this.moveToNextType(player, card.moveToNextType, { salary: card.salary !== false });
      moved = true;
    }
    if (moved && card.resolve !== false) return this.resolveSpace(player, diceTotal, depth + 1);
    return null;
  }

  resolveSpace(player, diceTotal, depth = 0) {
    if (depth > 6 || player.bankrupt) return;
    const index = player.position;
    const space = this.board.spaces[index];
    this.spaceStats[index].landings += 1;
    this.trace(`${player.name} landed on ${(space.name ?? space.id)}`, { index, type: space.type });
    this.emit('SPACE_LANDED', { playerId: player.id, index, spaceId: space.id, spaceType: space.type });

    if (isProperty(space)) {
      const st = this.state[index];
      if (st.owner == null) {
        return this.resolveUnownedProperty(player, index);
      } else if (st.owner !== player.id && !st.pledged) {
        const owner = this.playerById(st.owner);
        const rent = rentFor(this, index, diceTotal);
        if (rent > 0) {
          player.paidRent += rent;
          const collectible = Math.min(rent, this.cashableWealth(player));
          if (owner) owner.receivedRent += collectible;
          this.spaceStats[index].rentCollected += collectible;
          this.emit('RENT_DUE', { playerId: player.id, ownerId: owner?.id ?? null, index, spaceId: space.id, amount: rent });
          this.pay(player, rent, owner, { reason: 'rent', spaceId: space.id, index });
        }
      }
      return null;
    }

    if (space.type === 'tax') {
      this.pay(player, space.amount, null, { reason: 'tax', spaceId: space.id, index });
      return null;
    }

    if (space.type === 'moveToDetention') {
      this.sendToDetention(player);
      return;
    }

    if (space.type === 'neutral' && Number.isFinite(space.bonus) && space.bonus !== 0) {
      this.applyEventCash(player, space.bonus);
      return null;
    }

    if (space.type === 'event') {
      const card = this.drawEvent(space.deck);
      this.trace(`${player.name} drew ${card.id}`, { text: card.text ?? card.id });
      this.emit('CARD_DRAWN', { playerId: player.id, deck: space.deck, cardId: card.id, sourceSpaceId: space.id });
      return this.applyEventCard(player, card, diceTotal, depth);
    }
    return null;
  }

  resolveUnownedProperty(player, index) {
    const space = this.board.spaces[index];
    if (player.type === 'human') {
      return { type: 'BUY_PROPERTY', playerId: player.id, index, spaceId: space.id, price: space.price, cash: player.cash, cashableWealth: this.cashableWealth(player) };
    }
    if (isPazifikProfile(player.profile)) {
      // Clean behavioural reimplementation of JAtlantik r36 SimpleAI: raw cash only, strict >.
      if (pazifikPurchaseDecision({ cash: player.cash, price: space.price }) === 'BUY') {
        this.acquire(player, index, space.price, 'purchase');
        return null;
      }
      this.runAuction(index);
      return null;
    }
    // Faithful to KludgopolB PropertyUnownedWindow: CPU purchases whenever cashable wealth can cover price.
    if (this.cashableWealth(player) >= space.price) {
      this.acquire(player, index, space.price, 'purchase');
      return null;
    }
    this.runAuction(index);
    return null;
  }

  acquire(player, index, price, reason) {
    const space = this.board.spaces[index];
    this.state[index].owner = player.id;
    player.properties.push(index);
    if (reason === 'purchase') player.purchases += 1;
    if (reason === 'auction') player.auctionWins += 1;
    this.spaceStats[index].acquisitions += 1;
    this.spaceStats[index].acquisitionSpend += price;
    this.pay(player, price, null, { acquiredIndex: index, reason: 'acquisition', spaceId: space.id });
    this.trace(`${player.name} acquired ${(space.name ?? space.id)}`, { price, reason });
    this.emit('PROPERTY_ACQUIRED', { playerId: player.id, index, spaceId: space.id, price, reason });
  }

  runAuction(index, { humanBids = {} } = {}) {
    const space = this.board.spaces[index];
    const bidders = this.activePlayers().map(player => {
      if (player.type === 'human') {
        const raw = Number(humanBids[player.id] ?? 0);
        return { player, max: Math.max(0, Math.min(Math.floor(raw), this.cashableWealth(player))) };
      }
      if (isPazifikProfile(player.profile)) {
        const max = pazifikAuctionCeiling({ price: space.price, cash: player.cash });
        this.emit('AUCTION_LIMIT_SET', { playerId: player.id, index, spaceId: space.id, maxBid: max, policy: 'pazifik-minimum-increment' });
        return { player, max };
      }
      if (player.profile.randomBid) {
        return { player, max: player.cash > 0 ? this.rng.int(player.cash + 1) : 0 };
      }
      const value = propertyValue(this, player, index, player.profile, { randomUplift: true });
      return { player, max: Math.min(value, this.pledgeableWealth(player)) };
    }).filter(x => x.max > 0).sort((a, b) => b.max - a.max || a.player.id - b.player.id);

    if (!bidders.length) {
      this.emit('AUCTION_ENDED', { index, spaceId: space.id, winnerId: null, price: 0 });
      return null;
    }
    const winner = bidders[0];
    const second = bidders[1]?.max ?? 0;
    const increment = Math.max(1, Math.floor(space.price * (16 + this.rng.int(8)) / 100));
    const bid = Math.min(winner.max, Math.max(1, Math.min(second + 1, second + increment)));
    if (bid > 0) {
      this.acquire(winner.player, index, bid, 'auction');
      this.emit('AUCTION_ENDED', { index, spaceId: space.id, winnerId: winner.player.id, price: bid });
      return { winnerId: winner.player.id, price: bid };
    }
    return null;
  }

  pay(payer, amount, recipient = null, context = {}) {
    if (amount <= 0 || payer.bankrupt) return true;
    if (payer.cash < amount) this.liquidateToCash(payer, amount);
    const paid = Math.min(payer.cash, amount);
    payer.cash -= paid;
    if (recipient && !recipient.bankrupt) recipient.cash += paid;
    if (paid > 0) {
      this.emit('PAYMENT', { payerId: payer.id, recipientId: recipient?.id ?? null, amount: paid, requestedAmount: amount, reason: context.reason ?? null, spaceId: context.spaceId ?? null });
      this.emit('CASH_CHANGED', { playerId: payer.id, amount: -paid, reason: context.reason ?? 'payment', balance: payer.cash });
      if (recipient && !recipient.bankrupt) this.emit('CASH_CHANGED', { playerId: recipient.id, amount: paid, reason: context.reason ?? 'payment-received', balance: recipient.cash });
    }
    if (paid < amount) {
      this.bankrupt(payer, recipient, context);
      return false;
    }
    return true;
  }

  liquidateToCash(player, targetAmount) {
    if (isPazifikProfile(player.profile)) {
      // Minimal deterministic survival adapter: board order only, no valuation or fallback AI.
      while (player.cash < targetAmount) {
        const item = propertiesOwnedBy(this, player)
          .filter(({ space, index }) => space.type === 'site' && this.state[index].embellishments > 0)
          .sort((a, b) => a.index - b.index)[0];
        if (!item) break;
        this.state[item.index].embellishments -= 1;
        player.developments = Math.max(0, player.developments - 1);
        const proceeds = Math.floor(item.space.buildCost * (this.board.development.sellPercent ?? 50) / 100);
        player.cash += proceeds;
        this.emit('EMBELLISHMENT_SOLD', { playerId: player.id, index: item.index, spaceId: item.space.id, proceeds, level: this.state[item.index].embellishments, policy: 'pazifik-board-order' });
        this.emit('CASH_CHANGED', { playerId: player.id, amount: proceeds, reason: 'sell-embellishment', balance: player.cash });
      }
      if (player.cash >= targetAmount) return;
      const pledgeable = propertiesOwnedBy(this, player)
        .filter(({ index }) => !this.state[index].pledged)
        .sort((a, b) => a.index - b.index);
      for (const { space, index } of pledgeable) {
        if (player.cash >= targetAmount) break;
        this.state[index].pledged = true;
        const proceeds = Math.floor(space.price / 2);
        player.cash += proceeds;
        this.emit('PROPERTY_PLEDGED', { playerId: player.id, index, spaceId: space.id, proceeds, policy: 'pazifik-board-order' });
        this.emit('CASH_CHANGED', { playerId: player.id, amount: proceeds, reason: 'pledge', balance: player.cash });
      }
      return;
    }
    // Provisional KludgopolB parity: sell developments first, then pledge properties.
    while (player.cash < targetAmount) {
      const developed = propertiesOwnedBy(this, player)
        .filter(({ space, index }) => space.type === 'site' && this.state[index].embellishments > 0)
        .sort((a, b) => this.state[b.index].embellishments - this.state[a.index].embellishments || b.space.buildCost - a.space.buildCost);
      if (!developed.length) break;
      const item = developed[0];
      this.state[item.index].embellishments -= 1;
      player.developments = Math.max(0, player.developments - 1);
      const proceeds = Math.floor(item.space.buildCost * (this.board.development.sellPercent ?? 50) / 100);
      player.cash += proceeds;
      this.emit('EMBELLISHMENT_SOLD', { playerId: player.id, index: item.index, spaceId: item.space.id, proceeds, level: this.state[item.index].embellishments });
      this.emit('CASH_CHANGED', { playerId: player.id, amount: proceeds, reason: 'sell-embellishment', balance: player.cash });
    }

    if (player.cash >= targetAmount) return;
    const pledgeable = propertiesOwnedBy(this, player)
      .filter(({ index }) => !this.state[index].pledged)
      .sort((a, b) => b.space.price - a.space.price);
    for (const { space, index } of pledgeable) {
      if (player.cash >= targetAmount) break;
      this.state[index].pledged = true;
      const proceeds = Math.floor(space.price / 2);
      player.cash += proceeds;
      this.emit('PROPERTY_PLEDGED', { playerId: player.id, index, spaceId: space.id, proceeds });
      this.emit('CASH_CHANGED', { playerId: player.id, amount: proceeds, reason: 'pledge', balance: player.cash });
    }
  }

  bankrupt(player, creditor = null, context = {}) {
    if (player.bankrupt) return;
    player.bankrupt = true;
    this.trace(`${player.name} bankrupt`, { creditor: creditor?.name ?? 'bank', ...context });
    this.emit('PLAYER_BANKRUPT', { playerId: player.id, creditorId: creditor?.id ?? null, reason: context.reason ?? null });
    const owned = [...player.properties];
    for (const index of owned) {
      const st = this.state[index];
      const transferredEmbellishments = st.embellishments ?? 0;
      if (creditor && !creditor.bankrupt) {
        st.owner = creditor.id;
        creditor.properties.push(index);
        creditor.developments += transferredEmbellishments;
      } else {
        st.owner = null;
        st.pledged = false;
        st.embellishments = 0;
      }
    }
    player.properties = [];
    player.developments = 0;
    if (creditor && !creditor.bankrupt && player.cash > 0) creditor.cash += player.cash;
    player.cash = 0;
  }


  transferProperty(index, from, to) {
    const st = this.state[index];
    if (st.owner !== from.id) return false;
    st.owner = to.id;
    from.properties = from.properties.filter(i => i !== index);
    if (!to.properties.includes(index)) to.properties.push(index);
    this.emit('PROPERTY_TRANSFERRED', { index, spaceId: this.board.spaces[index].id, fromPlayerId: from.id, toPlayerId: to.id });
    return true;
  }

  attemptTrade(trader) {
    if (isPazifikProfile(trader.profile)) return false;
    // Port of PlayerCPUTrader + CPU branch of TradeAccepterWindow.
    // The original considers every eligible target, keeps proposals that the
    // trader itself considers worthwhile, shuffles those proposals, then lets
    // the selected target independently accept or decline.
    if (trader.bankrupt || trader.profile.tradeTendency <= 0) return false;
    const possible = [];
    for (const target of this.activePlayers()) {
      if (target.id === trader.id) continue;
      const proposal = proposeCpuTrade(this, trader, target);
      if (proposal.shouldTrade) possible.push(proposal);
    }
    if (!possible.length) return false;

    const proposal = this.rng.shuffle(possible)[0];
    trader.tradesProposed += 1;
    if (proposal.traderToGive.length + proposal.targetToGive.length === 0 && proposal.traderGivesCash === 0) {
      // TradeAccepterWindow cancels an empty proposal before the target makes a decision.
      this.trace(`${trader.name} generated an empty trade proposal`, { target: proposal.target.name });
      return false;
    }
    this.emit('TRADE_PROPOSED', { traderId: trader.id, targetId: proposal.target.id, traderToGive: proposal.traderToGive, targetToGive: proposal.targetToGive, cash: proposal.traderGivesCash });
    if (proposal.target.type === 'human') {
      this.pendingExternalTrade = proposal;
      return { pending: true, proposal };
    }
    const decision = targetAcceptsCpuTrade(this, proposal);
    this.trace(`${trader.name} proposed a trade to ${proposal.target.name}`, {
      traderToGive: proposal.traderToGive.map(i => (this.board.spaces[i].name ?? this.board.spaces[i].id)),
      targetToGive: proposal.targetToGive.map(i => (this.board.spaces[i].name ?? this.board.spaces[i].id)),
      cash: proposal.traderGivesCash,
      acceptanceChance: decision.chance
    });
    if (!decision.accepted) {
      this.emit('TRADE_DECLINED', { traderId: trader.id, targetId: proposal.target.id });
      return false;
    }
    if (!executeTrade(this, proposal)) return false;
    this.emit('TRADE_ACCEPTED', { traderId: trader.id, targetId: proposal.target.id, cash: proposal.traderGivesCash });
    this.trace(`${proposal.target.name} accepted ${trader.name}'s trade`, {
      cash: proposal.traderGivesCash
    });
    return true;
  }

  ownsCompleteGroup(player, site) {
    return sameGroup(this.board, site).every(gs => {
      const i = this.board.spaces.indexOf(gs);
      return this.state[i].owner === player.id;
    });
  }

  buildEmbellishment(player, index) {
    const space = this.board.spaces[index];
    const st = this.state[index];
    if (!space || space.type !== 'site' || st.owner !== player.id) throw new Error('Player does not own this Place');
    if (st.pledged) throw new Error('Pledged Places cannot be embellished');
    if (!this.ownsCompleteGroup(player, space)) throw new Error('Complete the world before embellishing a Place');
    if (st.embellishments >= this.board.development.maxEmbellishments) throw new Error('Place already has maximum embellishments');
    if (player.cash < space.buildCost) throw new Error('Not enough cash for embellishment');
    player.cash -= space.buildCost;
    st.embellishments += 1;
    player.developments += 1;
    this.spaceStats[index].embellishmentsBought += 1;
    this.spaceStats[index].embellishmentSpend += space.buildCost;
    this.emit('EMBELLISHMENT_BUILT', { playerId: player.id, index, spaceId: space.id, cost: space.buildCost, level: st.embellishments });
    this.emit('CASH_CHANGED', { playerId: player.id, amount: -space.buildCost, reason: 'build-embellishment', balance: player.cash });
    return true;
  }

  pledgeProperty(player, index) {
    const space = this.board.spaces[index];
    const st = this.state[index];
    if (!space || !isProperty(space) || st.owner !== player.id) throw new Error('Player does not own this property');
    if (st.pledged) throw new Error('Property is already pledged');
    if (space.type === 'site') {
      const group = sameGroup(this.board, space);
      if (group.some(gs => this.state[this.board.spaces.indexOf(gs)].embellishments > 0)) throw new Error('Sell world embellishments before pledging');
    }
    const proceeds = Math.floor(space.price / 2);
    st.pledged = true;
    player.cash += proceeds;
    this.emit('PROPERTY_PLEDGED', { playerId: player.id, index, spaceId: space.id, proceeds });
    this.emit('CASH_CHANGED', { playerId: player.id, amount: proceeds, reason: 'pledge', balance: player.cash });
    return proceeds;
  }

  redeemProperty(player, index) {
    const space = this.board.spaces[index];
    const st = this.state[index];
    if (!space || !isProperty(space) || st.owner !== player.id || !st.pledged) throw new Error('Property is not pledged by this player');
    const cost = Math.floor(space.price * 0.55 + 0.5);
    if (player.cash < cost) throw new Error('Not enough cash to redeem');
    player.cash -= cost;
    st.pledged = false;
    this.emit('PROPERTY_REDEEMED', { playerId: player.id, index, spaceId: space.id, cost });
    this.emit('CASH_CHANGED', { playerId: player.id, amount: -cost, reason: 'redeem', balance: player.cash });
    return cost;
  }

  sellEmbellishment(player, index) {
    const space = this.board.spaces[index];
    const st = this.state[index];
    if (!space || space.type !== 'site' || st.owner !== player.id || st.embellishments <= 0) throw new Error('No embellishment to sell');
    const proceeds = Math.floor(space.buildCost * (this.board.development.sellPercent ?? 50) / 100);
    st.embellishments -= 1;
    player.developments = Math.max(0, player.developments - 1);
    player.cash += proceeds;
    this.emit('EMBELLISHMENT_SOLD', { playerId: player.id, index, spaceId: space.id, proceeds, level: st.embellishments });
    this.emit('CASH_CHANGED', { playerId: player.id, amount: proceeds, reason: 'sell-embellishment', balance: player.cash });
    return proceeds;
  }

  availableHumanActions(player) {
    const owned = propertiesOwnedBy(this, player);
    return {
      develop: owned.filter(({ space, index }) => space.type === 'site' && !this.state[index].pledged && this.ownsCompleteGroup(player, space) && this.state[index].embellishments < this.board.development.maxEmbellishments && player.cash >= space.buildCost).map(({ index, space }) => ({ index, spaceId: space.id, cost: space.buildCost })),
      pledge: owned.filter(({ space, index }) => !this.state[index].pledged && (space.type !== 'site' || sameGroup(this.board, space).every(gs => this.state[this.board.spaces.indexOf(gs)].embellishments === 0))).map(({ index, space }) => ({ index, spaceId: space.id, proceeds: Math.floor(space.price / 2) })),
      redeem: owned.filter(({ index, space }) => this.state[index].pledged && player.cash >= Math.floor(space.price * 0.55 + 0.5)).map(({ index, space }) => ({ index, spaceId: space.id, cost: Math.floor(space.price * 0.55 + 0.5) })),
      sellEmbellishment: owned.filter(({ space, index }) => space.type === 'site' && this.state[index].embellishments > 0).map(({ index, space }) => ({ index, spaceId: space.id, proceeds: Math.floor(space.buildCost * (this.board.development.sellPercent ?? 50) / 100) })),
      tradeTargets: this.activePlayers().filter(p => p.id !== player.id).map(p => ({ playerId: p.id, name: p.name, type: p.type }))
    };
  }

  develop(player) {
    if (player.bankrupt || player.detained) return;
    const max = this.board.development.maxEmbellishments;
    if (isPazifikProfile(player.profile)) {
      // SimpleAI builds immediately whenever the engine allows it and raw cash covers the cost.
      // Fixed board order keeps the adaptation deterministic and deliberately non-strategic.
      for (let safety = 0; safety < this.board.spaces.length * Math.max(1, max); safety += 1) {
        const chosen = propertiesOwnedBy(this, player)
          .filter(({ space, index }) => space.type === 'site'
            && this.ownsCompleteGroup(player, space)
            && !this.state[index].pledged
            && this.state[index].embellishments < max
            && player.cash >= space.buildCost)
          .sort((a, b) => a.index - b.index)[0];
        if (!chosen) break;
        this.buildEmbellishment(player, chosen.index);
      }
      return;
    }
    for (let pass = 0; pass < 12; pass += 1) {
      const cashable = this.cashableWealth(player);
      const reserve = Math.floor(player.profile.reserveFromStartKept * cashable / 100);
      const candidates = propertiesOwnedBy(this, player)
        .filter(({ space, index }) => space.type === 'site'
          && this.ownsCompleteGroup(player, space)
          && !this.state[index].pledged
          && this.state[index].embellishments < max
          && player.cash - reserve >= space.buildCost)
        .map(item => {
          const level = this.state[item.index].embellishments;
          const before = item.space.rents[Math.min(level, item.space.rents.length - 1)];
          const after = item.space.rents[Math.min(level + 1, item.space.rents.length - 1)];
          const score = (after - before) * (item.space.landingWeight ?? 1) / Math.max(item.space.buildCost, 1);
          return { ...item, score };
        })
        .sort((a, b) => b.score - a.score);
      if (!candidates.length) break;
      const chosen = candidates[0];
      player.cash -= chosen.space.buildCost;
      this.spaceStats[chosen.index].embellishmentsBought += 1;
      this.spaceStats[chosen.index].embellishmentSpend += chosen.space.buildCost;
      this.state[chosen.index].embellishments += 1;
      player.developments += 1;
      this.trace(`${player.name} developed ${(chosen.space.name ?? chosen.space.id)}`, { level: this.state[chosen.index].embellishments });
      this.emit('EMBELLISHMENT_BUILT', { playerId: player.id, index: chosen.index, spaceId: chosen.space.id, cost: chosen.space.buildCost, level: this.state[chosen.index].embellishments });
      this.emit('CASH_CHANGED', { playerId: player.id, amount: -chosen.space.buildCost, reason: 'build-embellishment', balance: player.cash });
    }
  }

  playDetentionTurn(player) {
    if (isPazifikProfile(player.profile)) {
      const decision = pazifikDetentionDecision({ hasCard: (player.detentionCards ?? 0) > 0, cash: player.cash });
      this.emit('DETENTION_DECISION', { playerId: player.id, decision, policy: 'pazifik-simple-ai' });
      if (decision === 'USE_CARD') {
        player.detentionCards = Math.max(0, (player.detentionCards ?? 0) - 1);
        player.detained = 0;
        this.emit('DETENTION_CARD_USED', { playerId: player.id });
        const roll = this.roll2d6();
        this.emit('DICE_ROLLED', { playerId: player.id, ...roll, detention: false, afterCard: true });
        this.move(player, roll.total);
        this.resolveSpace(player, roll.total);
        return;
      }
      if (decision === 'PAY') {
        this.pay(player, this.board.detentionFee, null, { reason: 'base-camp-fee', policy: 'pazifik-simple-ai' });
        if (player.bankrupt) return;
        player.detained = 0;
        const roll = this.roll2d6();
        this.emit('DICE_ROLLED', { playerId: player.id, ...roll, detention: false, afterPayment: true });
        this.move(player, roll.total);
        this.resolveSpace(player, roll.total);
        return;
      }
      // ROLL branch falls through to the board's normal detention roll rules.
    }
    const roll = this.roll2d6();
    this.emit('DICE_ROLLED', { playerId: player.id, ...roll, detention: true });
    if (roll.doubles) {
      player.detained = 0;
      this.move(player, roll.total);
      this.resolveSpace(player, roll.total);
      return;
    }
    if (player.detained >= this.board.detentionTurns) {
      this.pay(player, this.board.detentionFee, null);
      if (player.bankrupt) return;
      player.detained = 0;
      this.move(player, roll.total);
      this.resolveSpace(player, roll.total);
    } else {
      player.detained += 1;
    }
  }

  playTurn(player) {
    if (player.type !== 'cpu') throw new Error('playTurn() is CPU-only; use GameController for human players');
    if (player.bankrupt) return null;
    player.turns += 1;
    this.turnNumber += 1;
    this.emit('TURN_STARTED', { playerId: player.id, playerType: player.type });
    if (isPazifikProfile(player.profile)) {
      // SimpleAI decision priority: build first, then deal with detention/roll; never initiate trades.
      this.develop(player);
      if (player.detained) {
        this.playDetentionTurn(player);
        this.emit('TURN_ENDED', { playerId: player.id });
        return null;
      }
      let doublesCount = 0;
      for (let rollNo = 0; rollNo < 3 && !player.bankrupt; rollNo += 1) {
        const roll = this.roll2d6();
        this.emit('DICE_ROLLED', { playerId: player.id, ...roll, rollNo: rollNo + 1 });
        doublesCount = roll.doubles ? doublesCount + 1 : 0;
        if (doublesCount >= 3) { this.sendToDetention(player); break; }
        this.move(player, roll.total);
        this.resolveSpace(player, roll.total);
        if (player.detained || !roll.doubles) break;
      }
      this.emit('TURN_ENDED', { playerId: player.id });
      return null;
    }
    if (player.detained) {
      this.playDetentionTurn(player);
      if (!player.bankrupt) {
        const trade = this.attemptTrade(player);
        if (trade?.pending) return { pending: true, stage: 'trade', proposal: trade.proposal };
        this.develop(player);
      }
      this.emit('TURN_ENDED', { playerId: player.id });
      return null;
    }

    let doublesCount = 0;
    for (let rollNo = 0; rollNo < 3 && !player.bankrupt; rollNo += 1) {
      const roll = this.roll2d6();
      this.emit('DICE_ROLLED', { playerId: player.id, ...roll, rollNo: rollNo + 1 });
      if (roll.doubles) doublesCount += 1;
      else doublesCount = 0;
      if (doublesCount >= 3) {
        this.sendToDetention(player);
        break;
      }
      this.move(player, roll.total);
      this.resolveSpace(player, roll.total);
      if (player.detained || !roll.doubles) break;
    }
    if (!player.bankrupt) {
      const trade = this.attemptTrade(player);
      if (trade?.pending) return { pending: true, stage: 'trade', proposal: trade.proposal };
      this.develop(player);
    }
    this.emit('TURN_ENDED', { playerId: player.id });
    return null;
  }

  serializeTradeProposal(proposal) {
    if (!proposal) return null;
    return {
      traderId: proposal.trader.id,
      targetId: proposal.target.id,
      traderToGive: [...proposal.traderToGive],
      targetToGive: [...proposal.targetToGive],
      traderGivesCash: proposal.traderGivesCash,
      shouldTrade: proposal.shouldTrade ?? true,
      transferValues: proposal.transferValues ? [...proposal.transferValues] : null,
      benefit: proposal.benefit ?? null
    };
  }

  hydrateTradeProposal(data) {
    if (!data) return null;
    const trader = this.playerById(data.traderId);
    const target = this.playerById(data.targetId);
    if (!trader || !target) throw new Error('Snapshot trade proposal references unknown player');
    return { ...structuredClone(data), trader, target };
  }

  toSnapshot() {
    return {
      schemaVersion: 1,
      boardId: this.board.id ?? null,
      boardContentVersion: this.board.contentVersion ?? null,
      seed: this.seed,
      maxTurns: this.maxTurns,
      traceEnabled: this.traceEnabled,
      turnNumber: this.turnNumber,
      roundNumber: this.roundNumber,
      rng: this.rng.toSnapshot(),
      players: this.players.map(player => ({
        id: player.id,
        name: player.name,
        type: player.type,
        profileName: player.profileName,
        decisionRng: player.decisionRng.toSnapshot(),
        cash: player.cash, position: player.position, detained: player.detained, detentionCards: player.detentionCards ?? 0, bankrupt: player.bankrupt,
        properties: [...player.properties], turns: player.turns, laps: player.laps, paidRent: player.paidRent, receivedRent: player.receivedRent,
        auctionWins: player.auctionWins, purchases: player.purchases, developments: player.developments, tradesProposed: player.tradesProposed, tradesAccepted: player.tradesAccepted
      })),
      state: structuredClone(this.state),
      eventDecks: structuredClone(this.eventDecks),
      eventCursor: structuredClone(this.eventCursor),
      spaceStats: structuredClone(this.spaceStats),
      startOrder: [...this.startOrder],
      log: structuredClone(this.log),
      eventQueue: structuredClone(this.events),
      eventSequence: this.eventSequence,
      pendingExternalTrade: this.serializeTradeProposal(this.pendingExternalTrade)
    };
  }

  static fromSnapshot({ board, snapshot }) {
    if (!snapshot || snapshot.schemaVersion !== 1) throw new Error('Unsupported game snapshot');
    validateBoard(board);
    if ((snapshot.boardId ?? null) !== (board.id ?? null) || (snapshot.boardContentVersion ?? null) !== (board.contentVersion ?? null)) throw new Error('Snapshot board/version mismatch');
    const participants = [...snapshot.players].sort((a, b) => a.id - b.id).map(p => p.type === 'human' ? { type: 'human', name: p.name } : { type: 'cpu', profile: p.profileName, name: p.name });
    const game = new Game({ board, participants, seed: snapshot.seed, maxTurns: snapshot.maxTurns, trace: snapshot.traceEnabled });
    game.turnNumber = snapshot.turnNumber;
    game.roundNumber = snapshot.roundNumber;
    game.rng.restore(snapshot.rng);
    const byId = new Map(game.players.map(p => [p.id, p]));
    // Constructor shuffles players, so restore the exact serialized order and fields by stable id.
    game.players = snapshot.players.map(saved => {
      const player = byId.get(saved.id);
      if (!player) throw new Error(`Missing restored player ${saved.id}`);
      Object.assign(player, structuredClone(saved));
      player.profile = saved.type === 'cpu' ? getCpuProfile(saved.profileName) : null;
      player.decisionRng = SeededRng.fromSnapshot(saved.decisionRng);
      return player;
    });
    game.state = structuredClone(snapshot.state);
    game.eventDecks = structuredClone(snapshot.eventDecks);
    game.eventCursor = structuredClone(snapshot.eventCursor);
    game.spaceStats = structuredClone(snapshot.spaceStats);
    game.startOrder = [...snapshot.startOrder];
    game.log = structuredClone(snapshot.log ?? []);
    game.events = structuredClone(snapshot.eventQueue ?? []);
    game.eventSequence = snapshot.eventSequence ?? 0;
    game.pendingExternalTrade = game.hydrateTradeProposal(snapshot.pendingExternalTrade);
    return game;
  }

  netWorth(player) {
    let worth = player.cash;
    for (const { space, index } of propertiesOwnedBy(this, player)) {
      const st = this.state[index];
      worth += st.pledged ? Math.floor(space.price / 2) : space.price;
      if (space.type === 'site') worth += st.embellishments * space.buildCost;
    }
    return worth;
  }

  run() {
    if (this.players.some(player => player.type === 'human')) throw new Error('run() cannot auto-play human participants; use GameController');
    while (this.activePlayers().length > 1 && this.turnNumber < this.maxTurns) {
      this.roundNumber += 1;
      for (const player of this.players) {
        if (this.activePlayers().length <= 1 || this.turnNumber >= this.maxTurns) break;
        this.playTurn(player);
      }
    }
    const alive = this.activePlayers();
    const ranked = [...this.players].sort((a, b) => {
      if (a.bankrupt !== b.bankrupt) return a.bankrupt ? 1 : -1;
      return this.netWorth(b) - this.netWorth(a);
    });
    const winner = alive.length === 1 ? alive[0] : ranked[0];
    return {
      seed: this.seed,
      completed: alive.length === 1,
      turns: this.turnNumber,
      rounds: this.roundNumber,
      startOrder: this.startOrder,
      winner: winner?.name ?? null,
      spaceStats: this.spaceStats.map((stats, index) => ({ index, name: (this.board.spaces[index].name ?? this.board.spaces[index].id), type: this.board.spaces[index].type, world: this.board.spaces[index].world ?? null, ...stats })),
      standings: ranked.map(p => ({
        name: p.name,
        bankrupt: p.bankrupt,
        cash: p.cash,
        netWorth: this.netWorth(p),
        properties: p.properties.length,
        purchases: p.purchases,
        auctionWins: p.auctionWins,
        developments: p.developments,
        paidRent: p.paidRent,
        receivedRent: p.receivedRent,
        tradesProposed: p.tradesProposed,
        tradesAccepted: p.tradesAccepted
      }))
    };
  }
}
