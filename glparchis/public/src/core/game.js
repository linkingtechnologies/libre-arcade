// SPDX-License-Identifier: GPL-3.0-only
import { BOARD_DATA } from './board-data.js';
import { SeededRng } from './rng.js';
import { selectOriginalAiPawn } from '../ai/original-ai.js';

const DEFAULT_NAMES = ['Yellowy', 'Bluey', 'Redy', 'Greeny', 'Graye', 'Pinky', 'Orangy', 'Cyanny'];

export class GlParchisGame {
  constructor(options = {}) {
    const maxPlayers = Number(options.maxPlayers ?? 4);
    if (![3, 4, 6, 8].includes(maxPlayers)) throw new Error('maxPlayers must be 3, 4, 6 or 8');
    this.board = BOARD_DATA[maxPlayers];
    this.maxPlayers = maxPlayers;
    this.difficulty = Number(options.difficulty ?? 70);
    this.rng = new SeededRng(options.seed ?? 0x47504c50, options.scriptedDice ?? []);
    this.events = [];
    this.arrivalCounter = 1;
    this.totalThrows = 0;
    this.winnerId = null;
    this.state = 'setup';

    const playerOptions = options.players ?? [];
    this.players = this.board.colors.map((color, id) => {
      const p = playerOptions[id] ?? {};
      return {
        id,
        color,
        name: p.name || DEFAULT_NAMES[id],
        ai: Boolean(p.ai ?? (id > 0)),
        plays: p.plays !== false,
        turnRolls: [],
        accumulated: null,
        lastMovedPawnId: null,
        captures: 0,
        captured: 0,
      };
    });

    this.pawns = [];
    for (const player of this.players) {
      for (let number = 0; number < 4; number++) {
        this.pawns.push({
          id: player.id * 4 + number,
          number,
          playerId: player.id,
          pos: 0,
          arrival: this.arrivalCounter++,
        });
      }
    }

    const active = this.activePlayers();
    if (!active.length) throw new Error('At least one player must be active');
    if (options.skipStart) {
      this.currentPlayerId = options.starterIndex ?? active[0].id;
      this.state = 'await-roll';
    } else {
      this.startContest(options.starterIndex);
    }
  }

  activePlayers() { return this.players.filter(p => p.plays); }
  player(id = this.currentPlayerId) { return this.players[id]; }
  pawnsOf(playerId) { return this.pawns.filter(p => p.playerId === playerId); }
  pawn(id) { return this.pawns.find(p => p.id === Number(id)); }
  routeFor(playerId) { return this.board.routes[playerId]; }
  square(id) { return this.board.squares[id]; }
  squareIdAt(pawn) { return this.routeFor(pawn.playerId)[pawn.pos]; }
  isHome(pawn) { return pawn.pos === 0; }
  isGoal(pawn) { return pawn.pos === this.routeFor(pawn.playerId).length - 1; }
  allOut(playerId) { return this.pawnsOf(playerId).every(p => !this.isHome(p)); }
  hasHome(playerId) { return this.pawnsOf(playerId).some(p => this.isHome(p)); }
  hasWon(playerId) { return this.pawnsOf(playerId).every(p => this.isGoal(p)); }
  lastRoll(playerId = this.currentPlayerId) {
    const arr = this.player(playerId).turnRolls;
    return arr.length ? arr[arr.length - 1] : null;
  }

  log(type, data = {}) {
    this.events.push({ n: this.events.length + 1, type, playerId: this.currentPlayerId, ...data });
  }

  startContest(forcedStarter) {
    const active = this.activePlayers();
    if (forcedStarter != null && active.some(p => p.id === forcedStarter)) {
      this.currentPlayerId = forcedStarter;
      this.state = 'await-roll';
      this.log('starter', { starterId: forcedStarter, rounds: [] });
      return forcedStarter;
    }

    let tied = [...active];
    const rounds = [];
    while (tied.length > 1) {
      const rolls = tied.map(p => ({ playerId: p.id, value: this.rng.d6() }));
      const max = Math.max(...rolls.map(r => r.value));
      const winners = rolls.filter(r => r.value === max).map(r => r.playerId);
      rounds.push(rolls);
      tied = tied.filter(p => winners.includes(p.id));
    }
    this.currentPlayerId = tied[0].id;
    this.state = 'await-roll';
    this.log('starter', { starterId: tied[0].id, rounds });
    return tied[0].id;
  }

  occupants(squareId) {
    return this.pawns.filter(p => this.squareIdAt(p) === squareId);
  }

  isBarrier(squareId) {
    const sq = this.square(squareId);
    if (!sq || sq.kind === 'home' || sq.kind === 'goal' || sq.capacity !== 2) return false;
    const occ = this.occupants(squareId);
    return occ.length === 2 && occ[0].playerId === occ[1].playerId;
  }

  playerBarrierSquares(playerId) {
    const result = [];
    for (const sq of this.board.squares) {
      if (!sq) continue;
      const occ = this.occupants(sq.id);
      if (occ.length === 2 && occ[0].playerId === playerId && occ[1].playerId === playerId && this.isBarrier(sq.id)) {
        result.push(sq.id);
      }
    }
    return result;
  }

  hasBarriers(playerId) { return this.playerBarrierSquares(playerId).length > 0; }

  isSquareSafeForPlayer(squareId, playerId, beforeMove = true) {
    const sq = this.square(squareId);
    if (!sq) return false;
    if (sq.owner !== -1) {
      if (playerId === sq.owner) return true;
      const ownerHasHome = this.hasHome(sq.owner);
      const count = this.occupants(squareId).length;
      if (beforeMove) return !(ownerHasHome && count === 0);
      return !(ownerHasHome && count === 1);
    }
    return Boolean(sq.safe);
  }

  mixedPlayersOnStart(playerId) {
    const startId = this.routeFor(playerId)[1];
    const occ = this.occupants(startId);
    return occ.length === 2 && occ[0].playerId !== occ[1].playerId;
  }

  movementFor(pawn, possibleDie = null, opts = {}) {
    const player = this.player(pawn.playerId);
    const die = possibleDie ?? this.lastRoll(pawn.playerId);
    if (!opts.ignoreAccumulated && player.accumulated != null) return player.accumulated;
    if (this.isHome(pawn) && die === 5) return 1;
    if (this.isHome(pawn) && die !== 5) return 0;
    if (this.allOut(pawn.playerId) && die === 6) return 7;
    if (possibleDie === 10 || possibleDie === 20) return possibleDie;
    return die;
  }

  canMovePhysical(pawn, possibleDie = null, opts = {}) {
    if (!pawn) return { ok: false, movement: 0, reason: 'missing-pawn' };
    if (!opts.ignoreCurrent && pawn.playerId !== this.currentPlayerId) return { ok: false, movement: 0, reason: 'not-current-player' };
    const player = this.player(pawn.playerId);
    if (!opts.ignoreAccumulated && player.accumulated != null && this.isHome(pawn)) return { ok: false, movement: 0, reason: 'bonus-cannot-leave-home' };
    const movement = this.movementFor(pawn, possibleDie, opts);
    if (!movement) return { ok: false, movement: 0, reason: 'no-movement' };

    const route = this.routeFor(pawn.playerId);
    const destPos = pawn.pos + movement;
    if (destPos > route.length - 1) return { ok: false, movement: 0, reason: 'past-goal' };

    for (let i = pawn.pos + 1; i <= destPos; i++) {
      if (this.isBarrier(route[i])) return { ok: false, movement: 0, reason: 'barrier' };
    }

    const destId = route[destPos];
    const sq = this.square(destId);
    const occ = this.occupants(destId);
    if (occ.length >= sq.capacity) {
      if (!(this.isHome(pawn) && (possibleDie ?? this.lastRoll()) === 5 && this.mixedPlayersOnStart(pawn.playerId))) {
        return { ok: false, movement: 0, reason: 'full' };
      }
    }
    return { ok: true, movement, destPos, destId };
  }

  isObligated(pawn) {
    const physical = this.canMovePhysical(pawn);
    if (!physical.ok) return false;
    const roll = this.lastRoll(pawn.playerId);
    if (roll === 5 && this.isHome(pawn)) {
      const startOcc = this.occupants(this.routeFor(pawn.playerId)[1]);
      if (startOcc.length < 2 || this.mixedPlayersOnStart(pawn.playerId)) return true;
    }
    if (roll === 6 && this.hasBarriers(pawn.playerId)) {
      return this.playerBarrierSquares(pawn.playerId).includes(this.squareIdAt(pawn));
    }
    return false;
  }

  anyObligated(playerId = this.currentPlayerId) {
    return this.pawnsOf(playerId).some(p => this.isObligated(p));
  }

  canMovePawn(pawn, possibleDie = null, opts = {}) {
    const physical = this.canMovePhysical(pawn, possibleDie, opts);
    if (!physical.ok) return physical;
    if (!opts.ignoreObligation && possibleDie == null && this.anyObligated(pawn.playerId) && !this.isObligated(pawn)) {
      return { ok: false, movement: 0, reason: this.lastRoll() === 5 ? 'must-leave-home' : 'must-open-barrier' };
    }
    return physical;
  }

  legalMoves(playerId = this.currentPlayerId) {
    return this.pawnsOf(playerId)
      .map(pawn => ({ pawn, ...this.canMovePawn(pawn) }))
      .filter(m => m.ok);
  }

  captureTarget(pawn, destPos) {
    const route = this.routeFor(pawn.playerId);
    const destId = route[destPos];
    const occ = this.occupants(destId);
    const roll = this.lastRoll(pawn.playerId);

    // Historical special case: leaving home with 5 can capture on the otherwise-safe start square.
    if (this.isHome(pawn) && roll === 5 && occ.length === 2) {
      const opponents = occ.filter(p => p.playerId !== pawn.playerId);
      if (!opponents.length) return null;
      if (opponents.length === 1) return opponents[0];
      return [...opponents].sort((a, b) => b.arrival - a.arrival)[0];
    }

    if (this.square(destId).safe) return null;
    if (occ.length === 1 && occ[0].playerId !== pawn.playerId) return occ[0];
    return null;
  }

  moveInfo(pawnId) {
    const pawn = this.pawn(pawnId);
    const c = this.canMovePawn(pawn);
    if (!c.ok) return c;
    const target = this.captureTarget(pawn, c.destPos);
    return {
      ...c,
      pawnId: pawn.id,
      capturePawnId: target?.id ?? null,
      reachesGoal: c.destPos === this.routeFor(pawn.playerId).length - 1,
    };
  }

  roll() {
    if (this.state !== 'await-roll') throw new Error(`Cannot roll while state=${this.state}`);
    const player = this.player();
    const value = this.rng.d6();
    player.turnRolls.push(value);
    this.totalThrows++;
    this.log('roll', { value });

    if (player.turnRolls.length === 3 && player.turnRolls.every(v => v === 6)) {
      const last = player.lastMovedPawnId != null ? this.pawn(player.lastMovedPawnId) : null;
      if (last) {
        const sq = this.square(this.squareIdAt(last));
        if (sq.ramp) {
          this.log('three-sixes-ramp-exempt', { pawnId: last.id });
        } else if (this.canMovePawn(last).ok) {
          this.sendHome(last, 'three-sixes');
          this.log('three-sixes-home', { pawnId: last.id });
        } else {
          this.log('three-sixes-immobile', { pawnId: last.id });
        }
      } else {
        this.log('three-sixes-no-last-pawn');
      }
      this.nextPlayer();
      return { value, state: this.state, threeSixes: true };
    }

    const legal = this.legalMoves();
    if (legal.length) {
      this.state = 'await-move';
    } else if (value === 6) {
      this.state = 'await-roll';
      this.log('six-roll-again-no-move');
    } else {
      this.nextPlayer();
    }
    return { value, state: this.state, legalPawnIds: legal.map(m => m.pawn.id) };
  }

  sendHome(pawn, reason = 'capture') {
    pawn.pos = 0;
    pawn.arrival = this.arrivalCounter++;
    this.log('pawn-home', { pawnId: pawn.id, reason });
  }

  movePawn(pawnId) {
    if (this.state !== 'await-move') throw new Error(`Cannot move while state=${this.state}`);
    const info = this.moveInfo(pawnId);
    if (!info.ok) return info;
    const pawn = this.pawn(pawnId);
    const player = this.player();
    const fromPos = pawn.pos;

    if (info.capturePawnId != null) {
      const victim = this.pawn(info.capturePawnId);
      this.sendHome(victim, 'captured');
      victimPlayer(this, victim).captured++;
      pawn.pos = info.destPos;
      pawn.arrival = this.arrivalCounter++;
      player.lastMovedPawnId = pawn.id;
      player.accumulated = 20;
      player.captures++;
      this.log('capture', { pawnId, victimPawnId: victim.id, fromPos, destPos: pawn.pos, bonus: 20 });
      if (this.checkWin(player.id)) return info;
      if (this.legalMoves().length) {
        this.state = 'await-move';
        return { ...info, bonus: 20 };
      }
    } else if (info.reachesGoal) {
      pawn.pos = info.destPos;
      pawn.arrival = this.arrivalCounter++;
      player.lastMovedPawnId = pawn.id;
      player.accumulated = 10;
      this.log('goal', { pawnId, fromPos, destPos: pawn.pos, bonus: 10 });
      if (this.checkWin(player.id)) return info;
      if (this.legalMoves().length) {
        this.state = 'await-move';
        return { ...info, bonus: 10 };
      }
    } else {
      pawn.pos = info.destPos;
      pawn.arrival = this.arrivalCounter++;
      player.lastMovedPawnId = pawn.id;
      this.log('move', { pawnId, fromPos, destPos: pawn.pos, movement: info.movement });
    }

    if (player.accumulated === 10 || player.accumulated === 20) player.accumulated = null;
    if (this.checkWin(player.id)) return info;
    if (this.lastRoll() === 6) {
      this.state = 'await-roll';
      this.log('six-roll-again');
    } else {
      this.nextPlayer();
    }
    return info;
  }

  checkWin(playerId) {
    if (!this.hasWon(playerId)) return false;
    this.winnerId = playerId;
    this.state = 'finished';
    this.log('win', { winnerId: playerId, score: this.score(playerId) });
    return true;
  }

  nextPlayer() {
    const active = this.activePlayers();
    const currentPos = active.findIndex(p => p.id === this.currentPlayerId);
    const next = active[(currentPos + 1 + active.length) % active.length];
    this.currentPlayerId = next.id;
    next.turnRolls = [];
    next.accumulated = null;
    next.lastMovedPawnId = null;
    this.state = 'await-roll';
    this.log('turn', { currentPlayerId: next.id });
  }

  aiSelectPawn() {
    return selectOriginalAiPawn(this, this.player());
  }

  aiStep() {
    if (!this.player().ai || this.state === 'finished') return null;
    if (this.state === 'await-roll') return { action: 'roll', result: this.roll() };
    if (this.state === 'await-move') {
      const pawn = this.aiSelectPawn();
      if (!pawn) {
        this.nextPlayer();
        return { action: 'pass' };
      }
      return { action: 'move', pawnId: pawn.id, result: this.movePawn(pawn.id) };
    }
    return null;
  }

  // Bug-for-bug port of SetAmenazas as it behaves when IASelectFicha calls it.
  // In the Python original, normal opponent threats call estaAutorizadaAMover(),
  // which in turn rejects every opponent because mem.jugadores.actual is the AI
  // player being evaluated. Those normal 1..7/10/20 threats therefore never
  // increment the set during AI selection. The only surviving branch is a very
  // narrow "leave home with 5" start-square case. We intentionally preserve it.
  historicalThreatCount(targetPawn, targetPos = targetPawn.pos) {
    const route = this.routeFor(targetPawn.playerId);
    const targetSquareId = route[targetPos];
    const sq = this.square(targetSquareId);
    if (!sq) return 0;

    // The original returns immediately for arrival ramps and for ordinary safe squares.
    if (sq.ramp) return 0;
    if (sq.safe && sq.owner === -1) return 0;

    // Historical special case for a player's start square (ruta1).
    // SetAmenazas only records it when the square currently contains two pawns,
    // the studied pawn is on somebody else's start, and that start owner still
    // has at least one pawn at home. A Python tuple-truthiness bug means the
    // original accepts the first home pawn without checking puedeComer()[0].
    if (sq.owner !== -1) {
      if (!this.hasHome(sq.owner)) return 0;
      if (this.occupants(targetSquareId).length !== 2) return 0;
      if (targetPawn.pos === 1) return 0;
      return 1;
    }

    // Normal threats are zero in the original AI context because opponent
    // canMovePhysical/puedeMover rejects non-current players.
    return 0;
  }

  // Backward-compatible alias used by earlier Phase 2/3 tests and documentation.
  threatCount(targetPawn, targetPos = targetPawn.pos) {
    return this.historicalThreatCount(targetPawn, targetPos);
  }

  remaining(playerId) {
    return this.pawnsOf(playerId).reduce((sum, p) => sum + (this.routeFor(playerId).length - p.pos), 0);
  }

  moved(playerId) {
    const routeLen = this.routeFor(playerId).length;
    return 4 * routeLen - this.remaining(playerId);
  }

  score(playerId) {
    const p = this.player(playerId);
    const othersRemaining = this.activePlayers().filter(o => o.id !== playerId).reduce((s, o) => s + this.remaining(o.id), 0);
    return 500 + (p.captures - p.captured) * 40 + this.moved(playerId) * 2 + othersRemaining * 5;
  }

  snapshot() {
    return {
      version: 1,
      maxPlayers: this.maxPlayers,
      difficulty: this.difficulty,
      currentPlayerId: this.currentPlayerId,
      state: this.state,
      winnerId: this.winnerId,
      arrivalCounter: this.arrivalCounter,
      totalThrows: this.totalThrows,
      rng: this.rng.snapshot(),
      players: this.players.map(p => ({ ...p, color: undefined })),
      pawns: this.pawns.map(p => ({ ...p })),
      events: this.events.slice(-200),
    };
  }

  static fromSnapshot(s) {
    const game = new GlParchisGame({
      maxPlayers: s.maxPlayers,
      difficulty: s.difficulty,
      seed: s.rng?.state ?? 1,
      scriptedDice: s.rng?.scripted ?? [],
      players: s.players,
      skipStart: true,
      starterIndex: s.currentPlayerId,
    });
    game.currentPlayerId = s.currentPlayerId;
    game.state = s.state;
    game.winnerId = s.winnerId;
    game.arrivalCounter = s.arrivalCounter;
    game.totalThrows = s.totalThrows;
    game.players.forEach((p, i) => Object.assign(p, s.players[i], { color: game.board.colors[i] }));
    game.pawns = s.pawns.map(p => ({ ...p }));
    game.events = s.events ?? [];
    return game;
  }
}

function victimPlayer(game, pawn) {
  return game.player(pawn.playerId);
}
