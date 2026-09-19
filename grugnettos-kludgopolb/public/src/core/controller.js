import { Game } from './game.js';
import { canTradeIndexes, executeTrade, targetAcceptsCpuTrade } from './trading.js';

function clone(value) {
  return value == null ? value : structuredClone(value);
}

export class GameController {
  constructor({ game }) {
    if (!(game instanceof Game)) throw new Error('GameController requires a Game instance');
    this.game = game;
    this.currentIndex = -1;
    this.pendingDecision = null;
    this.humanTurn = null;
    this.resume = null;
    this.status = 'running';
  }

  static create(options) {
    return new GameController({ game: new Game(options) });
  }

  currentPlayer() {
    return this.currentIndex >= 0 ? this.game.players[this.currentIndex] : null;
  }

  isComplete() {
    return this.game.activePlayers().length <= 1 || this.game.turnNumber >= this.game.maxTurns;
  }

  _setPending(type, data = {}) {
    this.pendingDecision = { type, ...clone(data) };
  }

  _clearPending() {
    this.pendingDecision = null;
  }

  _nextActivePlayer() {
    const count = this.game.players.length;
    for (let tries = 0; tries < count; tries += 1) {
      this.currentIndex += 1;
      if (this.currentIndex >= count) {
        this.currentIndex = 0;
        this.game.roundNumber += 1;
      } else if (this.currentIndex === 0 && this.game.roundNumber === 0) {
        this.game.roundNumber = 1;
      }
      const player = this.game.players[this.currentIndex];
      if (!player.bankrupt) return player;
    }
    return null;
  }

  _finishIfComplete() {
    if (!this.isComplete()) return false;
    this.status = 'complete';
    this._clearPending();
    const alive = this.game.activePlayers();
    const ranked = [...this.game.players].sort((a, b) => {
      if (a.bankrupt !== b.bankrupt) return a.bankrupt ? 1 : -1;
      return this.game.netWorth(b) - this.game.netWorth(a);
    });
    const winner = alive.length === 1 ? alive[0] : ranked[0];
    this.game.emit('GAME_ENDED', { winnerId: winner?.id ?? null, completedNaturally: alive.length === 1 });
    return true;
  }

  _packet() {
    return {
      status: this.status,
      pendingDecision: clone(this.pendingDecision),
      events: this.game.drainEvents(),
      state: this.getPublicState()
    };
  }

  getPublicState() {
    return {
      schemaVersion: 1,
      boardId: this.game.board.id ?? null,
      boardContentVersion: this.game.board.contentVersion ?? null,
      seed: this.game.seed,
      turnNumber: this.game.turnNumber,
      roundNumber: this.game.roundNumber,
      currentPlayerId: this.currentPlayer()?.id ?? null,
      status: this.status,
      players: this.game.players.map(p => ({
        id: p.id,
        name: p.name,
        type: p.type,
        profileName: p.profileName,
        cash: p.cash,
        position: p.position,
        detained: p.detained,
        bankrupt: p.bankrupt,
        properties: [...p.properties],
        netWorth: this.game.netWorth(p)
      })),
      spaces: this.game.state.map((st, index) => ({ index, spaceId: this.game.board.spaces[index].id, ...clone(st) })),
      pendingDecision: clone(this.pendingDecision)
    };
  }

  _setTurnReview(player, reviewEvents = []) {
    this._setPending('TURN_REVIEW', { playerId: player?.id ?? null, reviewEvents: clone(reviewEvents) });
  }

  advance() {
    if (this.pendingDecision || this.status === 'complete') return this._packet();
    while (!this.pendingDecision && this.status === 'running') {
      if (this._finishIfComplete()) break;
      const player = this._nextActivePlayer();
      if (!player) {
        this._finishIfComplete();
        break;
      }
      if (player.type === 'human') {
        this._startHumanTurn(player);
        break;
      }
      const eventStartIndex = this.game.events.length;
      const outcome = this.game.playTurn(player);
      const reviewEvents = this.game.events.slice(eventStartIndex);
      if (outcome?.pending && outcome.stage === 'trade') {
        const proposal = this.game.serializeTradeProposal(outcome.proposal);
        this.resume = { type: 'cpu-post-trade', playerId: player.id, reviewEvents: clone(reviewEvents) };
        this._setPending('TRADE_OFFER', { playerId: outcome.proposal.target.id, proposal });
        break;
      }
      this._setTurnReview(player, reviewEvents);
      break;
    }
    return this._packet();
  }

  _startHumanTurn(player) {
    player.turns += 1;
    this.game.turnNumber += 1;
    this.humanTurn = { playerId: player.id, doublesCount: 0, lastRoll: null, forceNoExtraRoll: false };
    this.game.emit('TURN_STARTED', { playerId: player.id, playerType: 'human' });
    if (player.detained) {
      this._setPending('DETENTION_ACTION', {
        playerId: player.id,
        fee: this.game.board.detentionFee,
        detainedTurns: player.detained,
        maxDetentionTurns: this.game.board.detentionTurns,
        actions: ['ROLL_DICE', 'PAY_DETENTION']
      });
    } else {
      this._setPending('ROLL_DICE', { playerId: player.id });
    }
  }

  _humanPlayer() {
    const player = this.game.playerById(this.humanTurn?.playerId);
    if (!player || player.type !== 'human') throw new Error('No active human turn');
    return player;
  }

  _resolveHumanLanding(player, roll, { forceNoExtraRoll = false } = {}) {
    const decision = this.game.resolveSpace(player, roll.total);
    this.humanTurn.lastRoll = clone(roll);
    this.humanTurn.forceNoExtraRoll = forceNoExtraRoll;
    if (decision?.type === 'BUY_PROPERTY') {
      this._setPending('BUY_PROPERTY', { ...decision, actions: ['BUY', 'AUCTION'] });
      return;
    }
    this._afterHumanLanding();
  }

  _afterHumanLanding() {
    const player = this._humanPlayer();
    if (player.bankrupt) return this._endHumanTurn();
    const roll = this.humanTurn.lastRoll;
    if (!this.humanTurn.forceNoExtraRoll && roll?.doubles && !player.detained && this.humanTurn.doublesCount < 3) {
      this._setPending('ROLL_DICE', { playerId: player.id, extraRoll: true });
      return;
    }
    this._enterHumanActions();
  }

  _enterHumanActions() {
    const player = this._humanPlayer();
    const actions = this.game.availableHumanActions(player);
    if (player.detained) actions.develop = [];
    this._setPending('TURN_ACTIONS', { playerId: player.id, actions });
  }

  _endHumanTurn() {
    const player = this._humanPlayer();
    this.game.emit('TURN_ENDED', { playerId: player.id });
    this.humanTurn = null;
    this.resume = null;
    this._clearPending();
    return this.advance();
  }

  _rollHuman(player) {
    const roll = this.game.roll2d6();
    this.game.emit('DICE_ROLLED', { playerId: player.id, ...roll, rollNo: this.humanTurn.doublesCount + 1 });
    if (roll.doubles) this.humanTurn.doublesCount += 1;
    else this.humanTurn.doublesCount = 0;
    if (this.humanTurn.doublesCount >= 3) {
      this.game.sendToDetention(player);
      this.humanTurn.lastRoll = clone(roll);
      this.humanTurn.forceNoExtraRoll = true;
      this._enterHumanActions();
      return;
    }
    this.game.move(player, roll.total);
    this._resolveHumanLanding(player, roll);
  }

  _rollFromDetention(player) {
    const roll = this.game.roll2d6();
    this.game.emit('DICE_ROLLED', { playerId: player.id, ...roll, detention: true });
    if (roll.doubles) {
      player.detained = 0;
      this.game.move(player, roll.total);
      this._resolveHumanLanding(player, roll, { forceNoExtraRoll: true });
      return;
    }
    if (player.detained >= this.game.board.detentionTurns) {
      this.game.pay(player, this.game.board.detentionFee, null, { reason: 'base-camp-fee' });
      if (player.bankrupt) return this._endHumanTurn();
      player.detained = 0;
      this.game.move(player, roll.total);
      this._resolveHumanLanding(player, roll, { forceNoExtraRoll: true });
      return;
    }
    player.detained += 1;
    this.humanTurn.lastRoll = clone(roll);
    this.humanTurn.forceNoExtraRoll = true;
    this._enterHumanActions();
  }

  _auctionDecision(index) {
    const space = this.game.board.spaces[index];
    const humans = this.game.activePlayers().filter(p => p.type === 'human').map(p => ({ playerId: p.id, name: p.name, maxBid: this.game.cashableWealth(p) }));
    this._setPending('AUCTION_BIDS', { index, spaceId: space.id, humanBidders: humans });
  }

  _proposalFromAction(trader, action) {
    const target = this.game.playerById(Number(action.targetId));
    if (!target || target.bankrupt || target.id === trader.id) throw new Error('Invalid trade target');
    const traderToGive = [...new Set((action.traderToGive ?? []).map(Number))];
    const targetToGive = [...new Set((action.targetToGive ?? []).map(Number))];
    const tradeableTrader = new Set(canTradeIndexes(this.game, trader));
    const tradeableTarget = new Set(canTradeIndexes(this.game, target));
    if (traderToGive.some(i => !tradeableTrader.has(i)) || targetToGive.some(i => !tradeableTarget.has(i))) throw new Error('Trade contains a non-tradeable property');
    const cash = Math.trunc(Number(action.cash ?? 0));
    if (cash > trader.cash || cash < -target.cash) throw new Error('Trade cash exceeds available balance');
    if (traderToGive.length + targetToGive.length === 0 && cash === 0) throw new Error('Empty trade');
    return { trader, target, traderToGive, targetToGive, traderGivesCash: cash, shouldTrade: true };
  }

  _handleTradeOffer(action) {
    const data = this.pendingDecision.proposal;
    const proposal = this.game.hydrateTradeProposal(data);
    const accepted = action.type === 'ACCEPT_TRADE';
    if (!accepted && action.type !== 'DECLINE_TRADE') throw new Error('TRADE_OFFER expects ACCEPT_TRADE or DECLINE_TRADE');
    if (accepted) {
      if (!executeTrade(this.game, proposal)) throw new Error('Trade could not be executed');
      this.game.emit('TRADE_ACCEPTED', { traderId: proposal.trader.id, targetId: proposal.target.id, cash: proposal.traderGivesCash });
    } else {
      this.game.emit('TRADE_DECLINED', { traderId: proposal.trader.id, targetId: proposal.target.id });
    }
    this.game.pendingExternalTrade = null;
    const resume = this.resume;
    this._clearPending();
    this.resume = null;
    if (resume?.type === 'cpu-post-trade') {
      const cpu = this.game.playerById(resume.playerId);
      const eventStartIndex = this.game.events.length;
      if (cpu && !cpu.bankrupt) this.game.develop(cpu);
      if (cpu) this.game.emit('TURN_ENDED', { playerId: cpu.id });
      const reviewEvents = [...(resume.reviewEvents ?? []), ...this.game.events.slice(eventStartIndex)];
      this._setTurnReview(cpu, reviewEvents);
      return this._packet();
    }
    if (resume?.type === 'human-actions') {
      this.humanTurn = clone(resume.humanTurn);
      this._enterHumanActions();
      return this._packet();
    }
    return this.advance();
  }

  dispatch(action) {
    if (!action?.type) throw new Error('Action type is required');
    if (!this.pendingDecision) throw new Error('No decision is pending');
    const pending = this.pendingDecision.type;

    if (pending === 'TRADE_OFFER') return this._handleTradeOffer(action);
    if (pending === 'TURN_REVIEW') {
      if (action.type !== 'ACK_TURN') throw new Error('TURN_REVIEW expects ACK_TURN');
      this._clearPending();
      return this.advance();
    }

    const player = this._humanPlayer();
    if (this.pendingDecision.playerId != null && this.pendingDecision.playerId !== player.id) throw new Error('Action belongs to another player');

    if (pending === 'DETENTION_ACTION') {
      if (action.type === 'PAY_DETENTION') {
        this.game.pay(player, this.game.board.detentionFee, null, { reason: 'base-camp-fee' });
        if (player.bankrupt) return this._endHumanTurn();
        player.detained = 0;
        this._setPending('ROLL_DICE', { playerId: player.id, afterPayment: true });
        return this._packet();
      }
      if (action.type === 'ROLL_DICE') {
        this._clearPending();
        this._rollFromDetention(player);
        return this._packet();
      }
      throw new Error('Invalid Base Camp action');
    }

    if (pending === 'ROLL_DICE') {
      if (action.type !== 'ROLL_DICE') throw new Error('ROLL_DICE decision expected');
      this._clearPending();
      this._rollHuman(player);
      return this._packet();
    }

    if (pending === 'BUY_PROPERTY') {
      const index = this.pendingDecision.index;
      const space = this.game.board.spaces[index];
      if (action.type === 'BUY') {
        if (player.cash < space.price) throw new Error('Not enough cash to buy this Place directly');
        this.game.acquire(player, index, space.price, 'purchase');
        this._clearPending();
        this._afterHumanLanding();
        return this._packet();
      }
      if (action.type === 'AUCTION' || action.type === 'DECLINE') {
        this._auctionDecision(index);
        return this._packet();
      }
      throw new Error('BUY_PROPERTY expects BUY or AUCTION');
    }

    if (pending === 'AUCTION_BIDS') {
      if (action.type !== 'RESOLVE_AUCTION') throw new Error('AUCTION_BIDS expects RESOLVE_AUCTION');
      this.game.runAuction(this.pendingDecision.index, { humanBids: action.bids ?? {} });
      this._clearPending();
      this._afterHumanLanding();
      return this._packet();
    }

    if (pending === 'TURN_ACTIONS') {
      if (action.type === 'BUILD_EMBELLISHMENT') this.game.buildEmbellishment(player, Number(action.index));
      else if (action.type === 'PLEDGE_PROPERTY') this.game.pledgeProperty(player, Number(action.index));
      else if (action.type === 'REDEEM_PROPERTY') this.game.redeemProperty(player, Number(action.index));
      else if (action.type === 'SELL_EMBELLISHMENT') this.game.sellEmbellishment(player, Number(action.index));
      else if (action.type === 'PROPOSE_TRADE') {
        const proposal = this._proposalFromAction(player, action);
        player.tradesProposed += 1;
        this.game.emit('TRADE_PROPOSED', { traderId: player.id, targetId: proposal.target.id, traderToGive: proposal.traderToGive, targetToGive: proposal.targetToGive, cash: proposal.traderGivesCash });
        if (proposal.target.type === 'human') {
          this.resume = { type: 'human-actions', humanTurn: clone(this.humanTurn) };
          this._setPending('TRADE_OFFER', { playerId: proposal.target.id, proposal: this.game.serializeTradeProposal(proposal) });
          return this._packet();
        }
        const decision = targetAcceptsCpuTrade(this.game, proposal);
        if (decision.accepted && executeTrade(this.game, proposal)) this.game.emit('TRADE_ACCEPTED', { traderId: player.id, targetId: proposal.target.id, cash: proposal.traderGivesCash });
        else this.game.emit('TRADE_DECLINED', { traderId: player.id, targetId: proposal.target.id });
      } else if (action.type === 'END_TURN') {
        return this._endHumanTurn();
      } else throw new Error('Unknown turn action');
      this._enterHumanActions();
      return this._packet();
    }

    throw new Error(`Unsupported pending decision ${pending}`);
  }

  toSnapshot() {
    return {
      schemaVersion: 1,
      game: this.game.toSnapshot(),
      currentIndex: this.currentIndex,
      pendingDecision: clone(this.pendingDecision),
      humanTurn: clone(this.humanTurn),
      resume: clone(this.resume),
      status: this.status
    };
  }

  static fromSnapshot({ board, snapshot }) {
    if (!snapshot || snapshot.schemaVersion !== 1) throw new Error('Unsupported controller snapshot');
    const controller = new GameController({ game: Game.fromSnapshot({ board, snapshot: snapshot.game }) });
    controller.currentIndex = snapshot.currentIndex;
    controller.pendingDecision = clone(snapshot.pendingDecision);
    controller.humanTurn = clone(snapshot.humanTurn);
    controller.resume = clone(snapshot.resume);
    controller.status = snapshot.status;
    return controller;
  }
}
